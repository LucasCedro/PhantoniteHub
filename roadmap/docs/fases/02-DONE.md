# Fase 2 — DONE

**Status:** FECHADA (implementável)  
**Handoff:** Fase **3** — copiloto · [`03-copilot.md`](03-copilot.md)  
**ADR:** [`../ADR-002-paste-jump.md`](../ADR-002-paste-jump.md)

## O que existe agora

- Drawer **PASTE.LOG** (`L` / botão rail) — colar stdout/stderr
- `data/error-map.js` **v0.3.0** · 35 regras (RegExp → nó + hint)
- Mapa de portas: busca + cards (porta · blurb · ação)
- `matchOutput` no `guide.js`: priority → dedup `to` → top 3
- Confirmação humana **Ir →** chama `go(nodeId)` (sem auto-goto)
- `to: null` = só dica (ex. HTTP 429)
- Smoke: `node scripts/test-error-map.js`

## Como testar (3 pastes)

1. **L** → cola `Connection refused` → analisar → **Ir →** → nó `alive`
2. Cola `HTTP/1.1 401 Unauthorized` → `web-auth`
3. Cola `You have an error in your SQL syntax` → `web-sqli`

CLI: `node scripts/test-error-map.js` → 7 casos OK.

## O que **não** foi feito

- LLM / copiloto / Ollama (Fase 3)
- Auto-goto sem confirmação
- Novos nós de cobertura “pro matcher”
- Persistência do paste, sync cloud
- Freshness em massa / wire de todos os 62 nós à KB

## Próximo

**Fase 3 — Copiloto:** [`03-copilot.md`](03-copilot.md)  
Pack de prompts quando fores abrir a 3 (`docs/prompts-fase3/` — ainda não existe).
