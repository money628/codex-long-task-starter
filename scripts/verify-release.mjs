import { mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const root = process.cwd();
const secretPattern = /sk-[A-Za-z0-9_-]{16,}|apiKey\s*[:=]/i;

async function assertExists(relativePath) {
  await stat(path.join(root, relativePath)).catch(() => {
    throw new Error(`缺少发布必需文件：${relativePath}`);
  });
}

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(root, relativePath), "utf8"));
}

function assertPackageMetadata(name, pkg) {
  for (const field of ["name", "version", "description", "license", "engines", "files", "publishConfig"]) {
    if (!pkg[field]) throw new Error(`${name} 缺少 package.json 字段：${field}`);
  }
}

async function assertNoSecretsInDir(relativeDir) {
  const dir = path.join(root, relativeDir);
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(root, full);
    if (entry.isDirectory()) {
      await assertNoSecretsInDir(rel);
    } else if (/\\.(md|json|js|mjs|jsx|ts|tsx|yml|yaml)$/i.test(entry.name)) {
      const text = await readFile(full, "utf8");
      if (secretPattern.test(text)) throw new Error(`疑似密钥进入发布文件：${rel}`);
    }
  }
}

async function assertNoSecretsInFile(relativePath) {
  const text = await readFile(path.join(root, relativePath), "utf8");
  if (secretPattern.test(text)) throw new Error(`疑似密钥进入发布文件：${relativePath}`);
}

async function assertCliDocsMatchPublishState() {
  const docs = [
    ["README.md", await readFile(path.join(root, "README.md"), "utf8")],
    ["docs/user-guide.zh-CN.md", await readFile(path.join(root, "docs/user-guide.zh-CN.md"), "utf8")]
  ];
  for (const [file, text] of docs) {
    if (!text.includes("node apps/cli/src/index.js doctor")) {
      throw new Error(`${file} must document the local CLI command before npm alpha is published.`);
    }
    if (/npx\s+codex-long-task-starter(?!@alpha)/.test(text)) {
      throw new Error(`${file} uses an unpublished npx command. Use local CLI commands or @alpha examples only.`);
    }
  }
}

function quoteWinArg(value) {
  const text = String(value);
  if (!/[\s&()^|<>"]/.test(text)) return text;
  return `"${text.replace(/"/g, '\\"')}"`;
}

function run(command, args, cwd = root) {
  return new Promise((resolve, reject) => {
    const useCurrentPnpm = command === "pnpm" && process.env.npm_execpath;
    const executable = useCurrentPnpm ? process.execPath : process.platform === "win32" ? "cmd.exe" : command;
    const spawnArgs = useCurrentPnpm
      ? [process.env.npm_execpath, ...args]
      : process.platform === "win32"
        ? ["/d", "/c", [command, ...args.map(quoteWinArg)].join(" ")]
        : args;
    const child = spawn(executable, spawnArgs, {
      cwd,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, CI: "true" },
      windowsHide: true
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });
    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });
    child.on("close", (code) => {
      const label = [command, ...args].join(" ");
      if (code === 0) resolve({ label, stdout, stderr });
      else reject(new Error(`${label} failed with code ${code}\n${stdout}\n${stderr}`));
    });
  });
}

function runCommandLine(label, commandLine, cwd = root) {
  if (process.platform !== "win32") {
    const [command, ...args] = commandLine.split(" ");
    return run(command, args, cwd);
  }
  return new Promise((resolve, reject) => {
    const child = spawn("cmd.exe", ["/d", "/c", commandLine], {
      cwd,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, CI: "true" },
      windowsHide: true
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });
    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });
    child.on("close", (code) => {
      if (code === 0) resolve({ label, stdout, stderr });
      else reject(new Error(`${label} failed with code ${code}\n${stdout}\n${stderr}`));
    });
  });
}

async function main() {
  await assertExists("README.md");
  await assertExists("README.en.md");
  await assertExists("README.zh-CN.md");
  await assertExists("AGENTS.md");
  await assertExists("docs/user-guide.zh-CN.md");
  await assertExists("docs/MVP_CHECKLIST.md");
  await assertExists("examples/README.md");
  await assertExists("LICENSE");
  await assertExists("CONTRIBUTING.md");
  await assertExists("SECURITY.md");
  await assertExists("CHANGELOG.md");
  await assertExists("RELEASE_NOTES.md");
  await assertExists("RELEASE_NOTES.zh-CN.md");
  await assertExists("docs/release-checklist.md");
  await assertExists("docs/github-release.md");
  await assertExists(".github/workflows/ci.yml");
  await assertExists(".github/ISSUE_TEMPLATE/bug_report.yml");
  await assertExists(".github/ISSUE_TEMPLATE/feature_request.yml");
  await assertExists(".github/pull_request_template.md");
  assertPackageMetadata("@codex-starter/core", await readJson("packages/core/package.json"));
  assertPackageMetadata("codex-long-task-starter", await readJson("apps/cli/package.json"));
  await assertNoSecretsInDir("examples");
  await assertNoSecretsInDir("docs");
  await assertNoSecretsInDir("dev-logs");
  await assertNoSecretsInDir("tests");
  await assertNoSecretsInDir(".github");
  for (const file of [
    "README.md",
    "README.en.md",
    "README.zh-CN.md",
    "AGENTS.md",
    "SECURITY.md",
    "CHANGELOG.md",
    "RELEASE_NOTES.md",
    "RELEASE_NOTES.zh-CN.md",
    "CONTRIBUTING.md"
  ]) {
    await assertNoSecretsInFile(file);
  }
  await assertCliDocsMatchPublishState();

  const workspace = await mkdtemp(path.join(tmpdir(), "clts-release-"));
  const packDir = path.join(workspace, "pack");
  const appDir = path.join(workspace, "app");
  await mkdir(packDir, { recursive: true });
  await mkdir(appDir, { recursive: true });

  try {
    await run("pnpm", ["pack", "--pack-destination", packDir], path.join(root, "packages/core"));
    await run("pnpm", ["pack", "--pack-destination", packDir], path.join(root, "apps/cli"));
    const tarballs = await readdir(packDir);
    const coreTar = tarballs.find((name) => name.startsWith("codex-starter-core") && name.endsWith(".tgz"));
    const cliTar = tarballs.find((name) => name.startsWith("codex-long-task-starter") && name.endsWith(".tgz"));
    if (!coreTar || !cliTar) throw new Error(`未找到预期 tarball：${tarballs.join(", ")}`);

    await writeFile(path.join(appDir, "package.json"), JSON.stringify({ private: true, type: "module" }, null, 2));
    await runCommandLine(
      "npm install local tarballs",
      `npm install ${quoteWinArg(path.join(packDir, coreTar))} ${quoteWinArg(path.join(packDir, cliTar))}`,
      appDir
    );
    const doctor = await runCommandLine("npx doctor", "npx codex-long-task-starter doctor", appDir);

    console.log("发布前验证通过。");
    console.log(`临时目录：${workspace}`);
    console.log(`包文件：${coreTar}, ${cliTar}`);
    console.log(doctor.stdout.trim());
  } finally {
    if (!process.env.CLTS_KEEP_VERIFY_TMP) {
      await rm(workspace, { recursive: true, force: true });
    }
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
