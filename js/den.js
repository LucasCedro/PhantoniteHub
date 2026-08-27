/**
 * Phantonite den — terminal interativo (home).
 * Easter egg: `tamago run` abre o pet dock (overlay lateral, sem split).
 */
(() => {
  const logEl = document.querySelector("[data-term-log]");
  const form = document.querySelector("[data-term-form]");
  const input = document.querySelector("[data-term-input]");
  if (!form || !input || !logEl) return;

  const history = [];
  let histIdx = -1;

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
    line(
      `<span class="p">phantonite@garage</span>:<span class="w">~</span>$ <span class="term-cmd">${escapeHtml(cmd)}</span>`
    );
  }

  function escapeHtml(s) {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function bitmiteLine() {
    const pet = window.PhantonitePet;
    if (!pet) {
      plain("bitmite: firmware offline", "term-err");
      return;
    }
    const s = pet.peek?.() || pet.ensure();
    if (!s?.discovered) {
      plain("bitmite: no signal");
      return;
    }
    if (!s.guruUnlocked && s.stage !== "guru") {
      plain("bitmite: locked · chega em Guru pra abrir este canal");
      return;
    }
    const scarred = (s.careMistakes || 0) >= 3;
    plain("── bitmite uplink ──");
    plain(
      scarred
        ? `${s.name || "BITMITE"} · GURU CICATRIZADO · erros ${s.careMistakes}`
        : `${s.name || "BITMITE"} · GURU SERENO`
    );
    plain(
      scarred
        ? "\"sobrevivi às tuas falhas. o lab também.\""
        : "\"paciência é o melhor exploit. espera o timing.\""
    );
    plain("hint: quando a barra pedir, cuida. quando não pedir, lab.");
  }

  function help() {
    plain("comandos:");
    plain("  ./hub.sh     → entra no hub");
    plain("  cat README   → o que é isto");
    plain("  whoami");
    plain("  clear        → limpa o scrollback");
    plain("  help         → isto");
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
      plain("tamago: módulo não carregou", "term-err");
      return;
    }
    const sub = (args[0] || "run").toLowerCase();
    if (sub === "run" || sub === "open" || sub === "start") {
      pet.open();
      plain("tamago: online · dock aberto (save intacto)");
      return;
    }
    if (sub === "stop" || sub === "hide" || sub === "close" || sub === "min") {
      pet.close();
      plain("tamago: minimizado · chip no canto pra maximizar");
      return;
    }
    if (sub === "kill" || sub === "exit" || sub === "destroy") {
      const r = pet.kill?.() || { ok: false };
      plain(r.ok ? "tamago: killed · save wiped. `tamago run` pra nascer outro" : "tamago: kill falhou", r.ok ? "term-out" : "term-err");
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
      plain("tamago run   → abre / maximiza (não reseta)");
      plain("tamago stop  → minimiza (chip no canto)");
      plain("tamago kill  → mata processo + apaga save");
      plain("tamago status | name <nick>");
      return;
    }
    plain(`tamago: subcomando desconhecido '${sub}' — try: tamago help`, "term-err");
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

    if (head === "help" || head === "?") {
      help();
      return;
    }
    if (head === "clear" || head === "cls") {
      logEl.innerHTML = "";
      return;
    }
    if (head === "./hub.sh" || head === "hub" || head === "./hub") {
      plain("booting hub…");
      location.href = "guide.html";
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
    if (head === "cat" && args[0] === "README") {
      plain("guia pessoal. árvore de decisão.");
      plain("abre → escolhe porta → copia cmd → volta pro Kali.");
      return;
    }
    if (head === "whoami") {
      plain("phantonite ee");
      return;
    }
    plain(`command not found: ${head}`, "term-err");
    plain("digite help");
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const v = input.value;
    input.value = "";
    exec(v);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!history.length) return;
      histIdx = Math.max(0, histIdx - 1);
      input.value = history[histIdx] || "";
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      histIdx = Math.min(history.length, histIdx + 1);
      input.value = history[histIdx] || "";
    }
  });

  // clique na área do term foca o input
  document.querySelector("[data-term]")?.addEventListener("click", () => input.focus());
})();
