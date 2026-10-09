# Prompt 03 — UI “Colar output”

## Pré-requisito
Prompts 01–02.

## Objetivo
Caixa no guide pra colar stdout/stderr — sem match ainda (ou match stub).

## Faça

1. Em `guide.html` / `css/hunter.css` / `js/guide.js`:
   - Painel ou drawer discreto: textarea + botão “Analisar” (ou equivalente)
   - Atalho opcional (ex. `L` de log) — documenta no help `?`
   - Não parece chatbot; visual alinhado ao HUB
2. Estado: texto colado em memória (não precisa persistir)
3. Placeholder de resultado: “Matcher na próxima etapa” **ou** chama stub vazio
4. Include `data/error-map.js` no `guide.html` se ainda não estiver
5. Hydrate/copy/exports/KB toggle **não quebram**

## Critério de done
User cola texto, clica analisar, vê UI de resultado vazia/stub sem erro de consola.

## Fora de escopo
Lógica de match real, goto automático, copiloto.
