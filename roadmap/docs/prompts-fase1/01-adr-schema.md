# Prompt 01 — ADR + freeze + schema KnowledgeEntry

Você está no repo **Phantonite HUB** (`jornada-hunter`).

## Objetivo desta sessão
Travar a Fase 1 no papel + código mínimo de **schema** — **sem** popular 50 entries e **sem** UI Study/Field completa.

## Faça

1. Atualize `ROADMAP.md` e/ou crie `docs/ADR-001-knowledge-architecture.md` com:
   - Visão: KB operacional + Decision Engine
   - Entidades: Concept, Technique, Condition/Vulnerability, Tool, Path/Playbook, Finding
   - Study vs Field (mesma entry, duas views)
   - Freshness enum
   - Regra: comando/tool secondary
   - Freeze: não adicionar nós de cobertura nesta fase
   - Link para `docs/fases/01-knowledge-architecture.md`

2. Crie `data/knowledge/` (ou equivalente mínimo) com:
   - `schema.md` — contrato do `KnowledgeEntry` (campos Study/Field/related/freshness)
   - Mencione no schema (conceitual): Vulnerability ≠ Finding; Observation/Hypothesis no Field; Tool secondary; **sem** graph DB/backend
   - `registry.js` — `window.HUNTER_KNOWLEDGE = { meta, entries: {} }` vazio ou com 0–1 placeholder
   - Comentário JSDoc / typedef do shape

3. **Não** implemente toggle Study/Field na UI ainda.
4. **Não** migre os 62 nós.
5. **Não** adicione ramos novos no playbook.
6. **Não** invente graph database, Neo4j, SQLite obrigatório, ou “asset inventory engine”.
7. Mantenha o app carregando como hoje (`guide.html` não quebra).

## Critério de done
- ADR legível em <3 min
- Schema documentado
- Registry carrega sem erro se incluído (ou documentado “ainda não wired no HTML”)
- Smoke do playbook continua OK

## Fora de escopo
Fase 1.5, paste-jump, copiloto, redesign, Tamago.
