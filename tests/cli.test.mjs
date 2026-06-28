import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { cwdPath, readMarkdownFilesFromDir, writeFiles } from "../apps/cli/src/index.js";
import { markdownFileNames } from "../packages/core/src/index.js";

test("CLI 安全路径拒绝当前目录外写入", () => {
  const original = process.cwd();
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "clts-cli-"));
  try {
    process.chdir(tmp);
    assert.throws(() => cwdPath("..", "outside.md"), /只允许写入当前目录/);
  } finally {
    process.chdir(original);
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("CLI writeFiles 能写入 7 个 Markdown 文件", async () => {
  const original = process.cwd();
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "clts-cli-"));
  try {
    process.chdir(tmp);
    const files = Object.fromEntries(markdownFileNames.map((name) => [name, `# ${name}`]));
    const result = await writeFiles(files);

    for (const name of markdownFileNames) {
      assert.equal(result[name], "written");
      assert.equal(fs.readFileSync(path.join(tmp, name), "utf8"), `# ${name}`);
    }
  } finally {
    process.chdir(original);
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("CLI init-files 在目录没有任务文件时给出明确错误", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "clts-cli-empty-"));
  try {
    assert.throws(
      () => readMarkdownFilesFromDir(tmp),
      /未在目录中找到任务文件/
    );
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
