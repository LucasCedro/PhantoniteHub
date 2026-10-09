/**
 * Proxy local Groq/OpenAI-compatible (bypass CORS do browser).
 *
 * Uso:
 *   set GROQ_API_KEY=gsk_...     (PowerShell: $env:GROQ_API_KEY="gsk_...")
 *   node scripts/llm-proxy.js
 *
 * No HUB (Params):
 *   LLM base URL = http://127.0.0.1:8787
 *   LLM model    = llama-3.1-8b-instant
 *   LLM API key  = (podes deixar vazio se usares GROQ_API_KEY no env;
 *                   ou cola a key no HUB — o proxy reencaminha o Authorization)
 *
 * Upstream default: https://api.groq.com/openai
 * Override: set LLM_UPSTREAM=https://api.openai.com
 */
const http = require("http");
const https = require("https");
const { URL } = require("url");

const PORT = Number(process.env.LLM_PROXY_PORT || 8787);
const UPSTREAM = (process.env.LLM_UPSTREAM || "https://api.groq.com/openai").replace(/\/$/, "");
const ENV_KEY = (process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY || process.env.LLM_API_KEY || "").trim();

function send(res, status, body, extra = {}) {
  const data = typeof body === "string" ? body : JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    ...extra,
  });
  res.end(data);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function forward(method, pathAndQuery, headers, bodyBuf) {
  const target = new URL(UPSTREAM + pathAndQuery);
  const lib = target.protocol === "http:" ? http : https;
  const auth =
    headers.authorization ||
    headers.Authorization ||
    (ENV_KEY ? `Bearer ${ENV_KEY}` : "");

  const opts = {
    protocol: target.protocol,
    hostname: target.hostname,
    port: target.port || (target.protocol === "http:" ? 80 : 443),
    path: target.pathname + target.search,
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(auth ? { Authorization: auth } : {}),
      "Content-Length": bodyBuf ? bodyBuf.length : 0,
    },
  };

  return new Promise((resolve, reject) => {
    const req = lib.request(opts, (up) => {
      const chunks = [];
      up.on("data", (c) => chunks.push(c));
      up.on("end", () => {
        resolve({
          status: up.statusCode || 502,
          body: Buffer.concat(chunks).toString("utf8"),
        });
      });
    });
    req.on("error", reject);
    if (bodyBuf && bodyBuf.length) req.write(bodyBuf);
    req.end();
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    send(res, 204, "");
    return;
  }

  if (req.method === "GET" && (req.url === "/" || req.url === "/health")) {
    send(res, 200, {
      ok: true,
      upstream: UPSTREAM,
      hasEnvKey: Boolean(ENV_KEY),
      hint: "HUB → LLM base URL = http://127.0.0.1:" + PORT,
    });
    return;
  }

  try {
    const bodyBuf = ["POST", "PUT", "PATCH"].includes(req.method)
      ? await readBody(req)
      : Buffer.alloc(0);

    // /v1/chat/completions → upstream /v1/chat/completions
    const path = req.url || "/";
    if (!path.startsWith("/v1/")) {
      send(res, 404, { error: "use /v1/chat/completions" });
      return;
    }

    const up = await forward(req.method, path, req.headers, bodyBuf);
    console.log(`[llm-proxy] ${req.method} ${path} → ${up.status}`);
    send(res, up.status, up.body);
  } catch (err) {
    send(res, 502, { error: String(err.message || err) });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[llm-proxy] http://127.0.0.1:${PORT}  →  ${UPSTREAM}`);
  console.log(`[llm-proxy] env key: ${ENV_KEY ? "yes" : "no (use Authorization from HUB)"}`);
  console.log(`[llm-proxy] HUB Params: base URL = http://127.0.0.1:${PORT}`);
});
