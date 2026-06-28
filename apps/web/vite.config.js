import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

function normalizeBaseUrl(baseUrl) {
  return String(baseUrl || "").replace(/\/+$/, "");
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function localApiProxyPlugin() {
  return {
    name: "codex-local-api-proxy",
    configureServer(server) {
      server.middlewares.use("/api/chat-completions", async (req, res) => {
        if (req.method !== "POST") {
          sendJson(res, 405, { error: "仅支持 POST 请求。" });
          return;
        }
        try {
          const body = await readJsonBody(req);
          const baseUrl = normalizeBaseUrl(body.baseUrl);
          const apiKey = body.apiKey;
          const payload = body.payload;
          if (!baseUrl || !apiKey || !payload?.model || !Array.isArray(payload.messages)) {
            sendJson(res, 400, { error: "缺少 baseUrl、apiKey、model 或 messages。" });
            return;
          }
          const upstream = await fetch(`${baseUrl}/chat/completions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`
            },
            body: JSON.stringify(payload)
          });
          const text = await upstream.text();
          res.statusCode = upstream.status;
          res.setHeader("Content-Type", upstream.headers.get("content-type") || "application/json; charset=utf-8");
          res.end(text);
        } catch (error) {
          sendJson(res, 502, { error: `本地代理请求失败：${error.message}` });
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), localApiProxyPlugin()]
});
