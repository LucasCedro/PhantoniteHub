# Fase 2 — Paste → jump

**Status:** FECHADA — ver [`02-DONE.md`](02-DONE.md)  
**ADR:** [`../ADR-002-paste-jump.md`](../ADR-002-paste-jump.md)  
**Pack:** [`../prompts-fase2/README.md`](../prompts-fase2/README.md)  
**error-map:** `data/error-map.js` **v0.3.0 · 35 regras**

Matcher **sem LLM**: colar stdout/stderr → sugestão de nó → confirmar.

## Escopo

1. [x] ADR-002 matcher — prompt `01`
2. [x] Seed `data/error-map.js` — `02`
3. [x] UI colar output — `03`
4. [x] Match + suggest + confirm goto — `04`
5. [x] Mais padrões / wire — `05`
6. [x] Fechar Fase 2 — `06`

## Teste

```bash
node scripts/test-error-map.js
```

## Próximo

**Fase 3** — [`03-copilot.md`](03-copilot.md) (só docs até o pack existir)
