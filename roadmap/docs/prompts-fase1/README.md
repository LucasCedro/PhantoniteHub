# Fase 1 — Pack de prompts (executar em ordem)

Para de refinar visão. **Arquitetura já foi decidida.** Estes prompts são pra **implementar** a Fase 1.

Ordem sagrada: `01` → `02` → `03` → `04` → `05` → `06`.  
**Pack completo (2026-08-29).** Próximo = Fase 1.5, não estes prompts.  
Um prompt por sessão/PR. Não pular. Não expandir cobertura de nós.

Índice das fases: [`../fases/README.md`](../fases/README.md)

---

## Como usar

1. Abre o Cursor no repo `jornada-hunter`.
2. Cola o prompt da etapa.
3. Aceita só o escopo da etapa (recusa “já faço a 1.5/2/copilot”).
4. Smoke: `node scripts/smoke-playbook.js` no fim de cada etapa que mexer em playbook.

---

## Decisões já travadas (não reabrir)

- KB alimenta a árvore; árvore não vira wiki.
- Cmd/tool ≠ unidade principal; tool secondary.
- WebSec profundo = qualidade, não volume.
- Finding/Evidence = conceito desde já; UI rica pode ser Fase 4.
- Metodologia iterativa.
- ~62 nós = corpus a classificar/ligar, **não** inflar.
- Freeze de novos ramos “por cobertura” durante a Fase 1.
