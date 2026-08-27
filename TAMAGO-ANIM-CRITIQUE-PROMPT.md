# Prompt — revisão crítica das animações 8-bit do Bitmite (Tamagotchi)

> Cole este arquivo inteiro no Claude. Peça diagnóstico crítico, não elogio genérico.
> Código-fonte de referência no projeto: `js/pet.js` (+ CSS `.pet-*` em `css/hunter.css`).

---

## Quem você é neste review

Você é um diretor de arte / pixel artist + game feel lead revisando um easter-egg Tamagotchi (Bitmite) embutido num site estático de pentest (Phantonite HUB). O dono **gostou muito** do visual 8-bit atual e quer um olhar crítico: o que está forte, o que está “bonitinho mas raso”, inconsistências entre estágios, e o que elevaria o jogo sem virar um engine de animação.

**Não** reescreva o jogo. Entregue diagnóstico + recomendações priorizadas.

---

## Contexto do produto

- Pet secreto no terminal da home (`tamago run`).
- Dock lateral arrastável, canvas pixelado, persistência `localStorage`.
- Cadeia de formas (com hibernação entre cada transição):

```
ovo → larva → pupa → kid → teen → adulto → alfa → elder → guru
```

- Ações do jogador: **feed** (comer), **sleep** (dormir), **play** (brincar).
- Estados especiais: **idle/standby**, **hibernating**, **dead**.
- Aesthetic do site: garage / Hackers ’95 — preto, vermelho `#e11d2e`, ciano `#00d4ff`.

---

## Arquitetura técnica das animações (como está hoje)

### Canvas / raster

| Param | Valor |
|--------|--------|
| Grid lógico | **16×16** pixels |
| Escala na tela | **×10** → canvas 160×160 |
| Smoothing | `imageSmoothingEnabled = false` + CSS `image-rendering: pixelated` |
| Fundo do frame | `#050505` fillRect a cada frame |
| Loop | `requestAnimationFrame(paint)` contínuo enquanto o dock está aberto |

### Paleta (índices 0–8 em `PAL`)

```
0 = transparente (null)
1 = #0a0a0a   (outline / sombra)
2 = #e11d2e   (vermelho brand)
3 = #8f121d   (vermelho escuro)
4 = #00d4ff   (ciano / signal / Zzz)
5 = #f2f2f2   (branco / olhos)
6 = #5a5a5a   (cinza — sleep / dead)
7 = #e8a317   (âmbar — snack / item)
8 = #1a0508   (quase preto quente)
```

### Formato do frame

Cada frame é um array de **16 strings de 16 dígitos**. Helper:

```js
function F(rows) {
  return rows.map((r) =>
    r.replace(/\s/g, "").split("").map((c) => parseInt(c, 10) || 0)
  );
}
```

Sprites vivem em constantes `*_IDLE / *_EAT / *_SLEEP / *_PLAY` e são empacotadas:

```js
const pack = (idle, feed, sleep, play) => ({ idle, feed, sleep, play });

const SPRITES = {
  egg:   pack(EGG_IDLE, EGG_FEED, EGG_IDLE, EGG_IDLE), // sleep/play = idle
  larva: pack(LARVA_IDLE, LARVA_EAT, LARVA_SLEEP, LARVA_PLAY),
  pupa:  pack(...),
  kid:   pack(...),
  teen:  pack(...),
  adult: pack(...),
  alfa:  pack(...),
  elder: pack(...),
  guru:  pack(...),
};
```

Seleção em runtime (`pickFrames`):

1. `dead` → frame estático `DEAD` (1f)
2. `hibernating` → `HIBERNATE` (3f, **mesmo casulo pra todas as formas**)
3. senão → `SPRITES[stage][anim]` onde `anim ∈ { idle, feed, sleep, play }`

### Timing de ação (gameplay ↔ anim)

```js
ACTION_MS = { feed: 4500, sleep: 7000, play: 5500 }
```

- Ao clicar ação: `anim = kind`, `busyUntil = now() + ACTION_MS[kind]`, botões lock.
- Boost de stats só aplica **no fim** da animação (`pendingBoost`).
- Barra de progresso CSS acompanha a ação (ou a hibernação).

### Velocidade de troca de frame (ms entre frames)

| Condição | speed |
|----------|-------|
| default idle | 520 |
| hibernating | 780 |
| sleep | 700 |
| feed / play | 260 |
| elder idle | 640 |
| guru idle | 480 |
| alfa idle | 500 |

### CSS / polish fora do canvas

- `.pet-dock.is-hibernate .pet-canvas` ganha glow ciano.
- **Não** há FX CSS distintos pra eat/sleep/play além do sprite + status text + progress bar.
- Scanline comentada no código (`// scanline soft`) — **não implementada** no draw.

---

## Inventário completo de frames (contagem real no código)

Padrão dominante em quase todas as formas:

| Anim | Frames típicos |
|------|----------------|
| idle / standby | **2f** |
| eat / feed | **3f** |
| sleep | **2f** |
| play | **3f** |

### Por estágio

| Stage | idle | eat | sleep | play | Notas |
|-------|------|-----|-------|------|-------|
| egg | 2 | 3 | — (reusa idle) | — (reusa idle) | Só feed é ação válida; sleep/play bloqueados no gameplay |
| larva | 2 | 3 | 2 | 3 | Formatação “expansiva” (1 string por linha) |
| pupa | 2 | 3 | 2 | 3 | Idem |
| kid | 2 | 3 | 2 | 3 | Encoding compacto (várias strings por linha) |
| teen | 2 | 3 | 2 | 3 | Compacto |
| adult | 2 | 3 | 2 | 3 | Expansivo (foi feito cedo na cadeia) |
| alfa | 2 | 3 | 2 | 3 | Compacto |
| elder | 2 | 3 | 2 | 3 | Compacto; idle mais lento |
| guru | 2 | 3 | 2 | 3 | Compacto; idle um pouco mais rápido |
| **HIBERNATE** (global) | — | — | — | — | **3f** casulo ciano + Z flutuante; **não muda por estágio** |
| **DEAD** | — | — | — | — | **1f** estático; visual lembra ovo cinza + X |

Total aprox.: ~9 formas × ~10 frames de ação + hibernate + dead ≈ **~95 frames** desenhados à mão em strings.

---

## Motifs visuais recorrentes (o que o código “diz”)

Observações do autor / leitura do código (valide ou critique):

1. **Outline preto (1)** + corpo vermelho (2/3) + olhos brancos (5) como silhueta base.
2. **Ciano (4)** = vida / energia / Zzz / hibernação / “signal”.
3. **Âmbar (7)** = comida/snack caindo na boca nas anims de eat.
4. **Cinza (6)** = olhos fechados no sleep + corpo morto.
5. Idle costuma ser **bob vertical / antenas / brilho** sutil (2 frames).
6. Eat costuma ser **item caindo → boca aberta → mastiga**.
7. Sleep costuma ser **olhos cinza + Z ciano**.
8. Play costuma ser **salto / tilt / partículas ciano**.
9. Hibernação = **casulo único** (não morph da forma atual).

---

## Peculiaridades / cheiros técnicos (pra você atacar)

Lista proposital — confirme no raciocínio e diga se importa:

1. **`frameIdx` não reseta** ao trocar `anim` (idle→eat). Pode começar eat no meio do ciclo.
2. **Hibernação visual idêntica** ovo→guru (só muda texto HUD). Perde fantasy da metamorfose.
3. **DEAD** parece ovo morto, não a forma atual.
4. **Egg sleep/play** apontam pro mesmo `EGG_IDLE` no pack (ok no gameplay, mas pack mente).
5. Contagem de frames **uniforme** (2/3) em todas as formas — risco de “mesmo ritmo, só skin diferente”.
6. Formas late-game (kid→guru) parecem ter sido feitas em **batch compacto**; larva/pupa/adult mais “hand-authored”. Possível queda de qualidade / silhueta fraca nas late forms.
7. Sem **anticipation / recovery** frames; ações são loops curtos durante `ACTION_MS` longo (4.5–7s) → pode parecer loop spam.
8. Sem estados derivados de stats no sprite (fome baixa / humor baixo / crítico) — só texto + cor da barra.
9. `paint()` faz `load()` do `localStorage` **várias vezes por frame** (perf / cheiro, secundário ao art direction).
10. Comentário de scanline sem implementação.
11. Sem anim de **transição** ao entrar/sair da hibernação (hard cut pro casulo).
12. Guru/Alfa/Elder diferem pouco em **timing**, quase nada em **linguagem de movimento**.

---

## O que eu quero de você (entregáveis)

Responda em **português**, direto, nível expert. Estrutura:

### 1. Veredito em 5 linhas
O sistema atual é “bom o bastante”, “forte pra easter egg”, ou “precisa de salto de qualidade”? Por quê.

### 2. O que está funcionando (específico)
Cite motifs / decisões técnicas que valem manter (ex.: paleta curta, 16×16, boost no fim da anim, etc.).

### 3. Diagnóstico por família de animação
Para cada uma: **idle**, **eat**, **sleep**, **play**, **hibernate**, **dead** — diga:
- legibilidade em 160px
- leitura emocional
- se o loop sustenta a duração real da ação (`ACTION_MS`)
- nota 1–10

### 4. Diagnóstico por estágio
Ovo → Guru: onde a silhueta evolui de verdade vs. onde vira “recolor / chifrinho a mais”. Marque os 2 melhores e os 2 mais fracos.

### 5. Gaps de game feel (não só arte)
Priorize 5 melhorias de **maior impacto / menor esforço** (ex.: reset `frameIdx`, hold no último frame, blink no idle, Z intensificando, flash de comida, etc.).

### 6. Gaps de maior esforço (só se valer a pena)
Ex.: hibernate por estágio, dead por estágio, idle “hungry/sad”, cutscene de evo 5–8 frames.

### 7. Spec mínima de upgrade (se eu for iterar)
Proposta concreta de pipeline:
- frames alvo por anim (ex.: idle 4f, eat 6f one-shot + hold)
- timing sugerido vs `ACTION_MS`
- regras de silhueta por estágio (tamanho, membros, props)
- o que **não** mexer pra não matar o charme atual

### 8. Perguntas pra mim
Máx. 5 perguntas que mudam o design (ex.: quero vibe Tamagotchi original vs. Digimon/rebirth cyber?).

---

## Restrições do projeto (respeite)

- Continua sendo easter egg num site estático — **sem** engine, **sem** aseprite pipeline obrigatório, **sem** spritesheet PNG se strings 16×16 continuarem viáveis.
- Manter paleta brand (vermelho/ciano/preto).
- Cadeia longa + hibernação fica (não simplificar pra Gen1 de 5 fases só por causa da arte).
- Preferir upgrades que eu consiga desenhar frame-a-frame no mesmo formato `F([...])`.

---

## Tom

Cruel mas útil. Nada de “está incrível!!”. Se achar que late-game é copy-paste disfarçado, diga. Se achar que 2 frames de idle é o sweet spot pra esse tamanho, também diga — e explique o porquê.
