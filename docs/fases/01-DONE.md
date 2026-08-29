# Fase 1 — DONE

**Status:** FECHADA (implementável)  
**Handoff:** Fase **1.5** — sem começar aqui.

## O que existe agora

- ADR-001 + `data/knowledge/schema.md`
- Registry `data/knowledge/registry.js` (v0.3.0)
  - Pilotos: `ssrf`, `jwt-attacks`, `sqli`
  - Foundations stubs: `http`, `authentication`, `authorization`, `cryptography`, `databases`, `trust-boundaries`, `cloud-metadata`
- Wire path → KB: `web-ssrf` / `web-jwt` / `web-sqli` + card Field no `guide`
- RoE profissional no nó `roe` (lab opcional, não default CTF)

## Como testar (manual)

1. Abrir `guide.html` → nó start = RoE (checklist profissional).
2. Ir a **Web → SSRF** (`web-ssrf`): card Knowledge + cmds intactos.
3. Idem **JWT** (`web-jwt`) e **SQLi** (`web-sqli`).
4. Smoke: `node scripts/smoke-playbook.js` → 0 broken/orphans.

## O que **não** foi feito (Fase 1.5+)

- Study/Field toggle UX completo
- Freshness / QA em massa dos 62 nós
- Gate lab (validação de campo)
- Paste-jump (Fase 2), copiloto (3), evidence/reporting (4)
- Novos entries além dos pilotos/stubs

## Próximo

**Começar Fase 1.5:** [`01.5-content-qa-study-field.md`](01.5-content-qa-study-field.md)  
Não abrir Fase 2 até gate lab.
