# Prompt 05 — RoE profissional + anti-CTF language

## Objetivo
Alinhar o gate RoE (e textos óbvios de briefing) à identidade **pentest autorizado / estudo controlado** — não “zerar HTB”.

## Faça

1. Reescreva o nó `roe` (e se necessário `stop-roe` / textos de help curtos) para incluir mindset de:
   - Scope / targets / excluded
   - Allowed vs prohibited techniques
   - Evidence handling (mencionar)
   - Lab/THM/HTB como **opcional** (“se for lab, a box é o escopo”) — não o default mental
2. Remova ou suavize linguagem que empurre walkthrough-CTF
3. Não transforme em formulário jurídico burocrático — continua UX checklist
4. Smoke OK

## Critério de done
Ler `roe` soa a engagement profissional; lab ainda funciona.

## Fora de escopo
Engagement profile completo (Fase 4), auth, PDF de contrato.
