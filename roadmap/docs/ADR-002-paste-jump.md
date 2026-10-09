# ADR-002 — Paste → jump (matcher sem LLM)

**Status:** Aceito (Fase 2)  
**Data:** 2026-08-28  
**Fase:** [`docs/fases/02-paste-jump.md`](fases/02-paste-jump.md)  
**Pack:** [`docs/prompts-fase2/`](prompts-fase2/README.md)

## Contexto

No engajamento, o terminal devolve erros/sinais (connection refused, 401, SSL, Kerberos…) e o hunter tem de decidir o próximo nó da árvore. Hoje isso é memória + minimap. Queremos **colar stdout/stderr** e o HUB **sugerir** para onde ir — sem LLM, sem teleporte cego.

## Decisão

1. Regras estáticas em `data/error-map.js` → `window.HUNTER_ERROR_MAP` (cliente, estático).
2. Match no browser: texto colado × `patterns` (RegExp e/ou substring normalizada).
3. **Nunca** `go(nodeId)` automático — só após confirmação explícita do user.
4. Empate / multi-hit: ordenar por `priority` (maior primeiro), dedup por `to`, expor **top 3**; user escolhe.
5. `to` deve ser `nodeId` existente no playbook, **ou** `null` (só dica, fica no nó atual) — Prompt 05.
6. Paste-jump é atalho de navegação; não substitui path, RoE, nem Knowledge Study/Field.

### Shape mínimo de uma regra

```js
{
  id: "conn-refused",
  patterns: [/connection refused/i, /No route to host/i],
  to: "alive",           // nodeId existente | null = só hint
  hint: "Alvo/rota morta — revalida IP/VPN",
  priority: 10           // maior ganha; empate → ordem estável por id
}
```

### Shape do registry

```js
window.HUNTER_ERROR_MAP = {
  meta: { version: "0.1.0", name: "Phantonite error-map" },
  rules: [ /* ... */ ],
};
```

### Algoritmo (contrato)

1. Normalizar input (trim; opcional lower só para patterns string).
2. Para cada rule: se **qualquer** pattern casar → hit `{ rule, score: priority }`.
3. Ordenar hits por `priority` desc; empate por `id` asc.
4. Dedup por `to` (primeiro ganha).
5. Slice máx 3 → UI.
6. Confirmar → `go(to)` se `to` truthy e nó existe; senão toast/erro.

## Consequências

- Qualidade = qualidade das regras + nós já existentes (não inventar cobertura).
- Falsos positivos: priority + top-3 + confirm mitigam.
- Smoke do playbook continua a validar `to` ≠ nó fantasma (script na seed / wire).

## Não-objetivos

- LLM / copiloto (Fase 3)
- Auto-goto
- Novos nós de porta/ramo “pro matcher”
- Persistência do paste, sync cloud, backend

## Próximo

Prompt `02` — seed `data/error-map.js` (8–15 regras).
