# Prompt — diagnóstico completo do minigame Bitmite (Tamagotchi)

> Cole este arquivo inteiro no Claude. Peça diagnóstico crítico do **jogo inteiro**, não elogio genérico.
> Fontes no repo: `js/pet.js`, `js/den.js`, CSS `.pet-*` em `css/hunter.css`, mount em `index.html` + `guide.html`.

---

## Quem você é neste review

Você é um **game designer + systems designer + UX de overlay + pixel/game-feel lead** revisando um easter-egg Tamagotchi (Bitmite) embutido num site estático de pentest (Phantonite HUB).

O pet **não** é o produto principal — o hub de pentest é. O Bitmite tem que:
1. ser viciante o bastante pra o dono cuidar enquanto faz lab;
2. não atrapalhar o fluxo de pentest;
3. carregar lore/carinho (não virar clicker burro).

Já houve uma rodada só de animações. Agora quero o **diagnóstico do minigame completo**: mecânicas, balance, progressão, death/neglect, UX do dock/chip, integração no app, e arte/feel só onde impacta o jogo.

**Não** reescreva o jogo. Entregue diagnóstico + recomendações priorizadas (impacto × esforço).

---

## Contexto do produto

- Site estático (HTML/CSS/JS), aesthetic garage / Hackers ’95 — preto, vermelho `#e11d2e`, ciano `#00d4ff`.
- Home (`index.html`): terminal interativo (`js/den.js`). Easter egg:
  - `tamago run` → abre/maximiza (não reseta save)
  - `tamago stop` → minimiza (chip no canto)
  - `tamago kill` → mata processo + apaga `localStorage`
  - `tamago status` / `tamago name <nick>`
- Hub (`guide.html`): árvore de decisão de pentest — **também** carrega `js/pet.js`.
- `pet.js` **injeta** o DOM do dock+chip se não existir (`ensureShell`) → mesmo pet em todas as telas.
- Persistência: `localStorage` key `phantonite-tamago-v4` (migra legacy v1–v3).

---

## Loop do jogador (como deveria sentir)

1. Descobre `tamago run` na home (não está no `help` público).
2. Cuida do Bitmite (comer / dormir / brincar).
3. Minimiza com `_` → chip discreto no canto (também no guide).
4. Continua o pentest; de vez em quando abre o chip pra cuidar.
5. Gates de tempo + cuidados reais → hibernação → próxima forma.
6. Negligência gera care mistakes; zero prolongado mata (exceto ovo/larva).
7. Forma final: Guru. Morte → Reviver (não wipe; wipe só com `kill`).

---

## Sistemas — estado atual (spec do código)

### Cadeia de evolução (9 formas)

```
egg → larva → pupa → kid → teen → adult → alfa → elder → guru
```

Entre cada transição: **hibernação** (sem decay, ações bloqueadas).
Duração hibernação: `fase × 2.5 minutos` (fase 1..9).
Casulos visuais por faixa: **S** (egg–pupa), **M** (kid–adult), **L** (alfa–guru).

### Gates pra evoluir (precisa dos dois)

| Stage | cares mínimos | tempo mínimo na forma |
|-------|---------------|------------------------|
| egg | 1 | 0 |
| larva | 3 | 20 min |
| pupa | 4 | 45 min |
| kid | 5 | 3 h |
| teen | 6 | 6 h |
| adult | 7 | 8 h |
| alfa | 8 | 10 h |
| elder | 10 | 12 h |
| guru | — | forma final |

`TIME_SCALE = 1` (tunable; 2 = tudo 2× mais rápido).

### Stats

- Escala 0–100. Metafora Gen1: **1 coração ≈ 25 pts** (`HEART = 25`), max 4♥.
- Barras: **hunger**, **energy**, **mood**.
- Ações:
  - feed → +25 hunger (`ACTION_MS` 4500)
  - sleep → +30 energy (7000)
  - play → +25 mood, −5 energy (5500)
- Boost aplica **só no fim** da animação (`pendingBoost`).

### Anti-cheat de cuidado (recente)

Cuidado **só é aceito** se a barra alvo estiver `≤ 75` (falta ≥1♥):

```js
CARE_NEED_AT_OR_BELOW = 100 - HEART // 75
```

- Se cheio: recusa com status (`"já tá cheio — espera a fome baixar"`, etc.).
- `cares++` só quando a ação era necessária.
- **Exceção:** ovo sempre pode `feed` (pra nascer), mesmo com hunger 100 / decay 0 no egg.

### Decay por estágio (pts/min)

| Stage | hunger | mood | notas |
|-------|--------|------|-------|
| egg | 0 | 0 | tutorial estático |
| larva | 25/5 = 5.0 | 25/6 ≈ 4.2 | bebê Gen1 (1♥ / 5–6 min) |
| pupa | 25/25 = 1.0 | ~0.9 | |
| kid | 25/60 ≈ 0.42 | ~0.36 | 1♥ / ~1h |
| teen | 25/90 ≈ 0.28 | 0.25 | 1♥ / ~1h30 |
| adult+ | ≤ 25/120 ≈ 0.21 | mais lento | 1♥ / ≥2h |
| guru | 25/180 ≈ 0.14 | ~0.15 | bem lento |

Energy tem rates próprias (sempre um pouco mais lentas que hunger).

### Neglect / morte

- Zero em hunger **ou** mood por 12 min → +1 `careMistake` (acumula).
- Zero por 40 min → `dead` (exceto **egg** e **larva** — não morrem por neglect).
- `careMistakes` aparece no hint de evo; **ainda não** muda qual adulto/forma sai (não há branching de evolução por mistakes).
- Dead: sprite = idle do estágio atual recolorido cinza + X nos olhos (não mais ovo genérico).
- Revive: stats 75, limpa neglect; **não** reseta estágio.

### UX / shell

- Dock flutuante, arrastável, rename no nome.
- Botão `_` = minimizar (não kill).
- Chip: canto inferior **esquerdo**, discreto (opacity baixa), só símbolo `●` / `!` / `◐` / `×`.
- Chip só aparece se `discovered` (depois do primeiro `tamago run`).
- Loop `rAF` continua minimizado pra decay + atualizar chip.
- Esc minimiza o dock.

### Animações (resumo — já revisado antes)

- Canvas 16×16 ×10, paleta 8 cores, frames em strings `F([...])`.
- Contagem tipica: idle 2f / eat 3f / sleep 2f / play 3f.
- eat/play: **one-shot + hold** no último frame (anti loop-spam).
- Blink assíncrono no idle; idle hungry (olhos cinza + gota) se hunger/mood &lt; 28.
- Flash âmbar no tick do feed boost.
- Hibernate S/M/L; dead por estágio.

---

## Decisões de design já tomadas pelo dono (respeite)

1. Cadeia longa de 9 formas + hibernação **fica** (não cortar pra Gen1 de 5 fases).
2. Paleta brand / 16×16 / strings `F([...])` ficam.
3. Pet em **todas** as telas via chip discreto — não pode atrapalhar pentest.
4. Cuidar com barra cheia **não** pode valer (anti-clicker).
5. `run` ≠ reset; `kill` = wipe.
6. Easter egg continua secreto no `help` da home.

---

## Cheiros / gaps conhecidos (pra você confirmar ou descartar)

1. `careMistakes` é contabilizado mas **não altera evolução** (promessa Gen1 incompleta).
2. Egg com hunger 100 + decay 0: o único “cuidado” é o feed excepcional — lore frágil no começo.
3. Gates late-game (8–12h + muitos cares) vs decay lento de adult+: risco de **vitrine parada** (“já cresceu, agora é espera”).
4. Play gasta energy mas sleep/feed não têm tradeoff cruzado forte.
5. Sem sickness / disciplina / light (sistemas clássicos Gen1 ausentes) — ok pra easter egg, mas o loop pode ficar raso (só 3 botões).
6. Chip só após discover: no guide “frio” o pet não existe até alguém rodar `tamago run` na home.
7. `paint()` ainda faz vários `load()` por frame (cheiro de perf; secundário).
8. Elder vs Guru ainda fracos em identidade (arte + mecânica quase iguais).
9. Revive é barato (sem penalty) — morte pode não doer.
10. Hibernação bloqueia tudo por minutos reais — no meio do pentest pode irritar ou ser flavor bom; precisa veredito.

---

## O que eu quero de você (entregáveis)

Responda em **português**, direto, nível expert.

### 1. Veredito em 8 linhas
O Bitmite como minigame: está “easter egg gostoso”, “loop incompleto”, ou “quase um jogo”? O que carrega e o que fura.

### 2. Fantasy / lore
A cadeia ovo→guru + hibernação + Bitmite cyber-garagem: coeso? Onde a mecânica contradiz a fantasy?

### 3. Loop core (cuidar → esperar → evoluir)
- Ritmo larva vs adult+
- Anti-cheat `≤75` é justo ou punitivo demais / de menos?
- Gates (cares × tempo): quais stages estão broken?
- Hibernação: feature ou atrito?

### 4. Progressão e meta
- 9 formas: sustentável pro escopo?
- Care mistakes sem branching: implementar o quê (mínimo viável) ou dropar a métrica?
- Guru: o que o jogador “ganha” ao chegar? (hoje: quase nada além do sprite)

### 5. Morte / revive / kill
Peso emocional vs reset funcional. Revive barato ok?

### 6. UX no contexto pentest
- Chip discreto + dock overlay: atrapalha?
- Descoberta só via terminal: certo pro easter egg ou cruel demais?
- Minimizar/maximizar cross-page: furos?

### 7. Arte / feel (só o que ainda importa pro jogo)
Não repita o review antigo inteiro. Liste só os 5 gaps de arte/feel que **ainda** travam o game feel depois dos fixes (hold, blink, dead por estágio, casulos S/M/L, hungry idle).

### 8. Top 7 mudanças (impacto × esforço)
Tabela ou lista ranqueada. Cada item: o que mudar, por quê, esforço (baixo/médio/alto), risco.

### 9. O que NÃO mexer
Lista explícita pra não matar o charme.

### 10. Perguntas pra mim (máx. 6)
Só perguntas que mudam o design de verdade.

---

## Tom

Cruel mas útil. Sem “está incrível!!”. Se achar que late-game é grindy sem payoff, diga. Se achar que pra easter egg já passou do ponto de complexidade, também diga — e proponha o que cortar vs o que aprofundar.

Se quiser citar Tamagotchi Gen1 / Digimon / modern virtual pets como referência de sistema, ok — mas priorize o que o **código atual** faz, não nostalgia solta.
