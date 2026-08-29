# Prompt 01 — ADR: paste → jump (matcher sem LLM)

## Objetivo
Travar o desenho do matcher antes de UI/código solto.

## Faça

1. Cria `docs/ADR-002-paste-jump.md` com:
   - Problema (colar stderr/stdout → próximo passo)
   - Decisão: regras estáticas em `data/error-map.js`; match no cliente; **confirm** antes de `go(nodeId)`
   - Shape mínimo de uma regra, ex.:
     ```js
     {
       id: "conn-refused",
       patterns: [/connection refused/i, /No route to host/i],
       to: "alive",           // nodeId existente
       hint: "Alvo/rota morta — revalida IP/VPN",
       priority: 10           // maior ganha se vários match
     }
     ```
   - Empate: lista top-N (máx 3) ordenada por priority; user escolhe
   - Fora de escopo: LLM, auto-goto, inventar nós novos
2. Atualiza `docs/fases/02-paste-jump.md` com link ao ADR + status EM CURSO
3. Não implementes o matcher ainda

## Critério de done
ADR aceite no repo; shape da regra claro o suficiente pra Prompt 02.

## Fora de escopo
UI, `error-map.js` populado, Fase 3.
