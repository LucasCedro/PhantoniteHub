# Prompt 03 — Foundations stubs + related

## Pré-requisito
Prompt 02 feito (SSRF, JWT, SQLi no registry).

## Objetivo
Criar **stubs** de Foundations (first-class, profundidade baixa) e ligar aos pilotos.

## Criar entries `kind: concept` (stubs)

Mínimo sugerido (ajuste nomes ao schema):

- `http`
- `authentication`
- `authorization`
- `cryptography` (só o necessário pra JWT: HMAC/RSA mindset)
- `databases` / `sql` (o que o schema preferir — **um** stub, não enciclopédia)
- `trust-boundaries` (curto)

Cada stub:
- Study: 1 parágrafo + “por que importa no pentest”
- Field: 3–5 bullets “quando isso aparece no engagement”
- freshness: `educational` ou `current`
- related ↔ pilotos WebSec

## Regras
- Stubs ≠ artigos longos
- Não “Foundations 100%”
- Não novos nós de porta no playbook
- PT-BR

## Critério de done
A partir de SSRF/JWT/SQLi dá pra navegar mentalmente (via `related`) até foundations.

## Fora de escopo
UI de grafo fancy; AD/Kerberos profundo (pode 1 stub `kerberos` se couber fácil — senão deixa pra depois).
