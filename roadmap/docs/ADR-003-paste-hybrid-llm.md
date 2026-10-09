# ADR-003 — Paste híbrido (regex + Analisar com IA)

**Status:** Aceito (MVP)  
**Data:** 2026-08-29  
**Fase:** 3 mínimo · [`docs/fases/03-copilot.md`](fases/03-copilot.md)

## Contexto

Fase 2 entregou paste→jump só com `error-map` (RegExp). Enum bem-sucedida (ex. gobuster `/console` 400) não é “erro” — regex falha por desenho. O dono precisa de análise flexível sem chatbot-first.

## Decisão

1. Regex continua 1ª linha (`data/error-map.js`).  
2. Miss → botão explícito **Analisar com IA** (nunca auto).  
3. Provider-agnostic: `llm_base_url` + `llm_model` + `llm_api_key` opcional; default Ollama `127.0.0.1:11434`.  
4. OpenAI-compatible `POST /v1/chat/completions` + JSON estrito.  
5. Mesma UI top-3 + **Ir →**; aplica params sugeridos + `go(nodeId)` só no clique.  
6. Só `nodeId` allowlisted; sem chat, sem tool-calling, sem auto-goto.  
7. Log mínimo miss em `localStorage` (`phantonite-hub-ai-log`).

## Consequências

- MVP de Fase 3 começa pelo paste, não pelo drawer de chat.  
- 2.5 “inflar regex” adiada.  
- Qualidade depende do modelo local/API e do system prompt em `data/llm-prompt.js`.

## Não-objetivos

Chat multi-turn, memória entre pastes, graph DB, novos nós por output.
