/**
 * Smoke: carrega playbook.js + playbook-extra.js e valida links/órfãos.
 * Uso: node scripts/smoke-playbook.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const ctx = { window: {}, console };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, "data/playbook.js"), "utf8"), ctx);
vm.runInContext(fs.readFileSync(path.join(root, "data/playbook-extra.js"), "utf8"), ctx);

const pb = ctx.window.HUNTER_PLAYBOOK;
if (!pb) {
  console.error("FAIL: HUNTER_PLAYBOOK ausente");
  process.exit(1);
}

const nodes = Object.keys(pb.nodes);
const broken = [];
for (const [id, n] of Object.entries(pb.nodes)) {
  for (const c of n.choices || []) {
    if (!pb.nodes[c.to]) broken.push(`${id} -> ${c.to}`);
  }
}

function bfs(start) {
  const seen = new Set([start]);
  const q = [start];
  while (q.length) {
    const cur = q.shift();
    for (const c of pb.nodes[cur].choices || []) {
      if (!seen.has(c.to) && pb.nodes[c.to]) {
        seen.add(c.to);
        q.push(c.to);
      }
    }
  }
  return seen;
}

const reach = bfs(pb.start);
const orphans = nodes.filter((n) => !reach.has(n));
const outlineIds = [];
(function walk(list) {
  for (const x of list || []) {
    outlineIds.push(x.id);
    if (x.children) walk(x.children);
  }
})(pb.outline);
const outlineMissing = outlineIds.filter((id) => !pb.nodes[id]);

const report = {
  version: pb.meta.version,
  nodes: nodes.length,
  choices: Object.values(pb.nodes).reduce((a, n) => a + (n.choices || []).length, 0),
  broken,
  orphans,
  outlineMissing,
};

console.log(JSON.stringify(report, null, 2));

if (broken.length || orphans.length || outlineMissing.length) {
  console.error("FAIL");
  process.exit(1);
}
console.error("OK");
