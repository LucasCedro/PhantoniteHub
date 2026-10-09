/**
 * Testes paste híbrido (regex + sanitize LLM) — sem Ollama.
 * Uso: node scripts/test-llm-paste.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const ctx = { window: {}, console };
vm.createContext(ctx);
for (const f of [
  "data/playbook.js",
  "data/playbook-extra.js",
  "data/error-map.js",
  "data/llm-prompt.js",
  "data/llm-fixtures.js",
]) {
  vm.runInContext(fs.readFileSync(path.join(root, f), "utf8"), ctx);
}

function matchOutput(text, rules) {
  const raw = String(text || "");
  if (!raw.trim() || !Array.isArray(rules)) return [];
  const hits = [];
  for (const rule of rules) {
    const matched = (rule.patterns || []).some((p) => p && typeof p.test === "function" && p.test(raw));
    if (!matched) continue;
    hits.push(rule.id);
  }
  return hits;
}

const pb = ctx.window.HUNTER_PLAYBOOK;
const map = ctx.window.HUNTER_ERROR_MAP;
const llm = ctx.window.HUNTER_LLM;
const fixtures = ctx.window.HUNTER_LLM_FIXTURES;
const allow = new Set(Object.keys(pb.nodes));

let fail = 0;

for (const f of fixtures) {
  const hits = matchOutput(f.raw, map.rules);
  const actual = hits.length ? "hit" : "miss";
  const okRegex = actual === f.expect_regex;
  if (!okRegex) {
    console.log("FAIL regex", f.id, "want", f.expect_regex, "got", actual, hits[0] || "");
    fail++;
  } else {
    console.log("OK regex", f.id, actual);
  }

  if (f.expect_regex === "miss" && f.expect_ai) {
    const sanitized = llm.sanitizeResponse(f.expect_ai, allow);
    if (!sanitized.ok) {
      console.log("FAIL sanitize", f.id);
      fail++;
    } else {
      const bad = sanitized.data.suggestions.filter((s) => !allow.has(s.nodeId));
      if (bad.length) {
        console.log("FAIL allowlist", f.id, bad);
        fail++;
      } else {
        console.log("OK ai-schema", f.id, "n=", sanitized.data.suggestions.length);
      }
    }
  }
}

// ghost node discarded
{
  const ghost = llm.sanitizeResponse(
    {
      hypothesis: "teste",
      confidence: "high",
      suggestions: [
        { nodeId: "nao-existe-123", reason: "x", params: {} },
        { nodeId: "web", reason: "ok", params: { TARGET: "http://1.2.3.4" } },
      ],
    },
    allow
  );
  if (!ghost.ok || ghost.data.suggestions.length !== 1 || ghost.data.suggestions[0].nodeId !== "web") {
    console.log("FAIL ghost filter", ghost);
    fail++;
  } else console.log("OK ghost filter");
}

if (fail) {
  console.error(`FAIL: ${fail}`);
  process.exit(1);
}
console.log(
  JSON.stringify(
    { fixtures: fixtures.length, errorMap: map.meta.version, llm: llm.meta.version },
    null,
    2
  )
);
console.log("OK");
