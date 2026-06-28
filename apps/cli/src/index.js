#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import chalk from "chalk";
import { Command } from "commander";
import prompts from "prompts";
import { generateMarkdownFilesFromSpec, markdownFileNames, validateProjectSpec } from "@codex-starter/core";

const program = new Command();

export function cwdPath(...parts) {
  const target = path.resolve(process.cwd(), ...parts);
  const root = path.resolve(process.cwd());
  if (target !== root && !target.startsWith(root + path.sep)) {
    throw new Error("安全限制：CLI 只允许写入当前目录内的路径。");
  }
  return target;
}

function commandExists(name) {
  return spawnSync(name, ["--version"], { stdio: "ignore" }).status === 0;
}

export async function writeFileSafely(fileName, content) {
  const target = cwdPath(fileName);
  if (fs.existsSync(target)) {
    const answer = await prompts({
      type: "select",
      name: "action",
      message: `${fileName} 已存在，如何处理？`,
      choices: [
        { title: "跳过", value: "skip" },
        { title: "覆盖", value: "overwrite" },
        { title: "备份后覆盖", value: "backup" }
      ],
      initial: 0
    });
    if (!answer.action || answer.action === "skip") return "skipped";
    if (answer.action === "backup") {
      fs.copyFileSync(target, `${target}.bak-${Date.now()}`);
    }
  }
  fs.writeFileSync(target, content, "utf8");
  return "written";
}

export async function writeFiles(files) {
  const result = {};
  for (const name of markdownFileNames) {
    if (!files[name]) continue;
    result[name] = await writeFileSafely(name, files[name]);
  }
  return result;
}

export function readMarkdownFilesFromDir(sourceDir) {
  const files = {};
  for (const name of markdownFileNames) {
    const source = path.join(sourceDir, name);
    if (fs.existsSync(source)) files[name] = fs.readFileSync(source, "utf8");
  }
  if (!Object.keys(files).length) {
    throw new Error(`未在目录中找到任务文件：${sourceDir}。请确认该目录包含 Prompt.md、Plan.md、START.md 等生成文件。`);
  }
  return files;
}

program
  .name("codex-long-task-starter")
  .description("AI 访谈生成的 Codex/OpenCode 长任务文件写入工具")
  .version("0.1.0-alpha.0");

program
  .command("init")
  .description("从 project-spec.json 生成并写入 7 个 Markdown 文件")
  .requiredOption("--spec <path>", "ProjectSpec JSON 文件路径")
  .action(async (options) => {
    const specPath = path.resolve(process.cwd(), options.spec);
    const spec = validateProjectSpec(JSON.parse(fs.readFileSync(specPath, "utf8")));
    const files = generateMarkdownFilesFromSpec(spec);
    const result = await writeFiles(files);
    console.log(chalk.green("已处理 Markdown 文件："));
    console.table(result);
    console.log(chalk.cyan("下一步：把 START.md 的首次启动指令交给 Codex/OpenCode 执行。"));
  });

program
  .command("init-files")
  .description("从已生成的 Markdown 文件目录写入当前项目")
  .argument("<dir>", "包含 Markdown 文件的目录")
  .action(async (dir) => {
    const sourceDir = path.resolve(process.cwd(), dir);
    const files = readMarkdownFilesFromDir(sourceDir);
    const result = await writeFiles(files);
    console.log(chalk.green("已处理 Markdown 文件："));
    console.table(result);
  });

program
  .command("run")
  .description("检测 START.md 并提示启动 Codex/OpenCode")
  .action(async () => {
    if (!fs.existsSync(cwdPath("START.md"))) {
      console.log(chalk.yellow("当前目录没有 START.md，请先运行 init 或 init-files。"));
      return;
    }
    const hasCodex = commandExists("codex");
    const hasOpenCode = commandExists("opencode");
    console.log(chalk.green("检测到 START.md。"));
    if (hasCodex) console.log("可运行：codex");
    if (hasOpenCode) console.log("可运行：opencode");
    if (!hasCodex && !hasOpenCode) {
      console.log(chalk.yellow("未检测到 codex/opencode 命令。请打开你的 AI 编程工具，并粘贴 START.md 中的启动指令。"));
    }
  });

program
  .command("doctor")
  .description("检查当前目录是否已准备好交给 Codex/OpenCode")
  .action(() => {
    const checks = markdownFileNames.map((name) => ({ file: name, exists: fs.existsSync(cwdPath(name)) }));
    console.table(checks);
    const tools = ["node", "git", "codex", "opencode"].map((name) => ({
      tool: name,
      available: commandExists(name)
    }));
    console.table(tools);
    const missing = checks.filter((x) => !x.exists).map((x) => x.file);
    if (missing.length) {
      console.log(chalk.yellow(`缺少文件：${missing.join("、")}。请运行 init 或 init-files。`));
    } else {
      console.log(chalk.green("长任务文件已就绪。"));
    }
  });

export async function runCli(argv = process.argv) {
  try {
    await program.parseAsync(argv);
  } catch (error) {
    console.error(chalk.red(`错误：${error?.message || error}`));
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runCli(process.argv);
}
