# Fase 3 — Copiloto (LLM)

**Status:** EM CURSO (MVP paste híbrido)  
**ADR:** [`../ADR-003-paste-hybrid-llm.md`](../ADR-003-paste-hybrid-llm.md)

LLM ajuda a escolher caminho a partir do paste — **confirmação humana**. Não chatbot-first.

## MVP feito (paste híbrido)

1. [x] Regex 1ª linha (error-map)  
2. [x] Miss → **Analisar com IA** (Ollama-first / API opcional)  
3. [x] JSON → top 3 + params → **Ir →**  
4. [x] Params: `llm_base_url`, `llm_model`, `llm_api_key`  
5. [x] `data/llm-prompt.js` + fixtures + `scripts/test-llm-paste.js`

## Ainda não (Fase 3.x)

- [ ] Drawer Copiloto conversacional  
- [ ] Tools `set_params` / `goto_node` via chat  
- [ ] Memória entre pastes  

## Teste

```bash
node scripts/test-llm-paste.js
node scripts/test-error-map.js
```

Manual: Ollama up → **L** → cola gobuster F01 → Analisar → Analisar com IA → Ir →.
