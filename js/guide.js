(() => {
  const STORAGE_KEY = "phantonite-hub-v1";
  const SESSION_KEY = "phantonite-hub-session";
  const NOTES_KEY = "phantonite-hub-notes";
  const COMPACT_KEY = "phantonite-hub-compact";
  const LEGACY = {
    state: "jornada-hunter-v1",
    session: "jornada-hunter-session",
    notes: "jornada-hunter-notes",
    compact: "jornada-hunter-compact",
  };

  const DEFAULTS = {
    lport: "443",
    wordlist: "/usr/share/wordlists/dirb/common.txt",
    wordlist_pass: "/usr/share/wordlists/rockyou.txt",
    wordlist_params:
      "/usr/share/seclists/Discovery/Web-Content/burp-parameter-names.txt",
    users: "users.txt",
    hydra_t: "4",
    hydra_fail: "Invalid",
    nmap_minrate: "2000",
    sqlmap_opts: "--batch --level=5 --risk=2",
    sqlmap_param: "email",
  };

  const pb = window.HUNTER_PLAYBOOK;
  if (!pb) {
    console.error("Playbook não carregou");
    return;
  }

  const state = loadState();
  const session = loadSession();

  const els = {
    phase: document.querySelector("[data-phase]"),
    title: document.querySelector("[data-title]"),
    say: document.querySelector("[data-say]"),
    blocks: document.querySelector("[data-blocks]"),
    choices: document.querySelector("[data-choices]"),
    crumb: document.querySelector("[data-crumb]"),
    mini: document.querySelector("[data-mini]"),
    toast: document.querySelector("[data-toast]"),
    notes: document.querySelector("[data-notes]"),
    help: document.querySelector("[data-help]"),
    drawer: document.querySelector("[data-params-drawer]"),
    backdrop: document.querySelector(".params-backdrop"),
    chip: document.querySelector("[data-chip-summary]"),
  };

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY.state);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return { nodeId: pb.start, trail: [pb.start], visited: [pb.start] };
  }

  function loadSession() {
    try {
      return JSON.parse(
        localStorage.getItem(SESSION_KEY) || localStorage.getItem(LEGACY.session) || "{}"
      );
    } catch (_) {
      return {};
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function saveSession() {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  function toast(msg) {
    if (!els.toast) return;
    els.toast.textContent = msg;
    els.toast.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => els.toast.classList.remove("show"), 1600);
  }

  function val(key) {
    const v = (session[key] || "").trim();
    if (v) return v;
    return DEFAULTS[key] || "";
  }

  function effectiveTarget() {
    if (session.target) return session.target;
    if (session.ip) return `http://${session.ip}`;
    return "";
  }

  function updateChip() {
    if (!els.chip) return;
    const ip = session.ip || "IP?";
    const tgt = effectiveTarget() || "TARGET?";
    const lh = session.lhost || "LHOST?";
    const lp = val("lport");
    els.chip.textContent = `${ip}  ·  ${tgt}  ·  LHOST ${lh}:${lp}`;
  }

  function buildExports() {
    const ip = session.ip || "IP_DO_ALVO";
    const target = effectiveTarget() || `http://${ip}`;
    const lhost = session.lhost || "TEU_IP_DE_ATAQUE";
    const domain = session.domain || "dominio.se.houver";
    return `# Phantonite HUB — cola no Kali
export IP="${ip}"
export DOMAIN="${domain}"
export TARGET="${target}"
export LHOST="${lhost}"
export LPORT="${val("lport")}"
export RPORT="${session.rport || ""}"
export WORDLIST="${val("wordlist")}"
export WORDLIST_PASS="${val("wordlist_pass")}"
export WORDLIST_PARAMS="${val("wordlist_params")}"
export USERS="${val("users")}"
export HYDRA_T="${val("hydra_t")}"
export HYDRA_FAIL="${val("hydra_fail")}"
export NMAP_MINRATE="${val("nmap_minrate")}"
export NMAP_EXTRA="${session.nmap_extra || ""}"
export SQLMAP_OPTS="${val("sqlmap_opts")}"
export SQLMAP_PARAM="${val("sqlmap_param")}"
export NOTES="$HOME/engagements/phantonite-$(date +%Y%m%d)"
mkdir -p "$NOTES"/{recon,evidence,requests,findings}
cd "$NOTES"
echo "Alvo: $IP | $DOMAIN | $TARGET | LHOST $LHOST:$LPORT"`;
  }

  function hydrateCmd(text) {
    let out = text;
    const ip = session.ip || "";
    const target = effectiveTarget();
    const lhost = session.lhost || "";
    const lport = val("lport");
    const rport = session.rport || "";
    const wordlist = val("wordlist");
    const wordlistPass = val("wordlist_pass");
    const wordlistParams = val("wordlist_params");
    const users = val("users");
    const hydraT = val("hydra_t");
    const hydraFail = val("hydra_fail");
    const nmapRate = val("nmap_minrate");
    const nmapExtra = session.nmap_extra || "";
    const sqlmapOpts = val("sqlmap_opts");
    const sqlmapParam = val("sqlmap_param");

    if (ip) {
      out = out.replaceAll("$IP", ip).replaceAll("IP_DO_ALVO", ip);
      out = out.replace(/^set RHOSTS\s+\S+$/gm, `set RHOSTS ${ip}`);
    }
    if (target) out = out.replaceAll("$TARGET", target);
    const domain = (session.domain || "").trim();
    if (domain) {
      out = out
        .replaceAll("$DOMAIN", domain)
        .replaceAll("dominio.se.houver", domain);
    }
    if (lhost) {
      out = out
        .replaceAll("$LHOST", lhost)
        .replaceAll("TEU_LHOST", lhost)
        .replaceAll("TEU_IP_DE_ATAQUE", lhost)
        .replaceAll("/dev/tcp/LHOST/", `/dev/tcp/${lhost}/`)
        .replace(/^set LHOST\s+\S+$/gm, `set LHOST ${lhost}`);
    }

    out = out.replaceAll("$LPORT", lport);
    out = out.replace(/\/dev\/tcp\/([^/]+)\/LPORT\b/g, `/dev/tcp/$1/${lport}`);
    out = out.replace(/\/LPORT\b/g, `/${lport}`);
    if (rport) {
      out = out.replaceAll("$RPORT", rport);
      out = out.replace(/:PORTA\b/g, `:${rport}`);
      out = out.replace(/-s PORTA\b/g, `-s ${rport}`);
      out = out.replace(/^set RPORT\s+\S+$/gm, `set RPORT ${rport}`);
    }

    out = out
      .replaceAll("$WORDLIST", wordlist)
      .replaceAll("CAMINHO_DA_TUA_WORDLIST", wordlist)
      .replaceAll("CAMINHO_WORDLIST", wordlist)
      .replaceAll("$WORDLIST_PASS", wordlistPass)
      .replaceAll("CAMINHO_ROCKYOU", wordlistPass)
      .replaceAll("$WORDLIST_PARAMS", wordlistParams)
      .replaceAll("CAMINHO_PARAMS", wordlistParams)
      .replaceAll("$USERS", users)
      .replaceAll("$HYDRA_T", hydraT)
      .replaceAll("$HYDRA_FAIL", hydraFail)
      .replaceAll("$NMAP_MINRATE", nmapRate)
      .replaceAll("$NMAP_EXTRA", nmapExtra)
      .replaceAll("$SQLMAP_OPTS", sqlmapOpts)
      .replaceAll("$SQLMAP_PARAM", sqlmapParam)
      .replaceAll("NOME_DO_PARAM", sqlmapParam);

    // hydra -t default in templates
    out = out.replace(/-t 4\b/g, `-t ${hydraT}`);
    out = out.replace(/F=Invalid\b/g, `F=${hydraFail}`);
    out = out.replace(/--min-rate 2000\b/g, `--min-rate ${nmapRate}`);
    if (nmapExtra) {
      out = out.replace(/nmap (-sV)/g, `nmap ${nmapExtra} $1`);
    }

    return out;
  }

  function refreshHydratedCmds() {
    document.querySelectorAll("pre[data-raw]").forEach((pre) => {
      const raw = decodeURIComponent(pre.getAttribute("data-raw") || "");
      const code = pre.querySelector("code");
      if (code) code.textContent = hydrateCmd(raw);
    });
    updateChip();
  }

  function fillSessionInputs() {
    document.querySelectorAll("[data-field]").forEach((input) => {
      const key = input.getAttribute("data-field");
      input.value = session[key] || "";
      input.addEventListener("input", () => {
        session[key] = input.value.trim();
        saveSession();
        refreshHydratedCmds();
      });
    });
    updateChip();
  }

  function isHelpOpen() {
    return els.help && !els.help.hasAttribute("hidden");
  }

  function openHelp() {
    els.help?.removeAttribute("hidden");
    els.help?.classList.add("open");
  }

  function closeHelp() {
    els.help?.setAttribute("hidden", "");
    els.help?.classList.remove("open");
  }

  function toggleHelp() {
    if (isHelpOpen()) closeHelp();
    else openHelp();
  }

  function openParams() {
    closeHelp();
    els.drawer?.removeAttribute("hidden");
    els.backdrop?.removeAttribute("hidden");
    document.querySelector("[data-field='ip']")?.focus();
  }

  function closeParams() {
    els.drawer?.setAttribute("hidden", "");
    els.backdrop?.setAttribute("hidden", "");
  }

  function resetParams() {
    if (!confirm("Limpar todos os parâmetros salvos?")) return;
    Object.keys(session).forEach((k) => delete session[k]);
    saveSession();
    document.querySelectorAll("[data-field]").forEach((input) => {
      input.value = "";
    });
    refreshHydratedCmds();
    toast("Params limpos");
  }

  async function copyText(text, okMsg) {
    try {
      await navigator.clipboard.writeText(text);
      toast(okMsg || "Copiado");
    } catch (_) {
      toast("Falha ao copiar");
    }
  }

  function go(id, { push = true } = {}) {
    const node = pb.nodes[id];
    if (!node) return;
    state.nodeId = id;
    if (push) {
      const last = state.trail[state.trail.length - 1];
      if (last !== id) state.trail.push(id);
    }
    if (!state.visited.includes(id)) state.visited.push(id);
    saveState();
    render();
    history.replaceState(null, "", `#${id}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() {
    if (state.trail.length < 2) return;
    state.trail.pop();
    const id = state.trail[state.trail.length - 1];
    state.nodeId = id;
    saveState();
    render();
    history.replaceState(null, "", `#${id}`);
  }

  function reset() {
    if (!confirm("Zerar trilha? (parâmetros e notas ficam)")) return;
    state.nodeId = pb.start;
    state.trail = [pb.start];
    state.visited = [pb.start];
    saveState();
    go(pb.start, { push: false });
    toast("Trilha zerada");
  }

  function esc(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function renderCmd(block) {
    const id = "cmd-" + Math.random().toString(36).slice(2, 9);
    const raw = block.cmd;
    const shown = hydrateCmd(raw);
    return `
      <div class="cmd">
        <div class="cmd-bar">
          <span>${esc(block.label || "cmd")}</span>
          <button type="button" class="copy" data-copy="${id}">copiar</button>
        </div>
        <pre id="${id}" data-raw="${encodeURIComponent(raw)}"><code>${esc(shown)}</code></pre>
      </div>
      ${block.why ? `<details class="why"><summary>Por que esse passo</summary><p>${esc(block.why)}</p></details>` : ""}
    `;
  }

  function renderBlocks(blocks = []) {
    return blocks
      .map((b) => {
        const body = [b.html || "", b.cmd ? renderCmd(b) : ""].join("");
        return `<article class="block"><h2>${esc(b.title)}</h2>${body}</article>`;
      })
      .join("");
  }

  function renderChoices(choices = []) {
    return choices
      .map(
        (c, i) => `
      <button type="button" class="choice" data-to="${esc(c.to)}" data-choice-index="${i}">
        <strong><span class="choice-key">${i + 1}</span>${esc(c.label)}</strong>
        ${c.hint ? `<span>${esc(c.hint)}</span>` : "<span></span>"}
        <i>→</i>
      </button>`
      )
      .join("");
  }

  function shortTitle(id) {
    const t = pb.nodes[id]?.title || id;
    return t.length > 26 ? `${t.slice(0, 24)}…` : t;
  }

  function renderCrumb() {
    const trail = state.trail;
    const max = 8;
    const start = Math.max(0, trail.length - max);
    const slice = trail.slice(start);
    const prefix =
      start > 0 ? `<li class="trail-more"><span>…</span></li>` : "";
    els.crumb.innerHTML =
      prefix +
      slice
        .map((id, idx) => {
          const absoluteIdx = start + idx;
          const current = absoluteIdx === trail.length - 1;
          return `<li><button type="button" data-jump="${id}" class="${current ? "current" : ""}" title="${esc(pb.nodes[id]?.title || id)}">${esc(shortTitle(id))}</button></li>`;
        })
        .join("");
  }

  function renderMini(list = pb.outline, depth = 0) {
    return `<ul class="tree-mini ${depth ? "branch" : ""}">${list
      .map((item) => {
        const here = item.id === state.nodeId;
        const done = state.visited.includes(item.id);
        const kids = item.children ? renderMini(item.children, depth + 1) : "";
        return `<li>
          <button type="button" data-jump="${item.id}" class="${here ? "here" : done ? "done" : ""}">${esc(item.label)}</button>
          ${kids}
        </li>`;
      })
      .join("")}</ul>`;
  }

  function render() {
    const node = pb.nodes[state.nodeId];
    if (!node) return;
    els.phase.textContent = node.phase || "HUB";
    els.title.textContent = node.title;
    els.say.textContent = node.say || "";
    els.say.className =
      "say" + (node.tone === "warn" ? " warn" : node.tone === "danger" ? " danger" : "");
    els.blocks.innerHTML = renderBlocks(node.blocks);
    els.choices.innerHTML = renderChoices(node.choices);
    renderCrumb();
    if (els.mini) els.mini.innerHTML = renderMini();
    updateChip();
  }

  function isTyping(el) {
    if (!el) return false;
    const tag = el.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable;
  }

  document.addEventListener("click", (e) => {
    const to = e.target.closest("[data-to]");
    if (to) {
      go(to.getAttribute("data-to"));
      return;
    }
    const jump = e.target.closest("[data-jump]");
    if (jump) {
      const id = jump.getAttribute("data-jump");
      if (!pb.nodes[id]) return;
      const idx = state.trail.indexOf(id);
      if (idx >= 0) state.trail = state.trail.slice(0, idx + 1);
      go(id, { push: idx < 0 });
      return;
    }
    const copyBtn = e.target.closest("[data-copy]");
    if (copyBtn) {
      const pre = document.getElementById(copyBtn.getAttribute("data-copy"));
      const raw = decodeURIComponent(pre?.getAttribute("data-raw") || "");
      const text = hydrateCmd(raw || pre?.innerText || "");
      copyText(text, "Comando copiado").then(() => {
        copyBtn.classList.add("ok");
        copyBtn.textContent = "copiado";
        setTimeout(() => {
          copyBtn.classList.remove("ok");
          copyBtn.textContent = "copiar";
        }, 1200);
      });
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (els.drawer && !els.drawer.hasAttribute("hidden")) {
        closeParams();
        return;
      }
      if (isHelpOpen()) {
        closeHelp();
        return;
      }
    }
    if (isTyping(document.activeElement)) return;

    if (e.key === "Backspace") {
      e.preventDefault();
      back();
      return;
    }
    if (e.key === "?" || (e.shiftKey && e.key === "/")) {
      toggleHelp();
      return;
    }
    if (e.key === "p" || e.key === "P") {
      go("ports");
      return;
    }
    if (e.key === "o" || e.key === "O") {
      openParams();
      return;
    }
    if (e.key === "e" || e.key === "E") {
      copyText(buildExports(), "Exports → Kali");
      return;
    }
    const num = Number(e.key);
    if (num >= 1 && num <= 9) {
      const btn = document.querySelector(`[data-choice-index="${num - 1}"]`);
      if (btn) btn.click();
    }
  });

  document.addEventListener("pointerdown", (e) => {
    if (!isHelpOpen()) return;
    const t = e.target;
    if (t.closest("[data-help]") || t.closest("[data-help-toggle]")) return;
    closeHelp();
  });

  document.querySelector("[data-back]")?.addEventListener("click", back);
  document.querySelector("[data-reset]")?.addEventListener("click", reset);
  document.querySelector("[data-ports]")?.addEventListener("click", () => go("ports"));
  document.querySelectorAll("[data-copy-exports]").forEach((btn) => {
    btn.addEventListener("click", () => copyText(buildExports(), "Exports → Kali"));
  });
  document.querySelectorAll("[data-params-open]").forEach((btn) => {
    btn.addEventListener("click", openParams);
  });
  document.querySelectorAll("[data-params-close]").forEach((btn) => {
    btn.addEventListener("click", closeParams);
  });
  document.querySelector("[data-params-reset]")?.addEventListener("click", resetParams);
  els.backdrop?.addEventListener("click", closeParams);

  document.querySelector("[data-help-toggle]")?.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleHelp();
  });
  document.querySelector("[data-help-close]")?.addEventListener("click", (e) => {
    e.stopPropagation();
    closeHelp();
  });
  document.querySelector("[data-compact]")?.addEventListener("click", () => {
    document.body.classList.toggle("compact");
    localStorage.setItem(COMPACT_KEY, document.body.classList.contains("compact") ? "1" : "0");
  });

  // tips (?) nos parâmetros — clique pra fixar no mobile
  document.addEventListener("click", (e) => {
    const tip = e.target.closest(".tip");
    if (tip) {
      e.preventDefault();
      e.stopPropagation();
      const wasOpen = tip.classList.contains("is-open");
      document.querySelectorAll(".tip.is-open").forEach((t) => t.classList.remove("is-open"));
      if (!wasOpen) tip.classList.add("is-open");
      return;
    }
    document.querySelectorAll(".tip.is-open").forEach((t) => t.classList.remove("is-open"));
  });

  if (els.notes) {
    els.notes.value = localStorage.getItem(NOTES_KEY) || localStorage.getItem(LEGACY.notes) || "";
    els.notes.addEventListener("input", () => {
      localStorage.setItem(NOTES_KEY, els.notes.value);
    });
  }

  if (localStorage.getItem(COMPACT_KEY) === "1" || localStorage.getItem(LEGACY.compact) === "1") {
    document.body.classList.add("compact");
  }

  fillSessionInputs();

  const hash = location.hash.replace("#", "");
  if (hash && pb.nodes[hash]) {
    state.nodeId = hash;
    if (!state.trail.includes(hash)) state.trail.push(hash);
  }
  render();
})();
