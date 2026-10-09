# Prompt 04 — Match + sugestão + confirmar

## Pré-requisito
Prompts 01–03.

## Objetivo
Colar → matcher → até 3 sugestões → user confirma → `go(nodeId)`.

## Faça

1. Em `js/guide.js` (ou módulo mínimo):
   - Função `matchOutput(text, rules)` → hits ordenados por `priority`
   - Dedup por `to`
   - Cap 3
2. UI de resultado: cada hit mostra `hint` + label do nó + botão **Ir** / **Confirmar**
3. Confirmar chama o mesmo `go()` da árvore (trilha/visited intactos)
4. Zero hits → mensagem útil (“nenhum padrão — segue o path / adiciona regra”)
5. Não navega sem clique de confirmação
6. Smoke mental: 3 strings de teste fixas no comentário ou `scripts/` leve

## Critério de done
Colar “Connection refused” (ou padrão seed) → sugere nó certo → confirmar salta.

## Fora de escopo
Mais regras (Prompt 05), LLM, auto-jump.
