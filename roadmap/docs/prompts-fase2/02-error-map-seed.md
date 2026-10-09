# Prompt 02 — Seed `data/error-map.js`

## Pré-requisito
Prompt 01 (ADR-002) feito.

## Objetivo
Biblioteca inicial de padrões → nó + dica, baseada em erros **reais** de lab/Kali.

## Faça

1. Cria `data/error-map.js` exportando `window.HUNTER_ERROR_MAP` (ou equivalente alinhado ao ADR):
   - `meta.version`
   - `rules[]` no shape do ADR
2. Seed **mínimo 8, máximo 15** regras. Preferir o que o dono já viu:
   - connection refused / no route / network unreachable → `alive` ou setup
   - timeout / timed out
   - SSL / certificate problems
   - 401 / 403 (web-auth ou web)
   - WAF / blocked / captcha (dica, não fake bypass)
   - SMB signing / STATUS_…
   - Kerberos / KRB_ / clock skew (se nó AD existir)
   - hydra/ncrack lockout-ish messages (dica RoE)
3. Cada `to` **deve** existir no playbook — valida com script ou check manual
4. Include no `guide.html` **só se** Prompt 03/04 precisar; neste prompt podes deixar o ficheiro + comentário de load
5. Doc curta no topo do ficheiro: como adicionar regra

## Critério de done
Ficheiro no repo; 0 `to` apontando a nó inexistente.

## Fora de escopo
UI de paste, engine de match, LLM.
