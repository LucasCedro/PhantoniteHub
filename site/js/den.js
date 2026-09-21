/**
 * Public garage terminal — portfolio node.
 * Same interaction as the HUB den. No field guide.
 */
(() => {
  const logEl = document.querySelector("[data-term-log]");
  const form = document.querySelector("[data-term-form]");
  const input = document.querySelector("[data-term-input]");
  const mirror = document.querySelector("[data-term-mirror]");
  const caret = document.querySelector("[data-term-caret]");
  if (!form || !input || !logEl) return;

  const P = window.PORTFOLIO || {};
  const HANDLE = P.handle || "phantonite";
  const HOST = P.host || "garage";
  const LINKS = P.links || {};
  const WRITEUPS = P.writeups || [];

  const history = [];
  let histIdx = -1;

  function promptHtml(cmd) {
    const c = cmd != null ? ` <span class="term-cmd">${escapeHtml(cmd)}</span>` : "";
    return `<span class="p">${HANDLE}@${HOST}</span>:<span class="w">~</span>$${c}`;
  }

  function line(html, cls = "") {
    const p = document.createElement("p");
    if (cls) p.className = cls;
    p.innerHTML = html;
    logEl.appendChild(p);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function plain(text, cls = "term-out") {
    const p = document.createElement("p");
    p.className = cls;
    p.textContent = text;
    logEl.appendChild(p);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function echoCmd(cmd) {
    line(promptHtml(cmd));
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function kv(key, value) {
    if (!value) return;
    plain(key.padEnd(10, " ") + value);
  }

  function slugOf(w, i) {
    if (w.id) return String(w.id);
    return (
      String(w.title || "writeup")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || `w${i + 1}`
    );
  }

  function findWriteup(token) {
    if (!token) return null;
    const t = token.toLowerCase();
    const byIndex = WRITEUPS[Number(t) - 1];
    if (/^\d+$/.test(t) && byIndex) return byIndex;
    return WRITEUPS.find((w, i) => slugOf(w, i) === t) || null;
  }

  function bitmiteLine() {
    const pet = window.PhantonitePet;
    if (!pet) {
      plain("bitmite: firmware offline", "term-err");
      return;
    }
    const s = pet.peek?.() || pet.ensure();
    if (!s?.discovered) {
      plain("bitmite: no signal · try: tamago run");
      return;
    }
    if (!s.guruUnlocked && s.stage !== "guru") {
      plain("bitmite: locked · reach Guru to open this channel");
      return;
    }
    const scarred = (s.careMistakes || 0) >= 3;
    plain("── bitmite uplink ──");
    plain(
      scarred
        ? `${s.name || "BITMITE"} · SCARRED GURU · mistakes ${s.careMistakes}`
        : `${s.name || "BITMITE"} · SERENE GURU`
    );
    plain(
      scarred
        ? '"I survived your misses. the lab did too."'
        : '"patience is the best exploit. wait for timing."'
    );
  }

  function help() {
    plain("commands:");
    plain("  whoami          — identity card");
    plain("  cat README      — about (prose)");
    plain("  writeups        — published evidence");
    plain("  open <id>       — open a write-up");
    plain("  status          — cert track");
    plain("  stack           — tools");
    plain("  contact         — links");
    plain("  tamago run      — open bitmite");
    plain("  tamago kill     — kill process + wipe save");
    plain("  clear           — wipe scrollback");
    plain("  help");
  }

  function printAbout() {
    const paras = P.about || [];
    if (!paras.length) {
      plain("README: empty");
      return;
    }
    paras.forEach((para, i) => {
      if (i) plain("");
      plain(para);
    });
  }

  function printWhoami() {
    kv("name", P.name || "unknown");
    kv("handle", HANDLE);
    kv("role", P.roleShort || P.role);
    kv("from", P.from);
    kv("cert", P.cert);
    kv("focus", P.focus);
  }

  function printStatus() {
    kv("cert", P.cert);
    kv("focus", P.focus);
    kv("labs", P.labs);
  }

  function printStack() {
    plain((P.stack || []).join(" · ") || "empty");
  }

  function printContact() {
    if (LINKS.linkedin) line(`LinkedIn   <a class="term-link" href="${escapeHtml(LINKS.linkedin)}" target="_blank" rel="noopener">in/olucascedro</a>`);
    if (LINKS.thm) line(`TryHackMe  <a class="term-link" href="${escapeHtml(LINKS.thm)}" target="_blank" rel="noopener">Phantonite</a>`);
    if (LINKS.medium) line(`Medium     <a class="term-link" href="${escapeHtml(LINKS.medium)}" target="_blank" rel="noopener">@eng.lucascedro</a>`);
    if (LINKS.email) line(`Email      <a class="term-link" href="mailto:${escapeHtml(LINKS.email)}">${escapeHtml(LINKS.email)}</a>`);
  }

  function listWriteups() {
    if (!WRITEUPS.length) {
      plain("no write-ups yet — more added as they're published.");
      return;
    }
    WRITEUPS.forEach((w, i) => {
      const slug = slugOf(w, i);
      if (i) plain("");
      plain(`[${i + 1}] ${w.category}  ${w.title}`);
      plain(`    ${w.platform} · ${w.tools}`);
      plain(`    id  ${slug}`);
    });
    plain("");
    plain("use the command open <id> to open the document");
  }

  function openWriteup(token) {
    if (!token) {
      plain("usage: open <id>", "term-err");
      plain("try: writeups");
      return;
    }
    const w = findWriteup(token);
    if (!w) {
      plain(`no write-up '${token}' — try: writeups`, "term-err");
      return;
    }
    plain(`${w.title}`);
    plain(`${w.platform} · ${w.tools}`);
    if (w.description) plain(w.description);
    if (w.url) {
      line(`opening <a class="term-link" href="${escapeHtml(w.url)}" target="_blank" rel="noopener">${escapeHtml(w.url)}</a>`);
      window.open(w.url, "_blank", "noopener");
    }
  }

  function tamagoStatus() {
    const pet = window.PhantonitePet;
    if (!pet) return plain("tamago: firmware offline", "term-err");
    const s = pet.peek?.() || pet.ensure();
    if (!s || !s.discovered) {
      plain("tamago: no process · try: tamago run");
      return;
    }
    plain(
      `${s.name} · ${s.dead ? "DEAD" : s.stage} · H${s.hunger} E${s.energy} M${s.mood} · cares ${s.cares}`
    );
  }

  function runTamago(args) {
    const pet = window.PhantonitePet;
    if (!pet) {
      plain("tamago: module not loaded", "term-err");
      return;
    }
    const sub = (args[0] || "run").toLowerCase();
    if (sub === "run" || sub === "open" || sub === "start") {
      pet.open();
      plain("tamago: online · dock open (save intact)");
      return;
    }
    if (sub === "stop" || sub === "hide" || sub === "close" || sub === "min") {
      pet.close();
      plain("tamago: minimized · chip in the corner to restore");
      return;
    }
    if (sub === "kill" || sub === "exit" || sub === "destroy") {
      const r = pet.kill?.() || { ok: false };
      plain(
        r.ok ? "tamago: killed · save wiped. `tamago run` to hatch another" : "tamago: kill failed",
        r.ok ? "term-out" : "term-err"
      );
      return;
    }
    if (sub === "status" || sub === "stat") {
      tamagoStatus();
      return;
    }
    if (sub === "name" || sub === "rename") {
      const r = pet.rename(args.slice(1).join(" "));
      plain(r.msg, r.ok ? "term-out" : "term-err");
      return;
    }
    if (sub === "help") {
      plain("tamago run    → open / maximize (does not reset)");
      plain("tamago stop   → minimize (chip in the corner)");
      plain("tamago kill   → kill process + wipe save");
      plain("tamago status | name <nick>");
      return;
    }
    plain(`tamago: unknown subcommand '${sub}' — try: tamago help`, "term-err");
  }

  function openLink(which) {
    const map = {
      linkedin: LINKS.linkedin,
      thm: LINKS.thm,
      tryhackme: LINKS.thm,
      medium: LINKS.medium,
      mail: LINKS.email ? `mailto:${LINKS.email}` : "",
      email: LINKS.email ? `mailto:${LINKS.email}` : "",
    };
    const href = map[which];
    if (!href) {
      plain(`no link for '${which}'`, "term-err");
      return;
    }
    if (href.startsWith("mailto:")) {
      location.href = href;
      plain(LINKS.email);
      return;
    }
    window.open(href, "_blank", "noopener");
    plain(href);
  }

  function exec(raw) {
    const cmd = raw.trim();
    if (!cmd) return;
    history.push(cmd);
    histIdx = history.length;
    echoCmd(cmd);

    const parts = cmd.split(/\s+/);
    const head = parts[0].toLowerCase();
    const args = parts.slice(1);
    const rest = args.join(" ").toLowerCase();

    if (head === "help" || head === "?" || head === "man") {
      help();
      return;
    }
    if (head === "clear" || head === "cls") {
      logEl.innerHTML = "";
      return;
    }
    if (head === "whoami" || head === "id") {
      printWhoami();
      return;
    }
    if (head === "status" || head === "cert") {
      printStatus();
      return;
    }
    if (head === "stack" || head === "tools") {
      printStack();
      return;
    }
    if (head === "contact" || head === "links") {
      printContact();
      return;
    }
    if (head === "writeups" || head === "writeup") {
      listWriteups();
      return;
    }
    if (head === "linkedin" || head === "thm" || head === "tryhackme" || head === "medium" || head === "mail" || head === "email") {
      openLink(head);
      return;
    }
    if (head === "open") {
      const key = (args[0] || "").toLowerCase();
      if (["linkedin", "thm", "tryhackme", "medium", "mail", "email"].includes(key)) {
        openLink(key);
        return;
      }
      openWriteup(key.replace(/^writeups\//, ""));
      return;
    }
    if (head === "cat") {
      const target = rest;
      if (!target || target === "readme" || target === "about") {
        printAbout();
        return;
      }
      if (target === "status") {
        printStatus();
        return;
      }
      if (target === "writeups" || target === "writeups/") {
        listWriteups();
        return;
      }
      if (target.startsWith("writeups/") || target.startsWith("write-ups/")) {
        openWriteup(target.split("/")[1]);
        return;
      }
      plain(`cat: ${args[0] || "file"}: no such file`, "term-err");
      return;
    }
    if (head === "ls" || head === "ll") {
      if (!args.length) {
        plain("README");
        plain("writeups");
        plain("stack");
        plain("contact");
        return;
      }
      if (args[0].toLowerCase().startsWith("writeup")) {
        listWriteups();
        return;
      }
      plain(`ls: cannot access '${args[0]}': no such file`, "term-err");
      return;
    }
    if (head === "about") {
      printAbout();
      return;
    }
    if (head === "tamago" || head === "tamagotchi" || head === "./tamago") {
      runTamago(args.length ? args : ["run"]);
      return;
    }
    if (head === "bitmite" || head === "./bitmite") {
      bitmiteLine();
      return;
    }
    if (head === "./hub.sh" || head === "hub" || head === "./hub" || head === "guide") {
      plain("this node is public. no field guide here.");
      plain("try: whoami · writeups · help");
      return;
    }
    plain(`command not found: ${head}`, "term-err");
    plain("type help");
  }

  function syncCaret() {
    if (!mirror || !caret) return;
    const pos = input.selectionStart ?? input.value.length;
    mirror.textContent = input.value.slice(0, pos);
    caret.style.left = `${mirror.offsetWidth}px`;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const v = input.value;
    input.value = "";
    exec(v);
    syncCaret();
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!history.length) return;
      histIdx = Math.max(0, histIdx - 1);
      input.value = history[histIdx] || "";
      requestAnimationFrame(syncCaret);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      histIdx = Math.min(history.length, histIdx + 1);
      input.value = history[histIdx] || "";
      requestAnimationFrame(syncCaret);
    }
  });

  input.addEventListener("input", syncCaret);
  input.addEventListener("keyup", syncCaret);
  input.addEventListener("click", syncCaret);
  input.addEventListener("focus", syncCaret);
  document.addEventListener("selectionchange", () => {
    if (document.activeElement === input) syncCaret();
  });

  document.querySelector("[data-term]")?.addEventListener("click", () => {
    input.focus();
    syncCaret();
  });

  syncCaret();
})();
