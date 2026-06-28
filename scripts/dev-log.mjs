import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const logDir = path.join(root, "dev-logs");
const templatePath = path.join(logDir, "template.md");

function todayInShanghai() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

const date = todayInShanghai();
const targetPath = path.join(logDir, `${date}.md`);

const defaultTemplate = `# 开发日志 - {{date}}

## 今日完成
- 

## 验证结果
- 

## 遗留问题
- 

## 明日待办
- 

## 风险
- 
`;

fs.mkdirSync(logDir, { recursive: true });

if (!fs.existsSync(templatePath)) {
  fs.writeFileSync(templatePath, defaultTemplate, "utf8");
}

if (!fs.existsSync(targetPath)) {
  const template = fs.readFileSync(templatePath, "utf8");
  fs.writeFileSync(targetPath, template.replaceAll("{{date}}", date), "utf8");
  console.log(`已创建今日开发日志：${path.relative(root, targetPath)}`);
} else {
  console.log(`今日开发日志已存在：${path.relative(root, targetPath)}`);
}
