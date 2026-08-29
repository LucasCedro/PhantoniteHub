# Fase 2 — Pack de prompts (executar em ordem)

**Colar output → salto** sem LLM. Pack em `docs/prompts-fase2/` (não poluir a raiz).

Ordem: `01` → `02` → `03` → `04` → `05` → `06`.  
Um prompt por sessão. Não pular pra copiloto (Fase 3).

Índice: [`../fases/README.md`](../fases/README.md) · fase: [`../fases/02-paste-jump.md`](../fases/02-paste-jump.md)

---

## Como usar

1. Abre o Cursor no repo `jornada-hunter`.
2. Cola o ficheiro da etapa (ou aponta o path).
3. Aceita só o escopo da etapa.
4. Smoke: `node scripts/smoke-playbook.js` se mexer em playbook; testar paste manual no guide.

---

## Decisões travadas (não reabrir)

- Matcher = **regras / regex / keywords** — sem LLM nesta fase.
- Sugestão + **confirmação humana** antes de `goto` (nunca teleporte cego).
- `data/error-map.js` = fonte dos padrões (padrão → nó + dica).
- Não expandir cobertura de nós “porque o matcher precisa”.
- KB / Study·Field ficam; paste-jump é atalho de navegação, não substituto do path.
- Freeze copiloto até Fase 2 fechada.

---

## Índice

| # | Ficheiro | Objetivo |
|---|----------|----------|
| 01 | [`01-adr-matcher.md`](01-adr-matcher.md) | ADR shape do matcher + error-map |
| 02 | [`02-error-map-seed.md`](02-error-map-seed.md) | Seed `data/error-map.js` (erros reais) |
| 03 | [`03-paste-ui.md`](03-paste-ui.md) | UI “Colar output” no guide |
| 04 | [`04-match-suggest.md`](04-match-suggest.md) | Engine match + sugestão + confirmar |
| 05 | [`05-patterns-wire.md`](05-patterns-wire.md) | Mais padrões + ligar a nós existentes |
| 06 | [`06-fechar-fase2.md`](06-fechar-fase2.md) | Checklist + DONE + handoff Fase 3 |
