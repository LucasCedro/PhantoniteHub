# Phantonite HUB

Personal pentest **decision-tree** field guide. Static frontend. Zero backend.

**Nullius in verba.**

Open `index.html` (garage / home) or `guide.html` (the hub). No install, no Docker, no server — just a browser next to your Kali terminal.

> In-app copy and the playbook are in **Portuguese**. This README is English so the repo is readable on GitHub.

---

## What it is

A click-through engagement guide: RoE → session params → recon → service branches → foothold → privesc / lateral → report.

- Live **command hydration** from session params (`$IP`, `$TARGET`, `$DOMAIN`, `$LHOST`, wordlists…)
- **Exports → Kali** one-liner block you paste into bash
- Notes, trail, keyboard shortcuts, Hackers-’95 garage UI

Built for learning / labs / authorized work — not a SaaS, not auto-hack.

---

## Quick start

```text
index.html     → den / home
guide.html     → interactive hub
ROADMAP.md     → project plan (PT) — follow in order
```

Clone and open locally:

```bash
git clone https://github.com/LucasCedro/PhantoniteHub.git
cd PhantoniteHub
# open index.html or guide.html in your browser
```

Smoke-check the playbook (Node):

```bash
node scripts/smoke-playbook.js
```

---

## Layout

```text
data/playbook.js         → core tree (start path)
data/playbook-extra.js   → v2.1: modern web, AD light, cloud, post-exploit…
js/guide.js              → engine (nav, hydrate, params, exports)
css/hunter.css           → garage / Hackers ’95 look
scripts/smoke-playbook.js
```

**Playbook (v2.1.0):** ~61 nodes · 0 broken links · 0 orphans  
Coverage includes passive recon, modern web (API/JWT/SQLi/LFI/…), CMS panels, classic + AD network paths, DBs, AWS/K8s light, APK static, Linux/Windows privesc, report/retest.

---

## Tooling referenced in the tree

gobuster · ffuf · nuclei · Burp · NetExec/nxc · Impacket · sqlmap · Metasploit · hydra · hashcat/john · linpeas/winpeas · subfinder · certipy · …

---

## Roadmap

See `ROADMAP.md` (Portuguese):

1. **Tree content** — done (v2.1)
2. **Paste terminal output → rule-based jump** — next
3. **Copilot** (Ollama/API + tools) — after that

---

## License / ethics

Personal project. Use only on systems you’re authorized to test. RoE first — always.

*Phantonite — Nullius in verba*
