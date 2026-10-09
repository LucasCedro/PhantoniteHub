/**
 * Public garage terminal — portfolio node.
 * Workstation cage. Bitmite is the only living process.
 */
(() => {
  const logEl = document.querySelector("[data-term-log]");
  const form = document.querySelector("[data-term-form]");
  const input = document.querySelector("[data-term-input]");
  const mirror = document.querySelector("[data-term-mirror]");
  const caret = document.querySelector("[data-term-caret]");
  const termEl = document.querySelector("[data-term]");
  const chipsEl = document.querySelector("[data-term-chips]");
  const clockEl = document.querySelector("[data-term-clock]");
  const hudTrack = document.querySelector("[data-hud-track]");
  const hudEvidence = document.querySelector("[data-hud-evidence]");
  const hudProc = document.querySelector("[data-hud-proc]");
  const hudState = document.querySelector("[data-hud-state]");
  if (!form || !input || !logEl) return;

  const P = window.PORTFOLIO || {};
  const HANDLE = P.handle || "phantonite";
  const HOST = P.host || "garage";
  const LINKS = P.links || {};
  const WRITEUPS = P.writeups || [];
  const HANDLE_B64 = "cGhhbnRvbml0ZQ==";
  const BOOT_KEY = "garage.boot.v2";
  const HINT_KEY = "garage.hint.v1";
  const SCANNERS = new Set([
    "nmap", "masscan", "msfconsole", "msf", "burp", "burpsuite",
    "sqlmap", "hydra", "nikto", "gobuster", "ffuf",
  ]);

  const history = [];
  let histIdx = -1;
  let booting = false;
  let interacted = false;
  let idleTamago = false;

  function reducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function storeGet(k) {
    try { return sessionStorage.getItem(k); } catch { return null; }
  }

  function storeSet(k, v) {
    try { sessionStorage.setItem(k, v); } catch { /* ignore */ }
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  function promptHtml(cmd) {
    const c = cmd != null ? ` <span class="term-cmd">${escapeHtml(cmd)}</span>` : "";
    return `<span class="p">${HANDLE}@${HOST}</span>:<span class="w">~</span>$${c}`;
  }

  function addNode(node) {
    logEl.appendChild(node);
    logEl.scrollTop = logEl.scrollHeight;
    return node;
  }

  function line(html, cls = "") {
    const p = document.createElement("p");
    if (cls) p.className = cls;
    p.innerHTML = html;
    addNode(p);
  }

  function plain(text, cls = "term-out") {
    const p = document.createElement("p");
    p.className = cls;
    p.textContent = text;
    addNode(p);
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

  function panel({ title, rows, foot }) {
    const el = document.createElement("div");
    el.className = "term-panel";
    if (title) {
      const h = document.createElement("p");
      h.className = "term-panel-h";
      h.textContent = title;
      el.appendChild(h);
    }
    (rows || []).forEach(([k, v, html]) => {
      if (!v && !html) return;
      const row = document.createElement("div");
      row.className = "term-kv";
      const key = document.createElement("span");
      key.className = "term-kv-k";
      key.textContent = k;
      const val = document.createElement("span");
      val.className = "term-kv-v";
      if (html) val.innerHTML = html;
      else val.textContent = v;
      row.append(key, val);
      el.appendChild(row);
    });
    if (foot) {
      const f = document.createElement("p");
      f.className = "term-panel-f";
      f.textContent = foot;
      el.appendChild(f);
    }
    addNode(el);
  }

  async function typeLine(text, cls = "term-ice") {
    const p = document.createElement("p");
    p.className = cls;
    addNode(p);
    if (reducedMotion()) {
      p.textContent = text;
      return;
    }
    for (let i = 1; i <= text.length; i++) {
      p.textContent = text.slice(0, i);
      logEl.scrollTop = logEl.scrollHeight;
      await sleep(16);
    }
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

  function bitmitePeek() {
    try {
      return window.PhantonitePet?.peek?.() || null;
    } catch {
      return null;
    }
  }

  function renderHud() {
    if (hudTrack) hudTrack.textContent = "eJPT";
    if (hudEvidence) hudEvidence.textContent = String(WRITEUPS.length);
    if (hudProc) hudProc.textContent = "bitmite";
    if (!hudState) return;
    const pet = window.PhantonitePet;
    if (!pet) {
      hudState.textContent = "offline";
      hudState.className = "hud-s is-dead";
      return;
    }
    const s = bitmitePeek();
    if (!s || !s.discovered) {
      hudState.textContent = idleTamago ? "dormant · tamago" : "dormant";
      hudState.className = idleTamago ? "hud-s is-live" : "hud-s";
      return;
    }
    if (s.dead) {
      hudState.textContent = "dead";
      hudState.className = "hud-s is-dead";
      return;
    }
    const stage = s.stage || "egg";
    const h = Math.round(s.hunger ?? 0);
    const e = Math.round(s.energy ?? 0);
    const m = Math.round(s.mood ?? 0);
    hudState.textContent = `${stage}\nH${h} E${e} M${m}`;
    hudState.className = "hud-s is-live";
  }

  function tickClock() {
    if (!clockEl) return;
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(new Date());
    const get = (t) => parts.find((p) => p.type === t)?.value || "00";
    clockEl.textContent = `${get("hour")}:${get("minute")}:${get("second")} -03`;
  }

  function setBusy(on) {
    booting = on;
    input.disabled = on;
    termEl?.querySelectorAll("[data-chip]").forEach((b) => {
      b.disabled = on;
    });
  }

  function glitchName() {
    const el = document.querySelector(".den-main h1 span");
    if (!el || reducedMotion()) return;
    el.classList.add("is-glitch");
    setTimeout(() => el.classList.remove("is-glitch"), 220);
  }

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function printMotd(animated) {
    const box = el("div", "term-motd" + (animated && !reducedMotion() ? " is-in" : ""));

    const head = el("div", "term-motd-h");
    head.append(el("span", "term-motd-host", HOST), el("span", "term-motd-tag", "public node"));
    box.appendChild(head);

    box.appendChild(el("p", "term-motd-name", P.name || "Lucas Cedro Temponi"));
    box.appendChild(el("p", "term-motd-role", `${HANDLE}  ·  ${P.roleShort || "pentest in training"}`));

    const track = [P.cert, P.focus].filter(Boolean).join("  ·  ");
    if (track) box.appendChild(el("p", "term-motd-meta", track));
    if (P.from) box.appendChild(el("p", "term-motd-from", P.from));

    const ev = el("div", "term-motd-ev");
    ev.appendChild(el("div", "term-motd-ev-k", "evidence"));
    const v = el("div", "term-motd-ev-v");
    const latest = WRITEUPS[0];
    if (!latest) {
      v.appendChild(el("p", "term-motd-ev-src", "none published yet"));
    } else {
      const slug = slugOf(latest, 0);
      const n = WRITEUPS.length;
      v.appendChild(el("p", "term-motd-ev-count", n === 1 ? "1 write-up on record" : `${n} write-ups on record`));
      v.appendChild(el("p", "term-motd-ev-id", slug));
      if (latest.title) v.appendChild(el("p", "term-motd-ev-title", latest.title));
      const src = [latest.platform, latest.tools].filter(Boolean).join(" · ");
      if (src) v.appendChild(el("p", "term-motd-ev-src", src));
      const run = el("button", "term-inline-cmd", `open ${slug}`);
      run.type = "button";
      run.setAttribute("data-chip", `open ${slug}`);
      v.appendChild(run);
    }
    ev.appendChild(v);
    box.appendChild(ev);
    addNode(box);
  }

  function renderChips() {
    if (!chipsEl) return;
    chipsEl.innerHTML = "";
    const items = [
      ["whoami", "whoami"],
      ["writeups", "writeups"],
      ["tamago run", "tamago run"],
    ];
    items.forEach(([cmd, label]) => {
      const b = el("button", "", label);
      b.type = "button";
      b.setAttribute("data-chip", cmd);
      chipsEl.appendChild(b);
    });
  }

  function focusInput() {
    input.focus({ preventScroll: true });
    syncCaret();
  }

  function maybeFocus() {
    const a = document.activeElement;
    if (a === document.body || a === document.documentElement || a === input || !a) {
      focusInput();
    }
  }

  function armIdleHint() {
    if (storeGet(HINT_KEY) === "1") return;
    setTimeout(() => {
      if (interacted) return;
      if (storeGet(HINT_KEY) === "1") return;
      const s = bitmitePeek();
      if (s?.discovered) return;
      idleTamago = true;
      renderHud();
      storeSet(HINT_KEY, "1");
    }, 8000);
  }

  async function playBoot() {
    const replay = storeGet(BOOT_KEY) === "1" || reducedMotion();
    logEl.innerHTML = "";
    renderChips();
    setBusy(true);

    if (replay) {
      printMotd(false);
      plain("type help for more", "term-ice");
    } else {
      glitchName();
      termEl?.classList.add("is-connecting");
      await sleep(280);
      printMotd(true);
      setBusy(true);
      await sleep(260);
      plain("type help for more", "term-ice");
      termEl?.classList.remove("is-connecting");
    }

    storeSet(BOOT_KEY, "1");
    setBusy(false);
    maybeFocus();
    if (!location.hash) {
      window.scrollTo(0, 0);
      requestAnimationFrame(() => window.scrollTo(0, 0));
    }
    armIdleHint();
    renderHud();
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
    const el = document.createElement("div");
    el.className = "term-help";
    const items = [
      ["whoami", "identity card"],
      ["writeups", "published evidence"],
      ["cat README", "about (prose)"],
      ["open <id>", "open a write-up"],
      ["status", "cert track"],
      ["stack", "tools"],
      ["contact", "links"],
      ["tamago run", "open bitmite"],
      ["tamago kill", "kill process + wipe save"],
      ["clear", "wipe scrollback"],
    ];
    items.forEach(([cmd, desc]) => {
      const row = document.createElement("div");
      row.className = "term-help-row";
      const c = document.createElement("span");
      c.className = "term-hl";
      c.textContent = cmd;
      const d = document.createElement("span");
      d.textContent = desc;
      row.append(c, d);
      el.appendChild(row);
    });
    addNode(el);
    plain("also: sudo · nmap · base64", "term-dim");
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
    panel({
      title: "whoami",
      rows: [
        ["name", P.name || "unknown"],
        ["handle", HANDLE],
        ["role", P.roleShort || P.role],
        ["from", P.from],
        ["cert", P.cert],
        ["focus", P.focus],
      ],
    });
  }

  function printStatus() {
    panel({
      title: "status",
      rows: [
        ["cert", P.cert],
        ["focus", P.focus],
        ["labs", P.labs],
      ],
    });
  }

  function printStack() {
    plain((P.stack || []).join(" · ") || "empty");
  }

  function printContact() {
    const rows = [];
    if (LINKS.linkedin) {
      rows.push(["LinkedIn", "", `<a class="term-link" href="${escapeHtml(LINKS.linkedin)}" target="_blank" rel="noopener">in/olucascedro</a>`]);
    }
    if (LINKS.thm) {
      rows.push(["TryHackMe", "", `<a class="term-link" href="${escapeHtml(LINKS.thm)}" target="_blank" rel="noopener">Phantonite</a>`]);
    }
    if (LINKS.medium) {
      rows.push(["Medium", "", `<a class="term-link" href="${escapeHtml(LINKS.medium)}" target="_blank" rel="noopener">@eng.lucascedro</a>`]);
    }
    if (LINKS.email) {
      rows.push(["Email", "", `<a class="term-link" href="mailto:${escapeHtml(LINKS.email)}">${escapeHtml(LINKS.email)}</a>`]);
    }
    panel({ title: "contact", rows });
  }

  function listWriteups() {
    if (!WRITEUPS.length) {
      plain("no write-ups yet — more added as they're published.");
      return;
    }
    const wrap = document.createElement("div");
    wrap.className = "term-table";
    const head = document.createElement("div");
    head.className = "term-table-h";
    head.innerHTML = "<span>id</span><span>cat</span><span>title</span>";
    wrap.appendChild(head);
    WRITEUPS.forEach((w, i) => {
      const slug = slugOf(w, i);
      const row = document.createElement("div");
      row.className = "term-table-r";
      const id = document.createElement("span");
      id.className = "id";
      id.textContent = slug;
      const cat = document.createElement("span");
      cat.textContent = w.category || "web";
      const title = document.createElement("span");
      title.textContent = w.title || "";
      row.append(id, cat, title);
      wrap.appendChild(row);
    });
    addNode(wrap);
    plain("open <id> to open the document", "term-dim");
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
    panel({
      title: slugOf(w, 0),
      rows: [
        ["title", w.title],
        ["where", `${w.platform} · ${w.tools}`],
        ["notes", w.description],
      ],
    });
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
      renderHud();
      return;
    }
    const sub = (args[0] || "run").toLowerCase();
    if (sub === "run" || sub === "open" || sub === "start") {
      pet.open();
      plain("tamago: online · dock open (save intact)");
      renderHud();
      return;
    }
    if (sub === "stop" || sub === "hide" || sub === "close" || sub === "min") {
      pet.close();
      plain("tamago: minimized · chip in the corner to restore");
      renderHud();
      return;
    }
    if (sub === "kill" || sub === "exit" || sub === "destroy") {
      const r = pet.kill?.() || { ok: false };
      plain(
        r.ok ? "tamago: killed · save wiped. `tamago run` to hatch another" : "tamago: kill failed",
        r.ok ? "term-out" : "term-err"
      );
      renderHud();
      return;
    }
    if (sub === "status" || sub === "stat") {
      tamagoStatus();
      renderHud();
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

  function decodeB64(token) {
    if (!token) {
      plain("usage: echo <token> | base64 -d", "term-err");
      return;
    }
    try {
      const clean = String(token).replace(/\s/g, "");
      const out = atob(clean);
      if (!/^[\x20-\x7e]+$/.test(out) || out.length > 80) {
        plain("base64: binary / too long — ignored", "term-err");
        return;
      }
      plain(out);
      if (out === HANDLE) plain("handle confirmed", "term-dim");
    } catch {
      plain("base64: invalid input", "term-err");
    }
  }

  function exec(raw) {
    if (booting) return;
    const cmd = raw.trim();
    if (!cmd) return;
    interacted = true;
    history.push(cmd);
    histIdx = history.length;
    echoCmd(cmd);

    const pipe = cmd.match(/^echo\s+(\S+)\s*\|\s*base64(?:\s+-d(?:ecode)?)?$/i);
    if (pipe) {
      decodeB64(pipe[1]);
      return;
    }

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
    if (head === "sudo") {
      plain(
        `${HANDLE} is not in the sudoers file. this incident will be reported to the recruiter.`,
        "term-err"
      );
      return;
    }
    if (SCANNERS.has(head)) {
      plain("this node is a CV, not a scanner.");
      return;
    }
    if (head === "base64") {
      const tok = args.find((a) => !a.startsWith("-"));
      decodeB64(tok);
      return;
    }
    if (head === "echo") {
      plain(args.join(" "));
      return;
    }
    if (head === "cd") {
      plain("public node · nowhere to cd");
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
    if (booting) return;
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

  termEl?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-chip]");
    if (btn) {
      if (booting) return;
      exec(btn.getAttribute("data-chip") || "");
      focusInput();
      return;
    }
    if (e.target.closest("a, input")) return;
    if (window.getSelection && String(window.getSelection())) return;
    focusInput();
  });

  tickClock();
  renderHud();
  setInterval(() => {
    tickClock();
    renderHud();
  }, 1000);

  syncCaret();
  playBoot();
})();
