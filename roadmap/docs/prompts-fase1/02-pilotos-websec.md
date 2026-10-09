# Prompt 02 — Três pilotos WebSec (SSRF, JWT, SQLi)

## Pré-requisito
Prompt 01 feito (schema + registry existem).

## Objetivo
Popular **exatamente 3** `KnowledgeEntry` profundos (não rasos):

1. `ssrf` (technique / web)
2. `jwt-attacks` (technique / web) — ou split concept `jwt` + technique se o schema exigir; prefira **1 entry rich** se evitar duplicação
3. `sqli` (technique / web)

## Cada entry DEVE ter

### Study
- concept / o que é
- when to look
- prerequisites (ids related se possível)
- how it works (curto, profissional)
- limitations
- freshness: `current` (salvo justificativa)
- references (OWASP / PortSwigger / RFCs — links reais)

### Field
- observe
- hypotheses (lista)
- tests (passos, não só cmds)
- tools (nomes; cmds opcionais e secondary)
- validate
- evidence
- impact
- remediation (alta nível)

### related
Pelo menos 2 links cada (ex.: SSRF → http, cloud-metadata; JWT → authn, cryptography; SQLi → databases, input-trust)

## Regras
- PT-BR
- Sem walkthrough de máquina CTF
- Sem “rode só este one-liner e root”
- Cmds OK no Field, mas **depois** de hipótese/teste
- Não criar o 4º/5º entry “já que estamos aqui”
- Não expandir playbook nodes

## Critério de done
3 entries completos no registry; dá pra ler no source e entender Study vs Field sem a UI.

## Fora de escopo
UI toggle, foundations stubs (próximo prompt), wire nos paths.
