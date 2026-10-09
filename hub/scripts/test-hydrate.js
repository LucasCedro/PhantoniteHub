function effectiveTarget(session) {
  if (session.target) return session.target;
  if (session.ip) return "http://" + session.ip;
  return "";
}

function hydrateCmd(text, session) {
  let out = text;
  const ip = session.ip || "";
  const target = effectiveTarget(session);
  const lhost = session.lhost || "";
  if (ip) {
    out = out.replaceAll("$IP", ip).replaceAll("IP_DO_ALVO", ip);
    out = out.replace(/^set RHOSTS\s+\S+$/gm, "set RHOSTS " + ip);
  }
  if (target) out = out.replaceAll("$TARGET", target);
  if (lhost) {
    out = out
      .replaceAll("$LHOST", lhost)
      .replaceAll("TEU_LHOST", lhost)
      .replaceAll("TEU_IP_DE_ATAQUE", lhost)
      .replaceAll("/dev/tcp/LHOST/", "/dev/tcp/" + lhost + "/")
      .replace(/^set LHOST\s+\S+$/gm, "set LHOST " + lhost);
  }
  return out;
}

const s = { ip: "10.66.184.42", target: "", lhost: "192.168.167.249" };
const cases = [
  ['ping -c 2 "$IP"', 'ping -c 2 "10.66.184.42"'],
  ['curl -sI "$TARGET"', 'curl -sI "http://10.66.184.42"'],
  ['gobuster -u "$TARGET/"', 'gobuster -u "http://10.66.184.42/"'],
  ["set RHOSTS IP_DO_ALVO", "set RHOSTS 10.66.184.42"],
  ["set LHOST TEU_LHOST", "set LHOST 192.168.167.249"],
  ["/dev/tcp/LHOST/443", "/dev/tcp/192.168.167.249/443"],
  ['export TARGET="http://$IP"', 'export TARGET="http://10.66.184.42"'],
];

let fail = 0;
for (const [inp, want] of cases) {
  const got = hydrateCmd(inp, s);
  if (got !== want) {
    fail++;
    console.log("FAIL", inp, "=>", got, "want", want);
  } else console.log("OK", want);
}

const withTarget = hydrateCmd('curl "$TARGET"', {
  ip: "1.1.1.1",
  target: "https://app.thm",
  lhost: "9.9.9.9",
});
if (withTarget !== 'curl "https://app.thm"') {
  fail++;
  console.log("FAIL explicit target", withTarget);
} else console.log("OK explicit target", withTarget);

if (withTarget.includes('""')) {
  fail++;
  console.log("FAIL double quotes");
}

console.log(fail ? "RESULT FAIL " + fail : "RESULT ALL PASS");
