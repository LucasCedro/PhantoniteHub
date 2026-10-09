/**
 * Smoke leve do error-map matcher (ADR-002).
 * Uso: node scripts/test-error-map.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const ctx = { window: {}, console };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, "data/playbook.js"), "utf8"), ctx);
vm.runInContext(fs.readFileSync(path.join(root, "data/playbook-extra.js"), "utf8"), ctx);
vm.runInContext(fs.readFileSync(path.join(root, "data/error-map.js"), "utf8"), ctx);

const pb = ctx.window.HUNTER_PLAYBOOK;
const map = ctx.window.HUNTER_ERROR_MAP;
if (!map?.rules?.length) {
  console.error("FAIL: HUNTER_ERROR_MAP ausente");
  process.exit(1);
}

function matchOutput(text, rules) {
  const raw = String(text || "");
  if (!raw.trim() || !Array.isArray(rules)) return [];
  const hits = [];
  for (const rule of rules) {
    const matched = (rule.patterns || []).some((p) => {
      if (p && typeof p.test === "function") return p.test(raw);
      if (typeof p === "string") return raw.toLowerCase().includes(p.toLowerCase());
      return false;
    });
    if (!matched) continue;
    hits.push({
      id: rule.id,
      to: rule.to ?? null,
      priority: Number(rule.priority) || 0,
    });
  }
  hits.sort((a, b) => b.priority - a.priority || String(a.id).localeCompare(String(b.id)));
  const seen = new Set();
  const out = [];
  for (const h of hits) {
    const key = h.to == null ? `hint:${h.id}` : `to:${h.to}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(h);
    if (out.length >= 3) break;
  }
  return out;
}

const badTargets = map.rules
  .filter((r) => r.to != null && !pb.nodes[r.to])
  .map((r) => `${r.id}->${r.to}`);
if (badTargets.length) {
  console.error("FAIL: to inválido", badTargets);
  process.exit(1);
}

const ids = map.rules.map((r) => r.id);
const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
if (dup.length) {
  console.error("FAIL: id duplicado", dup);
  process.exit(1);
}

  const cases = [
  { text: "curl: (7) Failed to connect to 10.10.10.1 port 80: Connection refused", expect: "alive" },
  { text: "HTTP/1.1 401 Unauthorized\nWWW-Authenticate: Basic", expect: "web-auth" },
  { text: "kinit: Clock skew too great while getting initial credentials (KRB_AP_ERR_SKEW)", expect: "kerberos" },
  { text: "You have an error in your SQL syntax; check the manual", expect: "web-sqli" },
  { text: "Warning: include(../../../../etc/passwd): failed to open stream", expect: "web-lfi" },
  { text: "Connection timed out AND You have an error in your SQL syntax", expectTop: "web-sqli" },
  { text: "HTTP/1.1 429 Too Many Requests", expectNull: true },
  { text: "kex_exchange_identification: Connection closed by remote host", expect: "ssh" },
  { text: "evil-winrm: WinRM::WinRMAuthorizationError", expect: "winrm" },
  { text: "ldap_bind: Invalid credentials (49)", expect: "ldap" },
  { text: "[!] heuristic indicates that the target is protected by a WAF/IPS", expect: "web-sqli" },
  { text: "gobuster: error: the server returns a status code that matches the provided options", expect: "web" },
];

let fail = 0;
for (const c of cases) {
  const hits = matchOutput(c.text, map.rules);
  const top = hits[0]?.to ?? null;
  let ok;
  if (c.expectNull) ok = top == null && hits[0]?.id === "http-429";
  else if (c.expectTop) ok = top === c.expectTop;
  else ok = top === c.expect;
  const want = c.expectNull ? "null(http-429)" : c.expectTop || c.expect;
  console.log(ok ? "OK" : "FAIL", JSON.stringify(c.text.slice(0, 52)), "→", top, `(want ${want})`);
  if (!ok) fail++;
}

if (fail) {
  console.error(`FAIL: ${fail}/${cases.length}`);
  process.exit(1);
}
console.log(
  JSON.stringify({ version: map.meta.version, rules: map.rules.length, cases: cases.length }, null, 2)
);
console.log("OK");
