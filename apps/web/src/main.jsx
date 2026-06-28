import React from "react";
import { createRoot } from "react-dom/client";
import JSZip from "jszip";
import {
  ArrowRight,
  BadgeCheck,
  Bolt,
  Bot,
  Box,
  Braces,
  Check,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  Code2,
  Copy,
  Download,
  Eye,
  FileCode2,
  FileText,
  Folder,
  Grid2X2,
  History,
  KeyRound,
  Laptop,
  Link as LinkIcon,
  Mic,
  PenLine,
  Rocket,
  RotateCcw,
  Settings,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
  Upload,
  Wrench,
  Zap
} from "lucide-react";
import {
  createExportBundleEntries,
  createExampleSpec,
  generateMarkdownFilesFromSpec,
  getSpecCompleteness,
  markdownFileNames,
  validateProjectSpec
} from "@codex-starter/core";
import {
  buildMarkdownFiles,
  buildProjectSpec,
  createExampleInterviewTurn,
  hasUsableApiConfig,
  runInterviewTurn,
  testConnection
} from "@codex-starter/ai";
import "./styles.css";

const LS_KEYS = {
  api: "clts.apiConfig",
  draft: "clts.projectDraft",
  transcript: "clts.transcript",
  turn: "clts.turnResult",
  spec: "clts.projectSpec",
  files: "clts.markdownFiles"
};

const defaultApiConfig = {
  providerName: "OpenAI",
  baseUrl: "https://api.openai.com/v1",
  apiKey: "",
  modelName: "gpt-4o",
  temperature: 0.7,
  maxTokens: 4096,
  requestMode: "proxy"
};

const providerPresets = [
  { name: "OpenAI", baseUrl: "https://api.openai.com/v1", modelName: "gpt-4o" },
  { name: "DeepSeek", baseUrl: "https://api.deepseek.com", modelName: "deepseek-chat" },
  { name: "Moonshot / Kimi", baseUrl: "https://api.moonshot.cn/v1", modelName: "moonshot-v1-8k" },
  { name: "通义千问 Qwen", baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1", modelName: "qwen-plus" },
  { name: "OpenRouter", baseUrl: "https://openrouter.ai/api/v1", modelName: "openai/gpt-4o-mini" },
  { name: "自定义", baseUrl: "", modelName: "" }
];

const defaultProjectDraft = {
  projectName: "Project Alpha",
  oneLineIdea: "AI 项目访谈官 + Codex/OpenCode 长任务文件生成器",
  projectType: "Web 应用",
  techStackPreference: ["React", "Tailwind", "TypeScript"],
  deploymentTarget: "Vercel / Netlify",
  monetizationIntent: "第一版暂不商业化",
  specialRequirements: "不保存 API Key 到服务器，不把 Key 写入 Markdown。"
};

function toUserFacingError(error) {
  const message = String(error?.message || error || "");
  if (!message) return "操作失败，请稍后重试。";
  if (message.includes("请先在模型配置页填写")) {
    return "请先填写 Base URL、API Key 和模型名称，然后点击“测试连接”。";
  }
  if (message.includes("Failed to fetch") || message.includes("NetworkError")) {
    return "无法连接到模型服务。请检查 Base URL 是否正确；如果使用浏览器直连，请改用“本地代理”模式规避 CORS。";
  }
  if (message.includes("HTTP 401") || message.includes("invalid_api_key") || message.includes("Incorrect API key")) {
    return "API Key 无效或没有权限。请重新复制供应商控制台里的 Key，并确认没有多余空格。";
  }
  if (message.includes("HTTP 404") || message.includes("model") || message.includes("Model")) {
    return "模型名称或 Base URL 可能不正确。请检查模型 ID，或先选择一个供应商预设再测试连接。";
  }
  if (message.includes("HTTP 429")) {
    return "模型服务限流或额度不足。请稍后重试，或检查供应商账户额度。";
  }
  if (message.includes("本地代理请求失败")) {
    return "本地代理请求失败。请确认开发服务器仍在运行，Base URL 可访问，并优先使用供应商官方 OpenAI-compatible 地址。";
  }
  if (message.includes("模型未返回可解析的 JSON") || message.includes("Unexpected token")) {
    return "模型没有返回合法 JSON。请降低温度、换用更稳定的模型，或继续访谈后重新生成。";
  }
  if (message.includes("invalid_type") || message.includes("invalid_enum_value") || message.includes("Required")) {
    return "模型输出未通过结构校验。已尝试自动修复但仍不完整，请继续访谈补充关键信息后再生成。";
  }
  if (message.includes("ProjectSpec 信息仍不完整")) return message;
  return message.replace(/sk-[A-Za-z0-9_-]+/g, "sk-***");
}

const navItems = [
  { label: "仪表盘", icon: Grid2X2 },
  { label: "提示词探索", icon: FileText },
  { label: "任务规划", icon: ClipboardList },
  { label: "终端", icon: TerminalSquare },
  { label: "历史记录", icon: History }
];

const routes = {
  home: "首页",
  config: "模型配置",
  create: "创建项目",
  interview: "AI 访谈",
  spec: "ProjectSpec",
  results: "Markdown 结果"
};

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function downloadText(fileName, content, type = "application/json") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, fileName);
}

function triggerDownload(url, fileName) {
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function App() {
  const [route, setRoute] = React.useState("home");
  const [apiConfig, setApiConfig] = React.useState(() => loadJson(LS_KEYS.api, defaultApiConfig));
  const [projectDraft, setProjectDraft] = React.useState(() => loadJson(LS_KEYS.draft, defaultProjectDraft));
  const [transcript, setTranscript] = React.useState(() => loadJson(LS_KEYS.transcript, []));
  const [turnResult, setTurnResult] = React.useState(() => loadJson(LS_KEYS.turn, createExampleInterviewTurn({ projectDraft: defaultProjectDraft })));
  const [projectSpec, setProjectSpec] = React.useState(() => loadJson(LS_KEYS.spec, null));
  const [markdownFiles, setMarkdownFiles] = React.useState(() => loadJson(LS_KEYS.files, {}));
  const [busy, setBusy] = React.useState("");
  const [notice, setNotice] = React.useState("");

  React.useEffect(() => saveJson(LS_KEYS.api, apiConfig), [apiConfig]);
  React.useEffect(() => saveJson(LS_KEYS.draft, projectDraft), [projectDraft]);
  React.useEffect(() => saveJson(LS_KEYS.transcript, transcript), [transcript]);
  React.useEffect(() => saveJson(LS_KEYS.turn, turnResult), [turnResult]);
  React.useEffect(() => {
    if (projectSpec) saveJson(LS_KEYS.spec, projectSpec);
  }, [projectSpec]);
  React.useEffect(() => saveJson(LS_KEYS.files, markdownFiles), [markdownFiles]);

  const context = { projectDraft, transcript, draftSpec: projectSpec || {} };
  const isExampleMode = !hasUsableApiConfig(apiConfig);

  async function startInterview() {
    setBusy("正在生成访谈问题...");
    setNotice("");
    try {
      const turn = await runInterviewTurn(apiConfig, { projectDraft, transcript: [] });
      setTranscript([]);
      setTurnResult(turn);
      setRoute("interview");
    } catch (error) {
      setNotice(toUserFacingError(error));
      setRoute("config");
    } finally {
      setBusy("");
    }
  }

  async function continueInterview(answers) {
    const nextTranscript = [...transcript, { questions: turnResult.questions, answers, at: new Date().toISOString() }];
    setTranscript(nextTranscript);
    setBusy("AI 正在分析回答...");
    try {
      const turn = await runInterviewTurn(apiConfig, { projectDraft, transcript: nextTranscript, draftSpec: projectSpec || {} });
      setTurnResult(turn);
    } catch (error) {
      setNotice(toUserFacingError(error));
    } finally {
      setBusy("");
    }
  }

  async function generateSpec() {
    setBusy("正在生成 ProjectSpec...");
    setNotice("");
    try {
      const spec = await buildProjectSpec(apiConfig, context);
      const validated = validateProjectSpec(spec);
      setProjectSpec(validated);
      setRoute("spec");
    } catch (error) {
      setNotice(toUserFacingError(error));
    } finally {
      setBusy("");
    }
  }

  async function generateFiles(spec = projectSpec) {
    const completeness = getSpecCompleteness(spec);
    if (!completeness.canGenerate) {
      setNotice(`ProjectSpec 信息仍不完整，暂不能生成最终文件。缺失：${completeness.missing.join("、")}`);
      setRoute("spec");
      return;
    }
    setBusy("正在生成 Markdown 文件...");
    setNotice("");
    try {
      const files = await buildMarkdownFiles(apiConfig, spec);
      setMarkdownFiles(files);
      setRoute("results");
    } catch (error) {
      setNotice(toUserFacingError(error));
    } finally {
      setBusy("");
    }
  }

  const page = {
    home: <HomePage go={setRoute} startInterview={startInterview} />,
    config: <ConfigPage apiConfig={apiConfig} setApiConfig={setApiConfig} notice={notice} setNotice={setNotice} busy={busy} setBusy={setBusy} />,
    create: <CreateProjectPage projectDraft={projectDraft} setProjectDraft={setProjectDraft} startInterview={startInterview} busy={busy} />,
    interview: <InterviewPage turnResult={turnResult} transcript={transcript} continueInterview={continueInterview} generateSpec={generateSpec} busy={busy} isExampleMode={isExampleMode} />,
    spec: <SpecPreviewPage projectSpec={projectSpec} setProjectSpec={setProjectSpec} generateSpec={generateSpec} generateFiles={generateFiles} busy={busy} />,
    results: <ResultsPage projectSpec={projectSpec} markdownFiles={markdownFiles} setMarkdownFiles={setMarkdownFiles} />
  }[route];

  return (
    <div className="app-shell">
      <TopNav route={route} go={setRoute} compact={route === "home"} />
      {notice && <div className="toast">{notice}</div>}
      {route === "home" ? page : <Workspace route={route} projectName={projectDraft.projectName}>{page}</Workspace>}
      <RouteDock route={route} go={setRoute} />
    </div>
  );
}

function TopNav({ route, go, compact = false }) {
  return (
    <header className={`top-nav ${compact ? "top-nav--compact" : ""}`}>
      <button className="brand" onClick={() => go("home")}>
        <span className="brand-mark"><TerminalSquare size={22} /></span>
        <span>Codex Long Task Starter</span>
      </button>
      <nav className="nav-links">
        <button className={route === "home" ? "active" : ""} onClick={() => go("home")}>首页</button>
        <button className={route === "config" ? "active" : ""} onClick={() => go("config")}>模型配置</button>
        <button className={["create", "interview", "spec", "results"].includes(route) ? "active" : ""} onClick={() => go("create")}>项目</button>
      </nav>
      <div className="top-actions">
        <button className="icon-button"><Settings size={21} /></button>
        <button className="icon-button"><CircleHelp size={21} /></button>
        <button className="soft-button" onClick={() => go("create")}>新建项目</button>
        <span className="avatar" />
      </div>
    </header>
  );
}

function Workspace({ route, projectName, children }) {
  const active = route === "config" ? "模型配置" : route === "results" ? "终端" : route === "interview" ? "提示词探索" : "任务规划";
  return (
    <main className="workspace">
      <aside className="side-bar">
        <div className="project-chip">
          <span className="project-icon"><Rocket size={24} /></span>
          <div>
            <strong>{projectName || "Project Alpha"}</strong>
            <small>{route === "spec" ? "规格起草中" : route === "interview" ? "访谈进行中" : "访谈阶段"}</small>
          </div>
        </div>
        <div className="side-nav">
          {navItems.map((item) => (
            <button key={item.label} className={active === item.label ? "selected" : ""}>
              <item.icon size={22} />
              <span>{item.label}</span>
            </button>
          ))}
          {route === "config" && <button className="selected"><Settings size={22} /><span>模型配置</span></button>}
        </div>
        <div className="side-footer">
          <button className="upgrade">升级计划</button>
          <button><Settings size={22} />设置</button>
          <button><CircleHelp size={22} />支持</button>
        </div>
      </aside>
      <section className="content">{children}</section>
    </main>
  );
}

function HomePage({ go, startInterview }) {
  const cards = [
    ["STEP 01", "深度访谈", "AI 访谈官通过多轮问答，挖掘需求细节，消除业务逻辑中的模糊断点。", Bot],
    ["STEP 02", "生成规格", "自动整理访谈记录，输出符合 ProjectSpec 标准的结构化技术文档。", FileText],
    ["STEP 03", "自动写入", "通过命令行将生成文件写入当前项目目录，覆盖前会确认。", TerminalSquare]
  ];
  return (
    <main className="home-page">
      <section className="hero">
        <span className="ai-pill"><Sparkles size={14} /> AI 驱动工作流</span>
        <h1>从模糊想法到结构化<br /><span>ProjectSpec</span></h1>
        <p>让 AI 先采访你，再把模糊项目想法变成 Codex/OpenCode 能长期执行的项目文件包。</p>
        <div className="hero-actions">
          <button className="primary-xl" onClick={() => go("create")}>立即开始访谈</button>
          <button className="ghost-xl" onClick={startInterview}>体验示例流程</button>
        </div>
        <small className="scroll-hint">向下探索<br />⌄</small>
      </section>
      <section className="steps-section">
        <h2>三个步骤，定义未来</h2>
        <div className="title-line" />
        <div className="step-grid">
          {cards.map(([k, t, d, Icon]) => (
            <article className="step-card" key={k}>
              <span className="round-icon"><Icon size={22} /></span>
              <small>{k}</small>
              <h3>{t}</h3>
              <p>{d}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="feature-section">
        <div>
          <h2>赋能高效开发</h2>
          <p>专为复杂长任务（Long Tasks）设计的 AI 工程化套件。</p>
        </div>
        <span className="version">版本 0.2.0 · 业务接线</span>
        <div className="feature-grid">
          <article className="neural-card">
            <div className="neural-lines" />
            <span className="square-icon"><Bot size={18} /></span>
            <h3>动态需求访谈</h3>
            <p>每轮由模型返回结构化 InterviewTurnResult，并通过校验后渲染为问题卡片。</p>
          </article>
          <article className="feature-card wide">
            <h3>ProjectSpec 校验</h3>
            <p>AI 必须输出严格 JSON，ProjectSpec 会通过 Zod 校验，不确定事实会标记 UNCONFIRMED。</p>
            <FileText className="ghost-illustration" size={72} />
          </article>
          <article className="feature-card"><TerminalSquare size={20} /><h3>命令行自动化</h3><p>命令行写入 Prompt、Plan、AGENTS、START 等文件。</p></article>
          <article className="feature-card accent"><ShieldCheck size={20} /><h3>密钥边界</h3><p>API Key 只存 localStorage，不写入生成文件。</p></article>
        </div>
      </section>
      <section className="cta-band">
        <h2>准备好让 AI 更懂你了吗？</h2>
        <div className="email-box"><span>先配置自己的 OpenAI-compatible API...</span><button onClick={() => go("config")}>配置模型</button></div>
        <p>本工具不提供模型额度，使用你自己的 API Key。</p>
      </section>
      <footer className="home-footer">
        <strong>Codex Long Task Starter</strong>
        <span>文档</span><span>源码</span><span>MIT 许可</span>
      </footer>
    </main>
  );
}

function ConfigPage({ apiConfig, setApiConfig, notice, setNotice, busy, setBusy }) {
  const update = (key, value) => setApiConfig((prev) => ({ ...prev, [key]: value }));
  const applyPreset = (preset) =>
    setApiConfig((prev) => ({
      ...prev,
      providerName: preset.name,
      baseUrl: preset.baseUrl || prev.baseUrl,
      modelName: preset.modelName || prev.modelName
    }));
  async function onTest() {
    setBusy("正在测试连接...");
    setNotice("");
    try {
      const result = await testConnection(apiConfig);
      setNotice(result.message || "连接成功");
    } catch (error) {
      setNotice(toUserFacingError(error));
    } finally {
      setBusy("");
    }
  }
  return (
    <div className="page-grid config-grid">
      <div className="page-title">
        <h1>API 模型配置</h1>
        <p>使用你自己的 OpenAI-compatible API。本工具不提供模型额度，Key 默认仅保存到浏览器 localStorage。</p>
      </div>
      <span className="ready-badge"><Sparkles size={16} /> {hasUsableApiConfig(apiConfig) ? "真实 AI 已就绪" : "示例模式"}</span>
      <section className="panel form-panel">
        <div className="request-mode">
          <span>供应商预设</span>
          <div>
            {providerPresets.map((preset) => (
              <button
                key={preset.name}
                className={apiConfig.providerName === preset.name ? "active" : ""}
                onClick={() => applyPreset(preset)}
              >
                {preset.name}
              </button>
            ))}
          </div>
          <p>预设只填供应商、Base URL 和模型示例，不会填写或覆盖 API Key。</p>
        </div>
        <EditableField label="供应商名称" value={apiConfig.providerName} onChange={(v) => update("providerName", v)} icon={<ChevronDown size={20} />} />
        <EditableField label="基础地址" value={apiConfig.baseUrl} onChange={(v) => update("baseUrl", v)} icon={<LinkIcon size={20} />} />
        <EditableField label="API 密钥" value={apiConfig.apiKey} onChange={(v) => update("apiKey", v)} icon={<KeyRound size={20} />} password />
        <div className="two-cols">
          <EditableField label="模型名称" value={apiConfig.modelName} onChange={(v) => update("modelName", v)} />
          <EditableField label="最大 Tokens" value={apiConfig.maxTokens} onChange={(v) => update("maxTokens", Number(v) || 4096)} />
        </div>
        <div className="request-mode">
          <span>常用模型</span>
          <div>
            <button onClick={() => update("modelName", "deepseek-v4-pro")}>DeepSeek V4 Pro</button>
            <button onClick={() => update("modelName", "deepseek-v4-flash")}>DeepSeek V4 Flash</button>
            <button onClick={() => update("modelName", "gpt-4o")}>GPT-4o</button>
          </div>
          <p>选择后仍可手动修改模型名称，以你的供应商控制台为准。</p>
        </div>
        <div className="request-mode">
          <span>请求方式</span>
          <div>
            <button className={apiConfig.requestMode !== "direct" ? "active" : ""} onClick={() => update("requestMode", "proxy")}>本地代理</button>
            <button className={apiConfig.requestMode === "direct" ? "active" : ""} onClick={() => update("requestMode", "direct")}>浏览器直连</button>
          </div>
          <p>{apiConfig.requestMode === "direct" ? "适合本地模型或已允许 CORS 的供应商。" : "推荐。通过当前本机开发服务器转发请求，不落盘、不记录 API Key。"}</p>
        </div>
        <div className="slider-row">
          <label>温度 <strong>{apiConfig.temperature}</strong></label>
          <input className="native-slider" type="range" min="0" max="2" step="0.1" value={apiConfig.temperature} onChange={(e) => update("temperature", Number(e.target.value))} />
          <div className="scale"><span>精准</span><span>创意</span></div>
        </div>
        <div className="form-actions">
          <button className="ghost-action" onClick={onTest} disabled={Boolean(busy)}><Zap size={19} /> {busy || "测试连接"}</button>
          <button className="solid-action" onClick={() => setNotice("配置已保存到 localStorage。")}><FileCode2 size={19} /> 保存配置</button>
          <button className="ghost-action" onClick={() => { localStorage.removeItem(LS_KEYS.api); setApiConfig(defaultApiConfig); setNotice("已清除本地配置。"); }}>清除配置</button>
        </div>
        {notice && <p className="inline-status">{notice}</p>}
      </section>
      <aside className="right-stack">
        <section className="panel secure-card">
          <ShieldCheck size={28} />
          <h3>本地密钥边界</h3>
          <p>API Key 仅保存在当前浏览器 localStorage。本地代理只在请求时转发，不落盘、不写入 ProjectSpec、Markdown、ZIP 或命令行指令。</p>
          <small><span /> 本地保存 · 本机转发</small>
        </section>
        <section className="panel endpoint-card">
          <h3>常用端点</h3>
          {providerPresets.filter((preset) => preset.baseUrl).map((preset) => (
            <button className="endpoint" key={preset.name} onClick={() => applyPreset(preset)}>
              <strong>{preset.name}</strong><span>{preset.baseUrl}</span>
            </button>
          ))}
          <button className="endpoint" onClick={() => setApiConfig((prev) => ({ ...prev, providerName: "Local Ollama", baseUrl: "http://localhost:11434/v1", modelName: "llama3.1" }))}>
            <strong>Local Ollama</strong><span>http://localhost:11434/v1</span>
          </button>
        </section>
        <section className="panel traffic-card"><span>CORS 提示</span><p>默认使用本地代理避免浏览器 CORS 拦截；本地 Ollama 等可切换为浏览器直连。</p></section>
      </aside>
      <section className="terminal-log">
        <div><span /><span /><span /><b>连接调试日志</b></div>
        <p>[本地] API 密钥不会打印到日志。</p>
        <p>[浏览器] 配置存储位置：localStorage</p>
        <p>[模式] {hasUsableApiConfig(apiConfig) ? "真实 API 模式" : "示例体验模式"}</p>
        <p>[请求] {apiConfig.requestMode === "direct" ? "浏览器直连" : "本地代理转发"}</p>
      </section>
    </div>
  );
}

function EditableField({ label, value, onChange, icon, password }) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="input-like editable-input">
        {icon}
        <input type={password ? "password" : "text"} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
      </div>
    </label>
  );
}

function CreateProjectPage({ projectDraft, setProjectDraft, startInterview, busy }) {
  const update = (key, value) => setProjectDraft((prev) => ({ ...prev, [key]: value }));
  const types = [["Web 应用", Laptop], ["移动应用", Box], ["脚本", TerminalSquare], ["工具", Wrench]];
  return (
    <div className="project-form">
      <div className="page-title">
        <h1>开启新项目</h1>
        <p>描述您的构想，AI 将辅助您完成从架构设计到落地部署的全过程。</p>
      </div>
      <section className="panel big-form">
        <EditableField label="项目名称" value={projectDraft.projectName} onChange={(v) => update("projectName", v)} />
        <label className="field textarea-field"><span>一句话项目描述</span><textarea value={projectDraft.oneLineIdea} onChange={(e) => update("oneLineIdea", e.target.value)} placeholder="例如：一个基于区块链的去中心化咖啡豆追踪系统..." /></label>
      </section>
      <section>
        <h3 className="section-label">项目类型</h3>
        <div className="type-grid">
          {types.map(([label, Icon]) => <button className={projectDraft.projectType === label ? "active" : ""} key={label} onClick={() => update("projectType", label)}><Icon size={34} /><span>{label}</span></button>)}
        </div>
      </section>
      <section className="panel stack-card">
        <h3>技术栈偏好</h3>
        <div className="chips">
          {projectDraft.techStackPreference.map((x) => <span key={x}>{x} ×</span>)}
          <button onClick={() => {
            const value = prompt("添加技术栈");
            if (value) update("techStackPreference", [...projectDraft.techStackPreference, value]);
          }}>+ 添加</button>
        </div>
      </section>
      <div className="split-panels">
        <section className="panel switch-card">
          <Switch label="是否需要部署" detail={projectDraft.deploymentTarget} on onClick={() => update("deploymentTarget", projectDraft.deploymentTarget ? "" : "Vercel / Netlify")} />
          <Switch label="是否考虑商业化" detail={projectDraft.monetizationIntent} on={projectDraft.monetizationIntent !== "第一版暂不商业化"} onClick={() => update("monetizationIntent", projectDraft.monetizationIntent === "第一版暂不商业化" ? "后续考虑 Stripe/LemonSqueezy" : "第一版暂不商业化")} />
        </section>
        <section className="panel"><label className="field textarea-field"><span>特殊要求</span><textarea value={projectDraft.specialRequirements} onChange={(e) => update("specialRequirements", e.target.value)} /></label></section>
      </div>
      <div className="center-action">
        <button className="ai-action" onClick={startInterview} disabled={Boolean(busy)}><Bolt size={28} /> {busy || "开始 AI 访谈"}</button>
        <p>未配置 API Key 时只进入示例模式；真实访谈请先到模型配置页填写自己的 Key。</p>
      </div>
    </div>
  );
}

function Switch({ label, detail, on, onClick }) {
  return <button className="switch-row" onClick={onClick}><div><strong>{label}</strong><span>{detail || "未确认"}</span></div><i className={on ? "on" : ""}><b /></i></button>;
}

function InterviewPage({ turnResult, transcript, continueInterview, generateSpec, busy, isExampleMode }) {
  const [answers, setAnswers] = React.useState({});
  React.useEffect(() => setAnswers({}), [turnResult]);
  const progress = Math.round((turnResult.confidenceScore || 0) * 100);
  const confirmed = Object.keys(turnResult.extractedFacts || {}).filter((key) => {
    const value = turnResult.extractedFacts[key];
    return Array.isArray(value) ? value.length : Boolean(value);
  });
  const primaryQuestion = turnResult.questions[0];
  function setAnswer(id, value, multi) {
    setAnswers((prev) => {
      if (!multi) return { ...prev, [id]: value };
      const current = new Set(prev[id] || []);
      current.has(value) ? current.delete(value) : current.add(value);
      return { ...prev, [id]: [...current] };
    });
  }
  return (
    <div className="interview-layout">
      <aside className="interview-status">
        <section className="panel progress-card"><label>访谈进度 <b>{progress}%</b></label><div className="progress"><span style={{ width: `${progress}%` }} /></div></section>
        <section className="panel clarity-card"><div><span>当前理解度</span><strong>{turnResult.isReadyToGenerateSpec ? "可生成规格" : "继续对齐中"}</strong></div><div className="ring">{progress}%</div></section>
        <section className="panel checklist">
          <strong><BadgeCheck size={18} /> 已确认信息</strong>
          {confirmed.length ? confirmed.slice(0, 6).map((key) => <p key={key}><Check size={18} /> <span><b>{key}</b>{String(turnResult.extractedFacts[key]).slice(0, 60)}</span></p>) : <p>暂无足够确认信息</p>}
        </section>
        <section className="panel missing-card">
          <strong><CircleHelp size={18} /> 缺失信息</strong>
          {turnResult.missingFields.slice(0, 6).map((x) => <p key={x}>{x}<span>待确认</span></p>)}
        </section>
        <section className="risk-note"><strong>{isExampleMode ? "示例模式" : "风险提示"}</strong><p>{turnResult.riskFlags.join(" / ") || "暂无风险提示"}</p></section>
      </aside>
      <section className="chat-panel panel">
        <header><span className="round-icon"><Bot size={24} /></span><div><h1>{primaryQuestion?.question || "AI 访谈"}</h1><p>{turnResult.summary}</p></div><b>{isExampleMode ? "示例模式" : "AI 运行中"}</b></header>
        <div className="question-card">
          <h2>{primaryQuestion?.question}</h2>
          <div className="why-box"><CircleHelp size={22} /><div><strong>为什么问这个？</strong><p>{primaryQuestion?.why}</p></div></div>
        </div>
        <div className="question-list">
          {turnResult.questions.map((q) => (
            <article className="panel structured-question" key={q.id}>
              <h3>{q.question}</h3>
              <p>{q.why}</p>
              {q.options.length > 0 && <div className="quick-picks">
                {q.options.map((option) => <button className={(Array.isArray(answers[q.id]) ? answers[q.id].includes(option.label) : answers[q.id] === option.label) ? "picked" : ""} key={option.label} onClick={() => setAnswer(q.id, option.label, q.type === "multi")}>{option.label}<small>{option.description}</small></button>)}
              </div>}
              {q.type === "text" && <textarea value={answers[q.id] || ""} onChange={(e) => setAnswer(q.id, e.target.value, false)} placeholder="请输入你的补充说明..." />}
            </article>
          ))}
        </div>
        <footer>
          <button className="continue" onClick={() => continueInterview(answers)} disabled={Boolean(busy)}>继续访谈 <ArrowRight size={24} /></button>
          <button className={turnResult.isReadyToGenerateSpec || transcript.length >= 1 ? "continue" : "disabled"} onClick={generateSpec} disabled={Boolean(busy) || !(turnResult.isReadyToGenerateSpec || transcript.length >= 1)}><Sparkles size={20} /> 生成 ProjectSpec</button>
          <small>{busy || "每轮会校验 InterviewTurnResult JSON"}</small>
        </footer>
      </section>
    </div>
  );
}

function SpecPreviewPage({ projectSpec, setProjectSpec, generateSpec, generateFiles, busy }) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const spec = projectSpec || createExampleSpec();
  const completeness = getSpecCompleteness(spec);
  React.useEffect(() => setDraft(JSON.stringify(spec, null, 2)), [projectSpec]);
  function saveDraft() {
    try {
      setProjectSpec(validateProjectSpec(JSON.parse(draft)));
      setEditing(false);
    } catch (error) {
      alert(error.message);
    }
  }
  return (
    <div className="spec-layout">
      <aside className="outline">
        <div className="project-chip"><span className="project-icon"><Sparkles size={24} /></span><div><strong>{spec.projectName}</strong><small>规格起草中</small></div></div>
        <span>大纲</span>
        {["项目目标", "目标用户", "MVP 范围", "非目标", "核心功能", "技术约束", "风险"].map((x, i) => <button className={i === 4 ? "selected" : ""} key={x}><Zap size={18} />{x}</button>)}
        <button className="upgrade">完整度 {completeness.score}%</button>
      </aside>
      <section className="spec-content">
        <span className="version-tag">版本 1.0.0</span><span className="doc-id">/ project-spec.json</span>
        <h1>项目规格书预览: {spec.projectName}</h1>
        <p>结构化 ProjectSpec 已通过 Zod 校验，用于指导 AI 自动执行任务的核心蓝图。</p>
        <hr />
        {editing ? <textarea className="json-editor" value={draft} onChange={(e) => setDraft(e.target.value)} /> : <>
          <article className="panel spec-goal">
            <small>01. 项目目标</small>
            <p>{spec.coreGoal}</p>
            {spec.doneWhen.slice(0, 3).map((x) => <p key={x}><Check size={18} /> {x}</p>)}
          </article>
          <div className="spec-cards">
            <article className="panel"><small>02. 目标用户</small><div className="chips">{spec.targetUsers.map((x) => <span key={x}>{x}</span>)}</div></article>
            <article className="panel edge"><small>03. MVP 范围</small><p>{spec.mvpScope.join("、")}</p><div className="progress"><span style={{ width: `${completeness.score}%` }} /></div><b>就绪检查 <em>{completeness.missing.length ? `${completeness.missing.length} 项缺失` : "已满足"}</em></b></article>
          </div>
          <article className="panel capability"><div><small>04. 核心功能</small>{spec.coreFeatures.slice(0, 4).map((x) => <React.Fragment key={x}><h3>{x}</h3><p>根据访谈与 ProjectSpec 生成。</p></React.Fragment>)}</div><div className="mini-terminal"><span>规格校验</span><p>$ 校验 project-spec.json</p><p>$ 完整度 {completeness.score}%</p><p>$ 缺失项 {completeness.missing.length}</p></div></article>
        </>}
      </section>
      <div className="floating-confirm">
        {editing ? <button onClick={saveDraft}><PenLine size={22} /> 保存 JSON</button> : <button onClick={() => setEditing(true)}><PenLine size={22} /> 手动编辑</button>}
        <button onClick={generateSpec}><RotateCcw size={22} /> 重新生成</button>
        <span>下一步<br /><b>生成 Markdown</b></span>
        <button className="confirm" onClick={() => generateFiles(spec)} disabled={Boolean(busy) || !completeness.canGenerate}><FileText size={24} /> {busy || (completeness.canGenerate ? "确认生成 Markdown" : "信息未完整")}</button>
      </div>
    </div>
  );
}

function ResultsPage({ projectSpec, markdownFiles, setMarkdownFiles }) {
  const files = Object.keys(markdownFiles).length ? markdownFiles : generateMarkdownFilesFromSpec(projectSpec || createExampleSpec());
  const [active, setActive] = React.useState("Prompt.md");
  const [exportStatus, setExportStatus] = React.useState("");
  const activeText = files[active] || "";
  function updateActive(value) {
    setMarkdownFiles({ ...files, [active]: value });
  }
  async function copy(text) {
    await navigator.clipboard.writeText(text);
  }
  async function downloadZip() {
    const zip = new JSZip();
    Object.entries(createExportBundleEntries(projectSpec || createExampleSpec(), files)).forEach(([name, content]) =>
      zip.file(name, content)
    );
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    triggerDownload(url, `${projectSpec?.projectName || "codex-long-task-starter"}-files.zip`);
    setExportStatus("已准备 ZIP 下载。");
  }
  function downloadSpecJson() {
    downloadText("project-spec.json", JSON.stringify(projectSpec || createExampleSpec(), null, 2));
    setExportStatus("已准备 project-spec.json 下载。");
  }
  const cliCommand = "npx codex-long-task-starter init --spec ./project-spec.json";
  return (
    <div className="results-page">
      <div className="breadcrumb"><Folder size={26} /> 工作区 / 生成结果</div>
      <div className="page-title"><h1>生成结果预览</h1><p>基于 ProjectSpec 生成的 Codex/OpenCode 长任务文件包</p></div>
      <div className="mode-toggle"><button><PenLine size={18} /> 实时编辑</button><button><Eye size={18} /> 纯预览</button></div>
      <div className="file-tabs">{markdownFileNames.map((t) => <button className={active === t ? "active" : ""} key={t} onClick={() => setActive(t)}>{t === "Prompt.md" ? <FileCode2 size={16} /> : <Braces size={16} />}{t}</button>)}</div>
      <section className="results-grid">
        <article className="panel markdown-preview">
          <header><Eye size={22} /> 预览 <b>已就绪</b></header>
          <div className="md-body"><pre>{activeText}</pre></div>
        </article>
        <article className="panel source-editor">
          <header><Code2 size={22} /> 源码编辑器 <span>UTF-8 Markdown</span></header>
          <textarea value={activeText} onChange={(e) => updateActive(e.target.value)} />
        </article>
      </section>
      <section className="export-bar">
        <div className="cli-copy"><TerminalSquare size={24} /><span>命令</span><code>{cliCommand}</code><button onClick={() => copy(cliCommand)}><Copy size={18} /> 一键复制</button></div>
        <button onClick={() => copy(activeText)}><Copy size={22} /> 复制当前</button>
        <button onClick={() => copy(Object.entries(files).map(([n, c]) => `# ${n}\n\n${c}`).join("\n\n---\n\n"))}><Copy size={22} /> 复制全部</button>
        <button onClick={downloadZip}><Download size={22} /> 下载 ZIP</button>
        <button className="export" onClick={downloadSpecJson}><Upload size={22} /> 导出 JSON</button>
      </section>
      {exportStatus && <p className="inline-status">{exportStatus}</p>}
    </div>
  );
}

function RouteDock({ route, go }) {
  return (
    <div className="route-dock">
      {Object.entries(routes).map(([key, label]) => <button key={key} className={route === key ? "active" : ""} onClick={() => go(key)}>{label}</button>)}
    </div>
  );
}

const rootElement = document.getElementById("root");
rootElement.__cltsRoot ||= createRoot(rootElement);
rootElement.__cltsRoot.render(<App />);
