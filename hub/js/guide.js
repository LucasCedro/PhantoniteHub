(() => {
  const STORAGE_KEY = "phantonite-hub-v1";
  const SESSION_KEY = "phantonite-hub-session";
  const NOTES_KEY = "phantonite-hub-notes";
  const NOTES_OPEN_KEY = "phantonite-hub-notes-open";
  const KB_MODE_KEY = "phantonite-hub-kb-mode";
  const AI_LOG_KEY = "phantonite-hub-ai-log";
  const LEGACY = {
    state: "jornada-hunter-v1",
    session: "jornada-hunter-session",
    notes: "jornada-hunter-notes",
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
    llm_base_url: "http://127.0.0.1:11434",
    llm_model: "llama3.1:8b",
  };

  const pb = window.HUNTER_PLAYBOOK;
  if (!pb) {
    console.error("Playbook não carregou");
    return;
  }

  const state = loadState();
  const session = loadSession();
  let kbMode = loadKbMode();

  const els = {
    phase: document.querySelector("[data-phase]"),
    title: document.querySelector("[data-title]"),
    say: document.querySelector("[data-say]"),
    knowledge: document.querySelector("[data-knowledge]"),
    sqliAdvice: document.querySelector("[data-sqli-advice]"),
    blocks: document.querySelector("[data-blocks]"),
    choices: document.querySelector("[data-choices]"),
    crumb: document.querySelector("[data-crumb]"),
    mini: document.querySelector("[data-mini]"),
    toast: document.querySelector("[data-toast]"),
    notes: document.querySelector("[data-notes]"),
    notesDrawer: document.querySelector("[data-notes-drawer]"),
    notesBackdrop: document.querySelector(".notes-backdrop"),
    notesToggle: document.querySelector("[data-notes-toggle]"),
    help: document.querySelector("[data-help]"),
    drawer: document.querySelector("[data-params-drawer]"),
    backdrop: document.querySelector(".params-backdrop"),
    chip: document.querySelector("[data-chip-summary]"),
    pasteDrawer: document.querySelector("[data-paste-drawer]"),
    pasteBackdrop: document.querySelector(".paste-backdrop"),
    pasteInput: document.querySelector("[data-paste-input]"),
    pasteResult: document.querySelector("[data-paste-result]"),
    pasteToggle: document.querySelector("[data-paste-toggle]"),
  };

  /** Texto colado em memória (não persiste). */
  let pasteBuffer = "";
  let llmAbort = null;
  let lastPasteForAi = "";
  let sqliDbms = "any";
  let sqliCols = 0; // 0 = all
  let sqliFamily = "all";

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

  function loadKbMode() {
    try {
      const m = localStorage.getItem(KB_MODE_KEY);
      if (m === "study" || m === "field") return m;
    } catch (_) {}
    return "field";
  }

  function setKbMode(mode) {
    if (mode !== "study" && mode !== "field") return;
    kbMode = mode;
    try {
      localStorage.setItem(KB_MODE_KEY, mode);
    } catch (_) {}
    const node = pb.nodes[state.nodeId];
    renderKnowledge(node?.knowledgeIds);
  }

  function toggleKbMode() {
    setKbMode(kbMode === "field" ? "study" : "field");
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
    els.chip.classList.toggle("is-empty", !session.ip);
  }

  function sessionNeedsSetup() {
    return !(session.ip || "").trim();
  }

  /** Bloqueia copy se o cmd ainda depende de IP e o session não tem. */
  function cmdNeedsIp(raw) {
    if (!raw) return false;
    return /\$IP\b|IP_DO_ALVO|\$TARGET\b|\$DOMAIN\b|\$LHOST\b|TEU_IP_DE_ATAQUE|TEU_LHOST/.test(
      raw
    );
  }

  function promptSessionSetup(reason) {
    openParams();
    toast(reason || "Define IP / alvo / LHOST antes de copiar");
    const ipInput = document.querySelector('[data-field="ip"]');
    ipInput?.focus();
  }

  function buildExports() {
    const ip = session.ip || "IP_DO_ALVO";
    const target = effectiveTarget() || `http://${ip}`;
    const lhost = session.lhost || "TEU_IP_DE_ATAQUE";
    const domain = session.domain || "dominio.se.houver";
    return `# Phantonite — exports
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
    if (state.nodeId === "web-sqli") renderSqliAdvice();
    updateChip();
  }

  function fillSessionInputs() {
    document.querySelectorAll("[data-field]").forEach((input) => {
      const key = input.getAttribute("data-field");
      input.value = session[key] || DEFAULTS[key] || "";
      input.addEventListener("input", () => {
        session[key] = input.value.trim();
        saveSession();
        refreshHydratedCmds();
        if (key === "llm_base_url") updateLlmKeyVisibility();
      });
    });
    updateChip();
    updateLlmKeyVisibility();
  }

  function isHelpOpen() {
    return els.help && !els.help.hasAttribute("hidden");
  }

  function openHelp() {
    closeNotes();
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
    closeNotes();
    closePaste();
    els.drawer?.removeAttribute("hidden");
    els.backdrop?.removeAttribute("hidden");
    document.querySelector("[data-field='ip']")?.focus();
  }

  function closeParams() {
    els.drawer?.setAttribute("hidden", "");
    els.backdrop?.setAttribute("hidden", "");
  }

  function isNotesOpen() {
    return els.notesDrawer && !els.notesDrawer.hasAttribute("hidden");
  }

  function openNotes() {
    closeHelp();
    closeParams();
    closePaste();
    els.notesDrawer?.removeAttribute("hidden");
    els.notesBackdrop?.removeAttribute("hidden");
    els.notesToggle?.classList.add("is-on");
    document.body.classList.add("notes-open");
    localStorage.setItem(NOTES_OPEN_KEY, "1");
    // foco no fim do texto
    if (els.notes) {
      els.notes.focus();
      const len = els.notes.value.length;
      els.notes.setSelectionRange(len, len);
    }
  }

  function closeNotes() {
    els.notesDrawer?.setAttribute("hidden", "");
    els.notesBackdrop?.setAttribute("hidden", "");
    els.notesToggle?.classList.remove("is-on");
    document.body.classList.remove("notes-open");
    localStorage.setItem(NOTES_OPEN_KEY, "0");
  }

  function toggleNotes() {
    if (isNotesOpen()) closeNotes();
    else openNotes();
  }

  function isPasteOpen() {
    return els.pasteDrawer && !els.pasteDrawer.hasAttribute("hidden");
  }

  function openPaste() {
    closeHelp();
    closeParams();
    closeNotes();
    els.pasteDrawer?.removeAttribute("hidden");
    els.pasteBackdrop?.removeAttribute("hidden");
    els.pasteToggle?.classList.add("is-on");
    document.body.classList.add("paste-open");
    if (els.pasteInput) {
      els.pasteInput.value = pasteBuffer;
      els.pasteInput.focus();
    }
  }

  function closePaste() {
    if (els.pasteInput) pasteBuffer = els.pasteInput.value;
    els.pasteDrawer?.setAttribute("hidden", "");
    els.pasteBackdrop?.setAttribute("hidden", "");
    els.pasteToggle?.classList.remove("is-on");
    document.body.classList.remove("paste-open");
  }

  function togglePaste() {
    if (isPasteOpen()) closePaste();
    else openPaste();
  }

  /**
   * ADR-002: match paste vs error-map rules.
   * Testes: node scripts/test-error-map.js
   *   "Connection refused" → alive
   *   "HTTP/1.1 401 Unauthorized" → web-auth
   *   "KRB_AP_ERR_SKEW" → kerberos
   */
  function matchOutput(text, rules) {
    const raw = String(text || "");
    if (!raw.trim() || !Array.isArray(rules)) return [];
    const hits = [];
    for (const rule of rules) {
      const patterns = rule.patterns || [];
      const matched = patterns.some((p) => {
        if (p && typeof p.test === "function") return p.test(raw);
        if (typeof p === "string") return raw.toLowerCase().includes(p.toLowerCase());
        return false;
      });
      if (!matched) continue;
      hits.push({
        id: rule.id,
        to: rule.to ?? null,
        hint: rule.hint || "",
        priority: Number(rule.priority) || 0,
      });
    }
    hits.sort((a, b) => b.priority - a.priority || String(a.id).localeCompare(String(b.id)));
    const seenTo = new Set();
    const deduped = [];
    for (const h of hits) {
      const key = h.to == null ? `hint:${h.id}` : `to:${h.to}`;
      if (seenTo.has(key)) continue;
      seenTo.add(key);
      deduped.push(h);
      if (deduped.length >= 3) break;
    }
    return deduped;
  }

  function nodeLabel(id) {
    if (!id) return "(só dica)";
    const n = pb.nodes[id];
    return n ? `${n.title || id} · ${id}` : `${id} (nó ausente)`;
  }

  function renderPasteHits(hits) {
    if (!els.pasteResult) return;
    if (!hits.length) {
      els.pasteResult.innerHTML = `<div class="paste-miss">
        <p class="paste-result-empty">Nenhum padrão automático encontrado.</p>
        <button type="button" class="paste-act paste-act-primary" data-paste-ai>[ Analisar com IA ]</button>
        <p class="paste-miss-hint">Enum / output sem erro clássico → Ollama (Params). Regex fica pra refused/401/SMB…</p>
      </div>`;
      return;
    }
    els.pasteResult.innerHTML = `<ul class="paste-hits">${hits
      .map((h) => {
        const canGo = h.to && pb.nodes[h.to];
        const btn = canGo
          ? `<button type="button" class="paste-hit-go" data-paste-goto="${esc(h.to)}">Ir →</button>`
          : `<span class="paste-hit-nogoto">sem goto</span>`;
        return `<li class="paste-hit">
          <div class="paste-hit-main">
            <strong class="paste-hit-node">${esc(nodeLabel(h.to))}</strong>
            <span class="paste-hit-meta">${esc(h.id)} · p${h.priority}</span>
            <p class="paste-hit-hint">${esc(h.hint)}</p>
          </div>
          ${btn}
        </li>`;
      })
      .join("")}</ul>`;
  }

  function renderPasteAiResult(data) {
    if (!els.pasteResult) return;
    const conf = data.confidence || "medium";
    const hyp = data.hypothesis || "";
    let list = Array.isArray(data.suggestions) ? data.suggestions.slice() : [];

    if (!list.length && conf === "low") {
      els.pasteResult.innerHTML = `<div class="paste-ai">
        <p class="paste-ai-head">Sugestão da IA (confirma antes de ir) · ${esc(conf)}</p>
        <p class="paste-ai-hyp">${esc(hyp || "Pouco sinal.")}</p>
        <p class="paste-result-empty">Sem nó sugerido — fica no path ou abre o mapa de portas (P).</p>
        <button type="button" class="paste-hit-go" data-paste-goto="ports">Ir → mapa de portas</button>
      </div>`;
      return;
    }

    if (!list.length) {
      list = [
        {
          nodeId: "ports",
          reason:
            "Nó sugerido pela IA não existe na árvore — usa o mapa de portas para continuar manualmente.",
          params: {},
          fallback: true,
        },
      ];
    }

    els.pasteResult.innerHTML = `<div class="paste-ai">
      <p class="paste-ai-head">Sugestão da IA (confirma antes de ir) · ${esc(conf)}</p>
      <p class="paste-ai-hyp">${esc(hyp)}</p>
      <ul class="paste-hits">${list
        .map((s) => {
          const paramsJson = encodeURIComponent(JSON.stringify(s.params || {}));
          const warn = s.fallback ? " ⚠️" : "";
          const paramLine = Object.keys(s.params || {}).length
            ? `<p class="paste-hit-params">${esc(
                Object.entries(s.params)
                  .map(([k, v]) => `${k}=${v}`)
                  .join(" · ")
              )}</p>`
            : "";
          return `<li class="paste-hit">
            <div class="paste-hit-main">
              <strong class="paste-hit-node">${esc(nodeLabel(s.nodeId))}${warn}</strong>
              <span class="paste-hit-meta">${esc(s.nodeId)}</span>
              <p class="paste-hit-hint">${esc(s.reason || "")}</p>
              ${paramLine}
            </div>
            <button type="button" class="paste-hit-go" data-paste-goto="${esc(s.nodeId)}" data-paste-params="${paramsJson}">Ir →</button>
          </li>`;
        })
        .join("")}</ul>
    </div>`;
  }

  function analyzePaste() {
    if (llmAbort) {
      llmAbort.abort();
      llmAbort = null;
    }
    const text = (els.pasteInput?.value || "").trim();
    pasteBuffer = els.pasteInput?.value || "";
    lastPasteForAi = pasteBuffer;
    if (!els.pasteResult) return;
    if (!text) {
      els.pasteResult.innerHTML =
        `<p class="paste-result-empty">Nada colado — cola stderr/stdout e analisa de novo.</p>`;
      return;
    }
    const pack = window.HUNTER_LLM;
    if (pack && text.length > pack.meta.maxPasteChars) {
      toast(`Texto longo — só os primeiros ${pack.meta.maxPasteChars} chars`);
    }
    const rules = window.HUNTER_ERROR_MAP?.rules;
    if (!rules?.length) {
      els.pasteResult.innerHTML =
        `<p class="paste-result-empty">error-map não carregou — confere <code>data/error-map.js</code>.</p>`;
      return;
    }
    renderPasteHits(matchOutput(text, rules));
  }

  function nodeAllowlist() {
    return Object.keys(pb.nodes);
  }

  function currentParamsSnapshot() {
    const keys = ["ip", "target", "domain", "lhost", "lport", "rport"];
    const out = {};
    for (const k of keys) {
      if ((session[k] || "").trim()) out[k] = session[k].trim();
    }
    return out;
  }

  function isLocalLlmUrl(url) {
    try {
      const u = new URL(url || "");
      return u.hostname === "127.0.0.1" || u.hostname === "localhost";
    } catch (_) {
      return true;
    }
  }

  /** Ollama: host sem /v1 · Groq/OpenAI: host ou .../openai ou .../v1 */
  function resolveLlmChatUrl(baseUrl) {
    let base = String(baseUrl || "").trim().replace(/\/$/, "");
    if (!base) base = DEFAULTS.llm_base_url;
    if (/\/chat\/completions$/i.test(base)) return base;
    if (/\/v1$/i.test(base)) return `${base}/chat/completions`;
    return `${base}/v1/chat/completions`;
  }

  function updateLlmKeyVisibility() {
    const wrap = document.querySelector("[data-llm-key-wrap]");
    if (!wrap) return;
    const url = val("llm_base_url") || DEFAULTS.llm_base_url;
    // Ollama :11434 → key oculta; proxy :8787 ou cloud → mostra key
    const ollamaDirect = isLocalLlmUrl(url) && !/:8787\b/.test(url);
    if (ollamaDirect) wrap.setAttribute("hidden", "");
    else wrap.removeAttribute("hidden");
  }

  function applySuggestedParams(paramsObj) {
    const map = window.HUNTER_LLM?.PARAM_TO_SESSION || {};
    let changed = false;
    for (const [k, v] of Object.entries(paramsObj || {})) {
      const field = map[k] || (DEFAULTS[k] !== undefined || session[k] !== undefined ? k : null);
      if (!field || v == null || v === "") continue;
      let value = String(v).trim();
      if (field === "target" && value && !/^https?:\/\//i.test(value)) {
        value = `http://${value}`;
      }
      session[field] = value;
      const input = document.querySelector(`[data-field="${field}"]`);
      if (input) input.value = value;
      changed = true;
    }
    if (changed) {
      saveSession();
      refreshHydratedCmds();
    }
  }

  function logAiMiss(raw, data) {
    try {
      const entry = {
        timestamp: Date.now(),
        raw_truncated_100chars: String(raw || "").slice(0, 100),
        hypothesis: data?.hypothesis || "",
        suggestions_nodeIds: (data?.suggestions || []).map((s) => s.nodeId),
      };
      const prev = JSON.parse(localStorage.getItem(AI_LOG_KEY) || "[]");
      prev.unshift(entry);
      localStorage.setItem(AI_LOG_KEY, JSON.stringify(prev.slice(0, 40)));
    } catch (_) {}
  }

  async function callLlmAnalyze() {
    const llm = window.HUNTER_LLM;
    if (!llm) {
      els.pasteResult.innerHTML =
        `<p class="paste-result-empty">llm-prompt.js não carregou.</p>`;
      return;
    }
    const raw = lastPasteForAi || pasteBuffer || els.pasteInput?.value || "";
    if (!raw.trim()) return;

    const allow = nodeAllowlist();
    const allowSet = new Set(allow);
    const { content, truncated } = llm.buildUserPayload(
      raw,
      allow,
      state.nodeId,
      currentParamsSnapshot()
    );
    if (truncated) toast(`Truncado a ${llm.meta.maxPasteChars} chars`);

    const base = (val("llm_base_url") || DEFAULTS.llm_base_url).replace(/\/$/, "");
    const model = val("llm_model") || DEFAULTS.llm_model;
    const key = (session.llm_api_key || "").trim();
    const chatUrl = resolveLlmChatUrl(base);

    els.pasteResult.innerHTML = `<div class="paste-ai-loading">
      <p>A interpretar com IA…</p>
      <button type="button" class="paste-act" data-paste-ai-cancel>[ Cancelar ]</button>
    </div>`;

    if (llmAbort) llmAbort.abort();
    llmAbort = new AbortController();
    let timedOut = false;
    const t = setTimeout(() => {
      timedOut = true;
      llmAbort.abort();
    }, llm.meta.timeoutMs);

    try {
      const headers = { "Content-Type": "application/json" };
      if (key) headers.Authorization = `Bearer ${key.replace(/^Bearer\s+/i, "")}`;
      const res = await fetch(chatUrl, {
        method: "POST",
        headers,
        signal: llmAbort.signal,
        body: JSON.stringify({
          model,
          temperature: 0.2,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: llm.SYSTEM_PROMPT },
            { role: "user", content },
          ],
        }),
      });
      clearTimeout(t);
      const rawBody = await res.text();
      if (!res.ok) {
        let detail = rawBody.slice(0, 280);
        try {
          const j = JSON.parse(rawBody);
          detail = j.error?.message || j.error || detail;
        } catch (_) {}
        let msg;
        if (res.status === 401 || res.status === 403) {
          msg = `API key rejeitada (${res.status}). Confere a key Groq nos Params (gsk_…).`;
        } else if (res.status === 404) {
          msg = `Endpoint 404. Base URL deve ser http://127.0.0.1:8787 (sem /v1 no fim). Detalhe: ${detail}`;
        } else {
          msg = `LLM respondeu HTTP ${res.status}: ${detail}`;
        }
        els.pasteResult.innerHTML = `<p class="paste-result-empty">${esc(String(msg))}</p>
          <button type="button" class="paste-act paste-act-primary" data-paste-ai>[ Analisar com IA ]</button>`;
        return;
      }
      let body;
      try {
        body = JSON.parse(rawBody);
      } catch (_) {
        els.pasteResult.innerHTML =
          `<p class="paste-result-empty">Resposta não-JSON do proxy/LLM. Tenta de novo.</p>
           <button type="button" class="paste-act paste-act-primary" data-paste-ai>[ Analisar com IA ]</button>`;
        return;
      }
      const text =
        body?.choices?.[0]?.message?.content ||
        body?.message?.content ||
        "";
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch (_) {
        const m = String(text).match(/\{[\s\S]*\}/);
        parsed = m ? JSON.parse(m[0]) : null;
      }
      const sanitized = llm.sanitizeResponse(parsed, allowSet);
      if (!sanitized.ok) {
        els.pasteResult.innerHTML =
          `<p class="paste-result-empty">A resposta do modelo não pôde ser interpretada. Tenta novamente.</p>
           <button type="button" class="paste-act paste-act-primary" data-paste-ai>[ Analisar com IA ]</button>`;
        return;
      }
      let data = sanitized.data;
      if (!data.suggestions.length && data.confidence !== "low") {
        data = {
          ...data,
          suggestions: [
            {
              nodeId: "ports",
              reason:
                "Nó sugerido pela IA não existe na árvore — usa o mapa de portas para continuar manualmente.",
              params: {},
              fallback: true,
            },
          ],
        };
      }
      logAiMiss(raw, data);
      renderPasteAiResult(data);
    } catch (err) {
      clearTimeout(t);
      if (timedOut || err?.name === "AbortError") {
        if (timedOut) {
          els.pasteResult.innerHTML =
            `<p class="paste-result-empty">O modelo demorou demasiado a responder. Tenta novamente ou reduz o texto colado.</p>
             <button type="button" class="paste-act paste-act-primary" data-paste-ai>[ Analisar com IA ]</button>`;
        } else {
          renderPasteHits([]);
        }
        return;
      }
      const why = String(err?.message || err || "");
      const local = isLocalLlmUrl(base);
      let msg;
      if (local && /8787/.test(base)) {
        msg = `Não deu para falar com o proxy em ${base}. Confirma que o PowerShell ainda tem "node scripts\\llm-proxy.js" a correr. Detalhe: ${why}`;
      } else if (local) {
        msg =
          "Não foi possível ligar ao modelo local. Verifica se o Ollama está a correr (127.0.0.1:11434).";
      } else {
        msg =
          "Falha de rede ao LLM. Para Groq usa proxy: node scripts/llm-proxy.js → base URL http://127.0.0.1:8787";
      }
      els.pasteResult.innerHTML = `<p class="paste-result-empty">${esc(msg)}</p>
        <button type="button" class="paste-act paste-act-primary" data-paste-ai>[ Analisar com IA ]</button>`;
    } finally {
      llmAbort = null;
    }
  }

  function confirmPasteGoto(nodeId, paramsEncoded) {
    if (!nodeId || !pb.nodes[nodeId]) {
      toast("Nó inválido");
      return;
    }
    if (paramsEncoded) {
      try {
        applySuggestedParams(JSON.parse(decodeURIComponent(paramsEncoded)));
      } catch (_) {}
    }
    closePaste();
    go(nodeId);
    toast(`→ ${pb.nodes[nodeId].title || nodeId}`);
  }

  function clearPaste() {
    if (llmAbort) {
      llmAbort.abort();
      llmAbort = null;
    }
    pasteBuffer = "";
    lastPasteForAi = "";
    if (els.pasteInput) els.pasteInput.value = "";
    if (els.pasteResult) {
      els.pasteResult.innerHTML =
        `<p class="paste-result-empty">Cola output → Analisar. Erro clássico = salto direto. Enum → miss → Analisar com IA.</p>`;
    }
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

  const PORT_GROUP_LABEL = {
    web: "Web / app",
    windows: "Windows / AD",
    classic: "Serviços clássicos",
    data: "Data stores",
    cloud: "Cloud / mobile",
    close: "Shell / closeout",
  };

  let portsFilter = "";

  function portsHaystack(c) {
    return [
      c.label,
      c.hint,
      c.blurb,
      c.action,
      c.to,
      c.group,
      ...(c.ports || []),
      ...(c.tags || []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  }

  function filterPortChoices(choices, q) {
    const query = (q || "").trim().toLowerCase();
    if (!query) return choices.slice();
    return choices.filter((c) => portsHaystack(c).includes(query));
  }

  function renderPortCard(c, index) {
    const ports = (c.ports || []).length
      ? `<div class="port-card-ports">${c.ports
          .map((p) => `<span class="port-pill">${esc(p)}</span>`)
          .join("")}</div>`
      : `<div class="port-card-ports"><span class="port-pill port-pill-mute">sem porta fixa</span></div>`;
    return `<button type="button" class="port-card" data-to="${esc(c.to)}" data-choice-index="${index}">
      <header class="port-card-head">
        <strong>${esc(c.label)}</strong>
        <span class="port-card-to">${esc(c.to)}</span>
      </header>
      ${ports}
      ${c.blurb ? `<p class="port-card-blurb">${esc(c.blurb)}</p>` : ""}
      ${c.action ? `<p class="port-card-action"><span>Ação</span>${esc(c.action)}</p>` : ""}
      <span class="port-card-go">abrir ramo →</span>
    </button>`;
  }

  function renderPortsMap(choices = []) {
    const filtered = filterPortChoices(choices, portsFilter);
    const byGroup = {};
    for (const c of filtered) {
      const g = c.group || "other";
      if (!byGroup[g]) byGroup[g] = [];
      byGroup[g].push(c);
    }
    const order = ["web", "windows", "classic", "data", "cloud", "close", "other"];
    let idx = 0;
    const sections = order
      .filter((g) => byGroup[g]?.length)
      .map((g) => {
        const cards = byGroup[g]
          .map((c) => {
            const html = renderPortCard(c, idx);
            idx += 1;
            return html;
          })
          .join("");
        return `<section class="port-group">
          <h3 class="port-group-title">${esc(PORT_GROUP_LABEL[g] || g)}</h3>
          <div class="port-grid">${cards}</div>
        </section>`;
      })
      .join("");

    const empty = filtered.length
      ? ""
      : `<p class="port-map-empty">Nada pra “${esc(portsFilter)}”. Tenta 445, tomcat, jwt, 8080…</p>`;

    return `<div class="port-map" data-port-map>
      <div class="port-search-wrap">
        <label class="port-search-label" for="port-search">Buscar porta ou serviço</label>
        <input
          id="port-search"
          class="port-search"
          type="search"
          data-port-search
          placeholder="ex: 445 · tomcat · 1234 · jwt · mysql"
          value="${esc(portsFilter)}"
          autocomplete="off"
          spellcheck="false"
        />
        <span class="port-search-meta">${filtered.length}/${choices.length} ramos</span>
      </div>
      ${empty}${sections}
    </div>`;
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

  function esc(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function getKnowledge(id) {
    return window.HUNTER_KNOWLEDGE?.entries?.[id] || null;
  }

  function relatedPills(entry) {
    return (entry.related || [])
      .slice(0, 4)
      .map((r) => {
        const t = getKnowledge(r.id)?.title || r.id;
        return `<span class="knowledge-pill">${esc(t)}</span>`;
      })
      .join("");
  }

  function renderKnowledgeField(entry) {
    const hyps = (entry.field?.hypotheses || []).slice(0, 4);
    const tests = (entry.field?.tests || []).slice(0, 4);
    const related = relatedPills(entry);
    return `<article class="knowledge-card knowledge-card-field">
      <header class="knowledge-card-head">
        <span class="knowledge-kicker">Knowledge · Field</span>
        <strong>${esc(entry.title)}</strong>
        <span class="knowledge-meta">${esc(entry.kind)} · ${esc(entry.freshness)}</span>
      </header>
      <p class="knowledge-observe"><strong>Observe:</strong> ${esc(entry.field?.observe || "")}</p>
      ${
        hyps.length
          ? `<div class="knowledge-section"><span>Hipóteses</span><ul>${hyps
              .map((h) => `<li>${esc(h)}</li>`)
              .join("")}</ul></div>`
          : ""
      }
      ${
        tests.length
          ? `<div class="knowledge-section"><span>Testes</span><ul>${tests
              .map((t) => `<li>${esc(t)}</li>`)
              .join("")}</ul></div>`
          : ""
      }
      ${entry.field?.validate ? `<p class="knowledge-observe"><strong>Validar:</strong> ${esc(entry.field.validate)}</p>` : ""}
      ${entry.field?.evidence ? `<p class="knowledge-observe"><strong>Evidência:</strong> ${esc(entry.field.evidence)}</p>` : ""}
      ${
        (entry.field?.tools || []).length
          ? `<p class="knowledge-meta">Tools: ${esc(entry.field.tools.join(", "))}</p>`
          : ""
      }
      ${related ? `<div class="knowledge-related">${related}</div>` : ""}
    </article>`;
  }

  function renderKnowledgeStudy(entry) {
    const related = relatedPills(entry);
    const refs = (entry.study?.references || [])
      .slice(0, 3)
      .map((u) => `<li><a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(u)}</a></li>`)
      .join("");
    return `<article class="knowledge-card knowledge-card-study">
      <header class="knowledge-card-head">
        <span class="knowledge-kicker">Knowledge · Study</span>
        <strong>${esc(entry.title)}</strong>
        <span class="knowledge-meta">${esc(entry.kind)} · ${esc(entry.freshness)}</span>
      </header>
      <p class="knowledge-observe">${esc(entry.study?.summary || "")}</p>
      ${
        entry.study?.whenToLook
          ? `<div class="knowledge-section"><span>Quando procurar</span><p class="knowledge-body">${esc(entry.study.whenToLook)}</p></div>`
          : ""
      }
      ${
        entry.study?.howItWorks
          ? `<div class="knowledge-section"><span>Como funciona</span><p class="knowledge-body">${esc(entry.study.howItWorks)}</p></div>`
          : ""
      }
      ${
        entry.study?.limitations
          ? `<div class="knowledge-section"><span>Limitações</span><p class="knowledge-body">${esc(entry.study.limitations)}</p></div>`
          : ""
      }
      ${related ? `<div class="knowledge-related">${related}</div>` : ""}
      ${
        refs
          ? `<div class="knowledge-section"><span>Refs</span><ul class="knowledge-refs">${refs}</ul></div>`
          : ""
      }
    </article>`;
  }

  function renderKnowledge(ids) {
    if (!els.knowledge) return;
    if (!ids || !ids.length) {
      els.knowledge.innerHTML = "";
      return;
    }
    const toolbar = `<div class="knowledge-toolbar" role="group" aria-label="Modo Knowledge">
      <span class="knowledge-toolbar-label">Modo</span>
      <button type="button" class="knowledge-mode-btn${kbMode === "field" ? " is-active" : ""}" data-kb-mode="field" title="Engajamento / Field (K)">Field</button>
      <button type="button" class="knowledge-mode-btn${kbMode === "study" ? " is-active" : ""}" data-kb-mode="study" title="Estudo / Study (K)">Study</button>
    </div>`;
    const cards = ids
      .map((id) => {
        const entry = getKnowledge(id);
        if (!entry) {
          return `<div class="knowledge-card knowledge-card-miss"><strong>KB</strong> entry <code>${esc(id)}</code> não carregou</div>`;
        }
        return kbMode === "study" ? renderKnowledgeStudy(entry) : renderKnowledgeField(entry);
      })
      .join("");
    els.knowledge.innerHTML = toolbar + cards;
  }

  function sqliParam() {
    return (val("sqlmap_param") || DEFAULTS.sqlmap_param || "id").trim() || "id";
  }

  /** PortSwigger-style: spaces as + in query values */
  function sqliRepeaterForm(plain) {
    return encodeURIComponent(plain).replace(/%20/g, "+");
  }

  function fillSqliPlaceholders(text) {
    const param = sqliParam();
    let out = String(text).replaceAll("{{PARAM}}", param);
    out = hydrateCmd(out);
    return out;
  }

  function renderSqliAdvice() {
    const box = els.sqliAdvice;
    if (!box) return;
    const pack = window.HUNTER_SQLI_PAYLOADS;
    if (state.nodeId !== "web-sqli" || !pack?.stages) {
      box.hidden = true;
      box.innerHTML = "";
      return;
    }
    box.hidden = false;
    const param = sqliParam();
    const families = pack.families || [{ id: "all", label: "todas" }];
    const familyBtns = families
      .map(
        (f) =>
          `<button type="button" class="sqli-filter${sqliFamily === f.id ? " is-active" : ""}" data-sqli-family="${f.id}">${esc(f.label)}</button>`
      )
      .join("");
    const dbmsBtns = ["any", "mysql", "oracle", "mssql", "postgres"]
      .map(
        (d) =>
          `<button type="button" class="sqli-filter${sqliDbms === d ? " is-active" : ""}" data-sqli-dbms="${d}">${d}</button>`
      )
      .join("");
    const colOpts = [0, 1, 2, 3, 4, 5, 6, 7, 8]
      .map((n) => {
        const label = n === 0 ? "todas" : String(n);
        return `<option value="${n}"${sqliCols === n ? " selected" : ""}>${label}</option>`;
      })
      .join("");

    const visibleStages = pack.stages.filter((stage) => {
      if (sqliFamily !== "all" && stage.group && stage.group !== sqliFamily) return false;
      return true;
    });

    let openOnce = true;
    const stagesHtml = visibleStages
      .map((stage) => {
        let payloads = (stage.payloads || []).filter((p) => {
          if (sqliDbms !== "any" && p.dbms && p.dbms !== "any" && p.dbms !== sqliDbms) return false;
          if (sqliCols > 0 && p.cols != null && p.cols !== sqliCols) return false;
          if (sqliCols > 0 && stage.id === "count") {
            const m = /ORDER BY (\d+)/.exec(p.label) || /UNION (\d+)/.exec(p.label);
            if (m && Number(m[1]) !== sqliCols) return false;
          }
          return true;
        });
        if (!payloads.length) return "";
        const routeHtml =
          Array.isArray(stage.route) && stage.route.length
            ? `<ol class="sqli-route">${stage.route.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>`
            : "";
        const labHtml = stage.lab
          ? `<p class="sqli-lab"><span class="sqli-lab-k">lab</span> ${esc(stage.lab)}</p>`
          : "";
        const rows = payloads
          .map((p) => {
            const plain = fillSqliPlaceholders(p.value);
            const isShell = p.kind === "shell";
            const rep = isShell ? "" : sqliRepeaterForm(plain);
            const plainEnc = encodeURIComponent(plain);
            const repEnc = encodeURIComponent(rep);
            return `<div class="sqli-row">
              <div class="sqli-row-meta">
                <strong>${esc(p.label)}</strong>
                ${p.note ? `<span class="sqli-note">${esc(p.note)}</span>` : ""}
                ${p.dbms && p.dbms !== "any" ? `<span class="sqli-dbms-tag">${esc(p.dbms)}</span>` : ""}
              </div>
              <div class="sqli-chips">
                <button type="button" class="sqli-chip" data-copy-text="${plainEnc}" title="Copiar">
                  <span class="sqli-chip-k">${isShell ? "shell" : "plain"}</span>
                  <code>${esc(plain)}</code>
                </button>
                ${
                  rep
                    ? `<button type="button" class="sqli-chip sqli-chip-rep" data-copy-text="${repEnc}" title="URL-encoded (+ = espaço)">
                  <span class="sqli-chip-k">repeater</span>
                  <code>${esc(rep)}</code>
                </button>`
                    : ""
                }
              </div>
            </div>`;
          })
          .join("");
        const shouldOpen = sqliFamily !== "all" || openOnce;
        if (shouldOpen) openOnce = false;
        return `<details class="sqli-stage"${shouldOpen ? " open" : ""}>
          <summary>${esc(stage.title)}</summary>
          ${labHtml}
          ${routeHtml}
          <p class="sqli-hint">${esc(stage.hint || "")}</p>
          ${rows}
        </details>`;
      })
      .join("");

    box.innerHTML = `
      <section class="sqli-advice" aria-label="SQLi Advice">
        <header class="sqli-advice-head">
          <div>
            <span class="sqli-kicker">SQLi Advice · v${esc(String(pack.version || 3))}</span>
            <strong>Roteiros por técnica</strong>
            <p class="sqli-sub">Param: <code>${esc(param)}</code> · <code>BURP_COLLAB</code> = Collaborator. Aspas: ' vs " ao contexto.</p>
          </div>
          <div class="sqli-controls">
            <div class="sqli-filters" role="group" aria-label="Família">${familyBtns}</div>
            <div class="sqli-filters" role="group" aria-label="DBMS">${dbmsBtns}</div>
            <label class="sqli-cols">Cols
              <select data-sqli-cols>${colOpts}</select>
            </label>
          </div>
        </header>
        ${stagesHtml || `<p class="sqli-hint">Nenhum payload neste filtro.</p>`}
      </section>`;
  }

  function render() {
    const node = pb.nodes[state.nodeId];
    if (!node) return;
    els.phase.textContent = node.phase || "HUB";
    els.title.textContent = node.title;
    els.say.textContent = node.say || "";
    els.say.className =
      "say" + (node.tone === "warn" ? " warn" : node.tone === "danger" ? " danger" : "");
    renderKnowledge(node.knowledgeIds);
    renderSqliAdvice();
    els.blocks.innerHTML = renderBlocks(node.blocks);
    if (state.nodeId === "ports") {
      els.choices.innerHTML = renderPortsMap(node.choices);
      const search = els.choices.querySelector("[data-port-search]");
      if (search) {
        search.addEventListener("input", () => {
          portsFilter = search.value;
          const pos = search.selectionStart;
          els.choices.innerHTML = renderPortsMap(pb.nodes.ports.choices);
          const again = els.choices.querySelector("[data-port-search]");
          if (again) {
            again.focus();
            const p = Math.min(pos ?? again.value.length, again.value.length);
            again.setSelectionRange(p, p);
          }
        });
      }
    } else {
      portsFilter = "";
      els.choices.innerHTML = renderChoices(node.choices);
    }
    renderCrumb();
    if (els.mini) els.mini.innerHTML = renderMini();
    updateChip();
  }

  function isTyping(el) {
    if (!el) return false;
    const tag = el.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable;
  }

  document.addEventListener("change", (e) => {
    if (e.target.matches && e.target.matches("[data-sqli-cols]")) {
      sqliCols = Number(e.target.value) || 0;
      renderSqliAdvice();
    }
  });

  document.addEventListener("click", (e) => {
    const pasteGo = e.target.closest("[data-paste-goto]");
    if (pasteGo) {
      confirmPasteGoto(
        pasteGo.getAttribute("data-paste-goto"),
        pasteGo.getAttribute("data-paste-params")
      );
      return;
    }
    if (e.target.closest("[data-paste-ai-cancel]")) {
      if (llmAbort) llmAbort.abort();
      return;
    }
    if (e.target.closest("[data-paste-ai]")) {
      callLlmAnalyze();
      return;
    }
    const modeBtn = e.target.closest("[data-kb-mode]");
    if (modeBtn) {
      setKbMode(modeBtn.getAttribute("data-kb-mode"));
      return;
    }
    const sqliFamilyBtn = e.target.closest("[data-sqli-family]");
    if (sqliFamilyBtn) {
      sqliFamily = sqliFamilyBtn.getAttribute("data-sqli-family") || "all";
      renderSqliAdvice();
      return;
    }
    const sqliDbmsBtn = e.target.closest("[data-sqli-dbms]");
    if (sqliDbmsBtn) {
      sqliDbms = sqliDbmsBtn.getAttribute("data-sqli-dbms") || "any";
      renderSqliAdvice();
      return;
    }
    const copyTextBtn = e.target.closest("[data-copy-text]");
    if (copyTextBtn) {
      const text = decodeURIComponent(copyTextBtn.getAttribute("data-copy-text") || "");
      copyText(text, "Payload copiado").then(() => {
        copyTextBtn.classList.add("ok");
        setTimeout(() => copyTextBtn.classList.remove("ok"), 1000);
      });
      return;
    }
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
      if (cmdNeedsIp(raw) && sessionNeedsSetup()) {
        promptSessionSetup("Define o IP do alvo antes de copiar");
        return;
      }
      if (cmdNeedsIp(raw) && /\$LHOST|TEU_IP_DE_ATAQUE|TEU_LHOST/.test(raw) && !(session.lhost || "").trim()) {
        promptSessionSetup("Define o LHOST antes de copiar");
        return;
      }
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
      if (isPasteOpen()) {
        closePaste();
        return;
      }
      if (isNotesOpen()) {
        closeNotes();
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
    if (e.key === "n" || e.key === "N") {
      e.preventDefault();
      toggleNotes();
      return;
    }
    if (e.key === "l" || e.key === "L") {
      e.preventDefault();
      togglePaste();
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
    if (e.key === "k" || e.key === "K") {
      const node = pb.nodes[state.nodeId];
      if (node?.knowledgeIds?.length) {
        e.preventDefault();
        toggleKbMode();
      }
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

  document.querySelectorAll("[data-notes-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => toggleNotes());
  });
  document.querySelectorAll("[data-notes-close]").forEach((btn) => {
    btn.addEventListener("click", closeNotes);
  });
  els.notesBackdrop?.addEventListener("click", closeNotes);

  document.querySelectorAll("[data-paste-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => togglePaste());
  });
  document.querySelectorAll("[data-paste-close]").forEach((btn) => {
    btn.addEventListener("click", closePaste);
  });
  els.pasteBackdrop?.addEventListener("click", closePaste);
  document.querySelector("[data-paste-analyze]")?.addEventListener("click", analyzePaste);
  document.querySelector("[data-paste-clear]")?.addEventListener("click", clearPaste);
  els.pasteInput?.addEventListener("input", () => {
    pasteBuffer = els.pasteInput.value;
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

  fillSessionInputs();

  const hash = location.hash.replace("#", "");
  if (hash && pb.nodes[hash]) {
    state.nodeId = hash;
    if (!state.trail.includes(hash)) state.trail.push(hash);
  }
  render();

  // restaura notas abertas da sessão anterior (texto sempre persiste)
  if (localStorage.getItem(NOTES_OPEN_KEY) === "1") openNotes();

  // first-run soft: sem IP → abre params (não bloqueia a árvore)
  if (sessionNeedsSetup()) {
    setTimeout(() => {
      if (sessionNeedsSetup()) promptSessionSetup("First-run · seta IP / alvo / LHOST");
    }, 400);
  }

  // ──────────────────────────────────────────────
  // eJPT MODULE — mundo separado, zero acoplamento
  // ──────────────────────────────────────────────
  (function initEJPT() {
    if (typeof EJPT_SECTIONS === 'undefined') return;

    const MODE_KEY = 'ejpt_active_mode'; // 'hub' | 'ejpt'
    const stageHub  = document.querySelector('[data-stage="hub"]');
    const stageEjpt = document.querySelector('[data-stage="ejpt"]');
    const modeBtns  = document.querySelectorAll('[data-mode]');

    if (!stageHub || !stageEjpt) return;

    let progress = ejptLoadProgress();

    // ── render XP bar ──
    function renderXP() {
      const xp     = ejptGetXP(progress);
      const pct    = Math.round((xp / EJPT_XP_TOTAL) * 100);
      const fill   = stageEjpt.querySelector('[data-ejpt-xpfill]');
      const label  = stageEjpt.querySelector('[data-ejpt-xplabel]');
      if (fill)  fill.style.width  = pct + '%';
      if (label) label.textContent = `${xp} / ${EJPT_XP_TOTAL} XP (${pct}%)`;
    }

    // ── render plano semanal ──
    function renderPlan() {
      const grid = stageEjpt.querySelector('[data-ejpt-plan]');
      if (!grid) return;
      grid.innerHTML = '';
      EJPT_STUDY_PLAN.forEach(w => {
        const done = w.topicIds.length > 0 && w.topicIds.every(id => progress[id]);
        const isExam = w.week === 6;
        const card = document.createElement('div');
        card.className = 'ejpt-plan-card' + (done ? ' done-week' : '') + (isExam ? ' exam-week' : '');

        const thmHtml = w.thm && w.thm.length
          ? `<div class="ejpt-plan-thm">THM: ${w.thm.join(' · ')}</div>` : '';

        const resHtml = w.resources && w.resources.length
          ? `<div class="ejpt-plan-links">${w.resources.map(r =>
              `<a href="${r.url}" target="_blank" rel="noopener" class="ejpt-res-link"
                title="${r.title} (${r.duration})">▶ ${r.title.substring(0,35)}…</a>`
            ).join('')}</div>` : '';

        card.innerHTML = `
          <div class="ejpt-plan-week">Semana ${w.week}${w.dailyHours ? ` · ${w.dailyHours}h/dia` : ''}</div>
          <div class="ejpt-plan-focus">${done ? '✅ ' : isExam ? '🎯 ' : ''}${w.focus}</div>
          <div class="ejpt-plan-goal">${w.goal}</div>
          ${thmHtml}
          ${resHtml}
        `;
        grid.appendChild(card);
      });
      // badge semana atual
      const weekBadge = stageEjpt.querySelector('[data-ejpt-week]');
      if (weekBadge) {
        const cur = EJPT_STUDY_PLAN.find(w => !w.topicIds.every(id => progress[id]));
        weekBadge.textContent = cur ? `Semana ${cur.week} · ${cur.focus}` : '🏆 Completo!';
      }
    }

    // ── render seções + tópicos ──
    function renderSections() {
      const wrap = stageEjpt.querySelector('[data-ejpt-sections]');
      if (!wrap) return;
      wrap.innerHTML = '';

      EJPT_SECTIONS.forEach(sec => {
        const secEl = document.createElement('section');
        secEl.className = 'ejpt-section';
        const doneCount = sec.topics.filter(t => progress[t.id]).length;
        secEl.innerHTML = `
          <h2 class="ejpt-section-title" style="color:${sec.color}">
            ${sec.icon} ${sec.title}
            <span class="ejpt-section-xp" style="background:${sec.color}20;border:1px solid ${sec.color};color:${sec.color}">
              ${doneCount}/${sec.topics.length} · ${sec.xpTotal} XP
            </span>
          </h2>
          <div class="ejpt-topics-grid"></div>
        `;
        const grid = secEl.querySelector('.ejpt-topics-grid');

        sec.topics.forEach(topic => {
          const done = !!progress[topic.id];
          const card = document.createElement('div');
          card.className = [
            'ejpt-topic-card',
            topic.weak ? 'weak-topic' : '',
            done ? 'done-topic' : '',
          ].filter(Boolean).join(' ');
          card.setAttribute('data-topic-id', topic.id);
          card.setAttribute('role', 'button');
          card.setAttribute('tabindex', '0');
          card.setAttribute('aria-pressed', done ? 'true' : 'false');
          card.title = done ? 'Clica para desmarcar' : 'Clica quando terminar';

          const resLinks = (topic.resources && topic.resources.length)
            ? `<div class="ejpt-topic-resources">${topic.resources.map(r =>
                `<a href="${r.url}" target="_blank" rel="noopener" class="ejpt-res-link"
                  title="${r.title}">▶ ${r.title.substring(0,40)}… <span class="ejpt-res-dur">${r.duration}</span></a>`
              ).join('')}</div>` : '';

          card.innerHTML = `
            <div class="ejpt-topic-head">
              <div>
                <div class="ejpt-topic-name">${topic.title}</div>
                ${topic.weak ? '<span class="ejpt-weak-badge">⚠️ FOCO</span>' : ''}
              </div>
              <div style="display:flex;flex-direction:column;align-items:flex-end;gap:0.3rem;flex-shrink:0">
                <div class="ejpt-topic-check">${done ? '✓' : ''}</div>
                <span class="ejpt-topic-xp">+${topic.xp} XP</span>
              </div>
            </div>
            <ul class="ejpt-topic-subs">
              ${topic.subtopics.map(s => `<li>${s}</li>`).join('')}
            </ul>
            ${resLinks}
          `;

          const toggle = () => {
            progress[topic.id] = !progress[topic.id];
            ejptSaveProgress(progress);
            renderAll();
            toast(`${topic.title} — ${progress[topic.id] ? '+' + topic.xp + ' XP ✓' : 'desmarcado'}`);
          };
          card.addEventListener('click', toggle);
          card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });

          grid.appendChild(card);
        });

        wrap.appendChild(secEl);
      });
    }

    // ── render cheatsheet ──
    function renderCheat() {
      const wrap = stageEjpt.querySelector('[data-ejpt-cheat]');
      if (!wrap || typeof EJPT_CHEATSHEET === 'undefined') return;
      wrap.innerHTML = '';

      const groups = [
        { key: 'metasploit',  label: '🔧 Metasploit — 10 essenciais' },
        { key: 'auxiliaries', label: '📡 Auxiliary Scanners' },
        { key: 'exploits',    label: '💥 Exploits + Post' },
        { key: 'pivoting',    label: '🌐 Pivoting (Meterpreter + SSH)' },
      ];

      const grid = document.createElement('div');
      grid.className = 'ejpt-cheat-grid';

      groups.forEach(g => {
        const block = document.createElement('div');
        block.className = 'ejpt-cheat-block';
        block.innerHTML = `<h3 class="ejpt-cheat-group">${g.label}</h3>`;
        EJPT_CHEATSHEET[g.key].forEach(item => {
          const row = document.createElement('div');
          row.className = 'ejpt-cheat-row';
          row.innerHTML = `
            <button class="ejpt-cheat-copy" title="Copiar comando" data-cmd="${item.cmd.replace(/"/g,'&quot;')}">⎘</button>
            <code class="ejpt-cheat-cmd">${item.cmd}</code>
            <span class="ejpt-cheat-desc">${item.desc}</span>
          `;
          row.querySelector('.ejpt-cheat-copy').addEventListener('click', () => {
            navigator.clipboard.writeText(item.cmd).then(() => toast('Copiado ✓'));
          });
          block.appendChild(row);
        });
        grid.appendChild(block);
      });

      // Tips
      const tipsBlock = document.createElement('div');
      tipsBlock.className = 'ejpt-cheat-block ejpt-tips-block';
      tipsBlock.innerHTML = `<h3 class="ejpt-cheat-group">💡 Dicas do Exame</h3>
        <ul class="ejpt-tips-list">${EJPT_CHEATSHEET.tips.map(t => `<li>${t}</li>`).join('')}</ul>`;
      grid.appendChild(tipsBlock);

      wrap.appendChild(grid);
    }

    function renderAll() {
      renderXP();
      renderPlan();
      renderSections();
      renderCheat();
    }

    // ── modo toggle ──
    function setMode(mode) {
      localStorage.setItem(MODE_KEY, mode);
      stageHub.hidden  = mode === 'ejpt';
      stageEjpt.hidden = mode === 'hub';
      modeBtns.forEach(btn => {
        btn.classList.toggle('mode-btn-active', btn.dataset.mode === mode);
      });
      if (mode === 'ejpt') renderAll();
    }

    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => setMode(btn.dataset.mode));
    });

    // restaura modo da sessão anterior
    const savedMode = localStorage.getItem(MODE_KEY) || 'hub';
    setMode(savedMode);
  })();
})();
