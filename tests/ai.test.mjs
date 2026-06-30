import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { buildMarkdownFiles, callOpenAICompatible, hasUsableApiConfig, runInterviewTurn, testConnection } from "../packages/ai/src/index.js";
import { createExampleSpec, markdownFileNames } from "../packages/core/src/index.js";

async function withMockOpenAI(handler) {
  const requests = [];
  const server = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const bodyText = Buffer.concat(chunks).toString("utf8");
    const body = bodyText ? JSON.parse(bodyText) : {};
    requests.push({
      method: req.method,
      url: req.url,
      authorization: req.headers.authorization,
      body
    });
    await handler(req, res, body);
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  return {
    baseUrl: `http://127.0.0.1:${port}/v1`,
    requests,
    close: () => new Promise((resolve) => server.close(resolve))
  };
}

function sendJson(res, status, payload) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(payload));
}

test("OpenAI-compatible 调用使用 chat/completions、Bearer Key 和 JSON response_format", async () => {
  const mock = await withMockOpenAI((req, res) => {
    sendJson(res, 200, { choices: [{ message: { content: "{\"ok\":true}" } }] });
  });

  try {
    const content = await callOpenAICompatible(
      {
        baseUrl: mock.baseUrl,
        apiKey: "sk-test-secret",
        modelName: "test-model",
        requestMode: "direct",
        temperature: 0.2,
        maxTokens: 123
      },
      [{ role: "user", content: "ping" }]
    );

    assert.equal(content, "{\"ok\":true}");
    assert.equal(mock.requests.length, 1);
    assert.equal(mock.requests[0].method, "POST");
    assert.equal(mock.requests[0].url, "/v1/chat/completions");
    assert.equal(mock.requests[0].authorization, "Bearer sk-test-secret");
    assert.equal(mock.requests[0].body.model, "test-model");
    assert.equal(mock.requests[0].body.temperature, 0.2);
    assert.equal(mock.requests[0].body.max_tokens, 123);
    assert.deepEqual(mock.requests[0].body.response_format, { type: "json_object" });
  } finally {
    await mock.close();
  }
});

test("API 配置会清理前后空格，纯空白配置不可用", async () => {
  assert.equal(hasUsableApiConfig({ baseUrl: "   ", apiKey: "   ", modelName: "   " }), false);

  const mock = await withMockOpenAI((req, res) => {
    sendJson(res, 200, { choices: [{ message: { content: "{\"ok\":true}" } }] });
  });

  try {
    const content = await callOpenAICompatible(
      {
        baseUrl: ` ${mock.baseUrl}/ `,
        apiKey: " sk-test-secret ",
        modelName: " test-model ",
        requestMode: "direct"
      },
      [{ role: "user", content: "ping" }]
    );

    assert.equal(content, "{\"ok\":true}");
    assert.equal(mock.requests[0].url, "/v1/chat/completions");
    assert.equal(mock.requests[0].authorization, "Bearer sk-test-secret");
    assert.equal(mock.requests[0].body.model, "test-model");
  } finally {
    await mock.close();
  }
});

test("testConnection 能解析 OpenAI-compatible JSON 响应", async () => {
  const mock = await withMockOpenAI((req, res) => {
    sendJson(res, 200, { choices: [{ message: { content: "{\"ok\":true,\"message\":\"连接成功\"}" } }] });
  });

  try {
    const result = await testConnection({
      baseUrl: mock.baseUrl,
      apiKey: "sk-test-secret",
      modelName: "test-model",
      requestMode: "direct"
    });

    assert.deepEqual(result, { ok: true, message: "连接成功" });
  } finally {
    await mock.close();
  }
});

test("OpenAI-compatible 错误响应会保留 HTTP 状态和错误信息", async () => {
  const mock = await withMockOpenAI((req, res) => {
    sendJson(res, 401, { error: { message: "invalid key" } });
  });

  try {
    await assert.rejects(
      () =>
        callOpenAICompatible(
          {
            baseUrl: mock.baseUrl,
            apiKey: "sk-bad",
            modelName: "test-model",
            requestMode: "direct"
          },
          [{ role: "user", content: "ping" }]
        ),
      /HTTP 401 - invalid key/
    );
  } finally {
    await mock.close();
  }
});

test("JSON response_format 不被兼容服务支持时会自动降级重试", async () => {
  let count = 0;
  const mock = await withMockOpenAI((req, res, body) => {
    count += 1;
    if (body.response_format) {
      sendJson(res, 400, { error: { message: "response_format is not supported" } });
      return;
    }
    sendJson(res, 200, { choices: [{ message: { content: "{\"ok\":true}" } }] });
  });

  try {
    const content = await callOpenAICompatible(
      {
        baseUrl: mock.baseUrl,
        apiKey: "sk-test-secret",
        modelName: "test-model",
        requestMode: "direct"
      },
      [{ role: "user", content: "ping" }]
    );

    assert.equal(content, "{\"ok\":true}");
    assert.equal(count, 2);
    assert.deepEqual(mock.requests[0].body.response_format, { type: "json_object" });
    assert.equal(mock.requests[1].body.response_format, undefined);
  } finally {
    await mock.close();
  }
});

test("Markdown 生成请求失败时会降级使用本地模板", async () => {
  const mock = await withMockOpenAI((req, res) => {
    sendJson(res, 502, { error: { message: "upstream unavailable" } });
  });

  try {
    const files = await buildMarkdownFiles(
      {
        baseUrl: mock.baseUrl,
        apiKey: "sk-test-secret",
        modelName: "test-model",
        requestMode: "direct"
      },
      createExampleSpec()
    );

    assert.deepEqual(Object.keys(files).sort(), [...markdownFileNames].sort());
    assert.match(files["START.md"], /启动指令/);
  } finally {
    await mock.close();
  }
});

test("访谈会过滤已问过的同主题问题并收口给 Agent", async () => {
  const mock = await withMockOpenAI((req, res) => {
    sendJson(res, 200, {
      choices: [
        {
          message: {
            content: JSON.stringify({
              summary: "继续访谈",
              extractedFacts: { coreGoal: "做数据复盘工具" },
              missingFields: [],
              riskFlags: [],
              confidenceScore: 0.7,
              questions: [
                {
                  id: "weights-again",
                  type: "single",
                  question: "关于点赞、收藏、评论、关注、私信的数据复盘权重，你是否接受默认比例？",
                  why: "确认复盘算法",
                  required: true,
                  options: [{ label: "接受", description: "" }]
                }
              ],
              isReadyToGenerateSpec: false
            })
          }
        }
      ]
    });
  });

  try {
    const turn = await runInterviewTurn(
      {
        baseUrl: mock.baseUrl,
        apiKey: "sk-test-secret",
        modelName: "test-model",
        requestMode: "direct"
      },
      {
        projectDraft: {
          projectName: "内容数据复盘工具",
          oneLineIdea: "分析小红书内容数据并给出复盘建议",
          codingExperience: "代码小白"
        },
        transcript: [
          {
            questions: [
              {
                id: "weights",
                question: "默认权重为点赞30%、收藏20%、评论20%、关注15%、私信15%，你是否接受？"
              }
            ],
            answers: { weights: "交给 Agent 推荐" }
          },
          {
            questions: [{ id: "scope", question: "第一版要服务哪些用户？" }],
            answers: { scope: "内容运营" }
          }
        ],
        draftSpec: {}
      }
    );

    assert.doesNotMatch(turn.questions[0].question, /点赞|收藏|权重/);
    assert.match(turn.questions[0].question, /Codex\/OpenCode|Agent|业务边界/);
    assert.equal(turn.isReadyToGenerateSpec, true);
  } finally {
    await mock.close();
  }
});

test("访谈结构校验失败时返回本地兜底问题而不是卡死", async () => {
  const mock = await withMockOpenAI((req, res) => {
    sendJson(res, 200, { choices: [{ message: { content: "{\"summary\":123}" } }] });
  });

  try {
    const turn = await runInterviewTurn(
      {
        baseUrl: mock.baseUrl,
        apiKey: "sk-test-secret",
        modelName: "test-model",
        requestMode: "direct"
      },
      {
        projectDraft: {
          projectName: "自动化工具",
          oneLineIdea: "让 Agent 自动登录并抓取业务数据",
          codingExperience: "代码小白"
        },
        transcript: [{ questions: [{ id: "goal", question: "项目目标是什么？" }], answers: { goal: "自动整理数据" } }],
        draftSpec: {}
      }
    );

    assert.match(turn.summary, /本地兜底访谈/);
    assert.match(turn.questions[0].question, /Codex\/OpenCode|Agent/);
    assert.equal(turn.isReadyToGenerateSpec, true);
  } finally {
    await mock.close();
  }
});

test("代码小白场景会过滤模型选择和登录注册等实现问题", async () => {
  const mock = await withMockOpenAI((req, res) => {
    sendJson(res, 200, {
      choices: [
        {
          message: {
            content: JSON.stringify({
              summary: "继续访谈",
              extractedFacts: { coreGoal: "做本地内容创作助手" },
              missingFields: [],
              riskFlags: [],
              confidenceScore: 0.7,
              questions: [
                {
                  id: "model-choice",
                  type: "single",
                  question: "您更倾向于使用哪种 AI 模型来生成内容？",
                  why: "确认模型选择",
                  required: true,
                  options: [{ label: "DeepSeek", description: "" }]
                },
                {
                  id: "login",
                  type: "single",
                  question: "您希望这个工具需要用户登录/注册吗？",
                  why: "确认账号系统",
                  required: true,
                  options: [{ label: "需要", description: "" }]
                }
              ],
              isReadyToGenerateSpec: false
            })
          }
        }
      ]
    });
  });

  try {
    const turn = await runInterviewTurn(
      {
        baseUrl: mock.baseUrl,
        apiKey: "sk-test-secret",
        modelName: "test-model",
        requestMode: "direct"
      },
      {
        projectDraft: {
          projectName: "内容创作助手",
          oneLineIdea: "本地可运行的内容创作助手，不是平台自动化工具。",
          codingExperience: "代码小白",
          specialRequirements: "所有数据本地保存，不做用户系统。"
        },
        transcript: [{ questions: [{ id: "goal", question: "项目目标是什么？" }], answers: { goal: "每天生成内容方案" } }],
        draftSpec: {}
      }
    );

    assert.doesNotMatch(turn.questions.map((q) => q.question).join("\n"), /AI 模型|登录\/注册/);
    assert.match(turn.questions[0].question, /Codex\/OpenCode|Agent|业务边界/);
  } finally {
    await mock.close();
  }
});
