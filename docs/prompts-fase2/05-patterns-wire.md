# Prompt 05 — Mais padrões + wire aos ramos

## Pré-requisito
Prompt 04 a funcionar.

## Objetivo
Expandir `error-map` com padrões que doem no teu fluxo — ainda só nós **existentes**.

## Faça

1. Adiciona regras até ~20–25 total (não inflacionar)
2. Prioriza WebSec / recon / auth que o HUB já cobre
3. Revisa priorities (timeout genérico não deve ganhar de erro específico)
4. Se um erro “pede” nó que não existe: **dica só** (`to: null` ou fica no nó atual) — **não** cria ramo novo
5. Atualiza `docs/fases/02-paste-jump.md` com contagem de regras
6. Smoke + 3 erros reais do dono (se disponíveis) documentados no DONE draft

## Critério de done
Matcher cobre os casos do ROADMAP § Fase 2 checklist com nós válidos.

## Fora de escopo
Copiloto, novos nós de cobertura, PDF.
