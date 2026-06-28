import test from "node:test";
import assert from "node:assert/strict";
import {
  createExportBundleEntries,
  createExampleSpec,
  generateMarkdownFilesFromSpec,
  getSpecCompleteness,
  markdownFileNames,
  parseJsonObject,
  validateProjectSpec
} from "../packages/core/src/index.js";

test("ProjectSpec 完整度门控能识别缺失必填信息", () => {
  const spec = createExampleSpec();
  assert.equal(getSpecCompleteness(spec).canGenerate, true);

  const incomplete = { ...spec, targetUsers: [], doneWhen: ["UNCONFIRMED"] };
  const result = getSpecCompleteness(incomplete);

  assert.equal(result.canGenerate, false);
  assert.match(result.missing.join(","), /目标用户/);
  assert.match(result.missing.join(","), /Done When/);
});

test("Markdown 生成固定输出 7 个文件且不泄露 API Key 字段", () => {
  const spec = createExampleSpec({
    projectName: "No Secret Project",
    oneLineIdea: "验证生成文件不会包含真实密钥。"
  });
  const files = generateMarkdownFilesFromSpec(spec);

  assert.deepEqual(Object.keys(files).sort(), [...markdownFileNames].sort());
  const combined = Object.values(files).join("\n");
  assert.doesNotMatch(combined, /sk-[A-Za-z0-9]/);
  assert.doesNotMatch(combined, /apiKey/i);
});

test("导出包条目包含 7 个 Markdown 和 project-spec.json 且不泄露 Key", () => {
  const spec = createExampleSpec({
    projectName: "Export Project",
    oneLineIdea: "验证导出包条目。"
  });
  const entries = createExportBundleEntries(spec, generateMarkdownFilesFromSpec(spec));

  assert.deepEqual(Object.keys(entries).sort(), [...markdownFileNames, "project-spec.json"].sort());
  const combined = Object.values(entries).join("\n");
  assert.doesNotMatch(combined, /sk-[A-Za-z0-9]/);
  assert.doesNotMatch(combined, /real-secret-key-material/);
  assert.equal(JSON.parse(entries["project-spec.json"]).projectName, "Export Project");
});

test("parseJsonObject 支持 fenced JSON 和前后噪声", () => {
  assert.deepEqual(parseJsonObject("```json\n{\"ok\":true}\n```"), { ok: true });
  assert.deepEqual(parseJsonObject("前缀 {\"ok\":true} 后缀"), { ok: true });
});

test("ProjectSpec 校验能归一化真实模型常见里程碑字段别名", () => {
  const spec = createExampleSpec({
    projectName: "Alias Project",
    oneLineIdea: "验证模型输出字段别名可被接收。"
  });

  const normalized = validateProjectSpec({
    ...spec,
    targetUsers: "独立开发者",
    milestones: [
      {
        title: "阶段一",
        description: "完成可运行 MVP",
        steps: ["配置模型", "生成文件"],
        doneWhen: ["构建通过", "ZIP 可下载"]
      }
    ]
  });

  assert.deepEqual(normalized.targetUsers, ["独立开发者"]);
  assert.equal(normalized.milestones[0].name, "阶段一");
  assert.equal(normalized.milestones[0].goal, "完成可运行 MVP");
  assert.deepEqual(normalized.milestones[0].tasks, ["配置模型", "生成文件"]);
  assert.deepEqual(normalized.milestones[0].acceptanceCriteria, ["构建通过", "ZIP 可下载"]);
});
