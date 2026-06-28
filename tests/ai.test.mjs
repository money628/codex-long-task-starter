import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { callOpenAICompatible, testConnection } from "../packages/ai/src/index.js";

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
