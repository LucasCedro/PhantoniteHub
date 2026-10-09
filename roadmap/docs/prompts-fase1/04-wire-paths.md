# Prompt 04 — Wire playbook paths → KnowledgeEntry

## Pré-requisito
Prompts 02–03 feitos.

## Objetivo
Ligar nós **existentes** do playbook aos entries — sem apagar cmds que já funcionam.

## Faça

1. Estenda o shape do `Node` (ou overlay em `playbook-extra.js`) com algo como:
   ```js
   knowledgeIds: ["ssrf"]  // opcional
   ```
2. Wire no mínimo:
   - `web-ssrf` → `ssrf`
   - `web-jwt` → `jwt-attacks` (ou id escolhido)
   - `web-sqli` → `sqli`
3. Em `guide.js` / `guide.html`: painel **simples** no stage:
   - Se o nó tem `knowledgeIds`, mostra card “Knowledge” com título + 4–6 linhas do Field (hipótese/teste) + link “ver entry completa” (pode ser `<details>` ou subview mínima)
4. Incluir `registry.js` no `guide.html` se ainda não estiver
5. Hydrate/copy/exports **não podem quebrar**
6. Smoke OK

## Regras
- Não migrar todos os 62 nós
- Não remover blocks/cmds existentes
- Não Study/Field toggle completo ainda (só preview Field no path está OK; Study pode ficar em `<details>`)

## Critério de done
Usuário em `web-ssrf` vê contexto de conhecimento + continua copiando cmds como antes.

## Fora de escopo
Paste-jump, copiloto, redesign das 3 colunas.
