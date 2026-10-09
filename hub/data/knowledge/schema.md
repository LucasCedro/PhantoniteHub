# KnowledgeEntry — schema (contrato)

Implementação: `registry.js` → `window.HUNTER_KNOWLEDGE`.  
**Estático.** Sem graph database, sem backend. “Knowledge graph” = relações via `related[]`.

## Entidades (kind)

| kind | Significado |
|------|-------------|
| `concept` | Fundamento / protocolo / ideia (ex.: HTTP, Kerberos) |
| `technique` | Método de teste/ataque (ex.: Kerberoasting, SSRF testing) |
| `condition` | Vulnerability / condição explorável (ex.: “SQLi possible”) |
| `tool` | Recurso intercambiável (Burp, sqlmap) — **secondary** |
| `path` | Playbook/path de decisão (opcional; paths grandes podem ficar só no playbook) |
| `finding` | Ocorrência em um engagement (template; instâncias depois) |

### Distinções críticas

```text
SQL Injection                         → condition / technique (conhecimento)
SQLi em /api/users?id= no engajamento → finding (ocorrência)
sqlmap / Burp / curl                  → tool
```

Observation / Signal e Hypothesis vivem no **Field** (e mentalmente antes da technique) — não exigem graph engine.

Asset / Attack Surface: avaliar depois; por ora checklist mental no Field (`observe`), não inventário.

## Shape

```js
/**
 * @typedef {"concept"|"technique"|"condition"|"tool"|"path"|"finding"} KnowledgeKind
 * @typedef {"current"|"legacy"|"specialized"|"educational"|"deprecated"} Freshness
 * @typedef {"requires"|"implements"|"detected-by"|"see-also"|"foundational"} RelationType
 *
 * @typedef {Object} KnowledgeRelation
 * @property {string} id
 * @property {RelationType} rel
 *
 * @typedef {Object} KnowledgeStudy
 * @property {string} summary
 * @property {string} [whenToLook]
 * @property {string} [howItWorks]
 * @property {string} [limitations]
 * @property {string[]} [prerequisites]  // ids
 * @property {string[]} [references]     // URLs / cites
 *
 * @typedef {Object} KnowledgeField
 * @property {string} [observe]          // Observation / signal
 * @property {string[]} [hypotheses]
 * @property {string[]} [tests]          // passos; cmds secondary
 * @property {string[]} [tools]          // nomes
 * @property {string[]} [commands]       // opcional; templates $IP etc.
 * @property {string} [validate]
 * @property {string} [evidence]
 * @property {string} [impact]
 * @property {string} [remediation]
 * @property {string} [retest]
 *
 * @typedef {Object} KnowledgeEntry
 * @property {string} id
 * @property {KnowledgeKind} kind
 * @property {string} title
 * @property {string} [domain]           // websec|foundations|methodology|infra|cloud|ad
 * @property {Freshness} freshness
 * @property {KnowledgeStudy} study
 * @property {KnowledgeField} field
 * @property {KnowledgeRelation[]} [related]
 */
```

## Qualidade mínima (anti “rode este cmd”)

Uma entry boa responde: o que estou vendo? o que significa? hipótese? o que testar? como validar? evidência? quando vira Finding? impacto? remediação? retest?

## Registry

```js
window.HUNTER_KNOWLEDGE = {
  meta: { version, updated },
  entries: { [id]: KnowledgeEntry }
}
```

Playbook node (futuro wire): `knowledgeIds?: string[]`.
