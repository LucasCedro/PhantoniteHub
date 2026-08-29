# ADR-001 — Knowledge architecture

**Status:** Aceito (Fase 1)  
**Data:** 2026-08-28  
**Fase:** [`docs/fases/01-knowledge-architecture.md`](fases/01-knowledge-architecture.md)

## Contexto

O HUB nasceu como field guide (árvore + cmds). Isso funciona no Kali, mas a unidade de conhecimento não pode continuar sendo o comando. Queremos uma **base de conhecimento operacional** que alimenta o Decision Engine — Study + Field — com especialização WebSec.

## Decisão

1. Introduzir um **Knowledge Model** (conceitual; estático em JS — sem graph DB / backend).
2. Separar entidades: Concept · Technique · Vulnerability/Condition · Tool · Path/Playbook · Finding.
3. Cada `KnowledgeEntry` tem views **Study** e **Field** (mesmo objeto).
4. Paths do playbook (`data/playbook*.js`) **referenciam** entries; não embutem a enciclopédia.
5. Comando e ferramenta são **secondary** (implementação de decisão).
6. Finding/Evidence/Remediation/Retest existem no modelo desde já; UI rica pode ser Fase 4.
7. **Freeze de cobertura:** nesta Fase 1 não adicionar nós de porta/ramo só para “completar checklist”.

## Consequências

- Smoke do grafo continua necessário, mas **não** prova qualidade de conteúdo.
- Corpus ~62 nós = classificar/ligar, não inflar.
- Próximos prompts: pilotos WebSec → foundations stubs → wire paths → RoE.

## Não-objetivos desta ADR

Chatbot, paste-jump, SaaS, inventário de assets enterprise, Neo4j/SQLite obrigatório.
