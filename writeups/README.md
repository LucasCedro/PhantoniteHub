# Write-ups

Projeto separado: rascunhos e o agente de revisão pra Medium.  
Não mistura com `site/` (portfólio), `hub/` (field guide) nem `roadmap/`.

O garage só ganha um objeto em `window.PORTFOLIO.writeups[]` **depois** que o texto está no ar.

## Como usar o agente

1. Joga o rascunho em `writeups/drafts/`.
2. Abre um Agent no Cursor neste repo.
3. Ou cola [`PROMPT.md`](PROMPT.md) nas custom instructions do Agent.
4. Pede: *revisa este write-up e deixa Medium-ready*.

A skill em `.cursor/skills/writeup-medium/` só aponta pra cá (`writeups/SKILL.md`).

## Depois de publicar

Um objeto em `site/index.html` → `writeups[]`. Campo `note` = juízo (tentativa que morreu + oráculo + alvo real). Sem `note`, o case do garage fica só com a descrição.
