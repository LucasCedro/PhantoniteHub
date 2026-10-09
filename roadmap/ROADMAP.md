# Phantonite HUB — Roadmap do projeto

Guia pessoal de pentest (HTML/CSS/JS). Sem backend obrigatório. Sem intenção de produto comercial.

**Lema:** Nullius in verba.  
**Paleta:** 60% preto · 30% vermelho · 10% ciano `#00D4FF`.

**Fases (6):** ver [`docs/fases/README.md`](docs/fases/README.md) — `0 → 1 → 1.5 → 2 → 3 → 4`.  
**ADR:** [`docs/ADR-001-knowledge-architecture.md`](docs/ADR-001-knowledge-architecture.md) · [`docs/ADR-002-paste-jump.md`](docs/ADR-002-paste-jump.md)  
**KB schema:** [`data/knowledge/schema.md`](data/knowledge/schema.md) · registry `data/knowledge/registry.js`

### Freeze (Fase 1)

Não adicionar nós de cobertura/porta só por checklist. Corpus atual = classificar e ligar à KB.

---

## Norte

Ordem de valor/hora (atualizada):

1. **Knowledge architecture** + WebSec piloto + Foundations mínimas (Fase 1) — *FEITO* ([01-DONE](docs/fases/01-DONE.md))
2. **Content QA / Study·Field / gate lab** (Fase 1.5) — *FEITO* ([01.5-DONE](docs/fases/01.5-DONE.md)); gate = checklist do dono
3. **Colar output → salto** sem LLM (Fase 2) — *FEITO* ([02-DONE](docs/fases/02-DONE.md))
4. **Copiloto** (Fase 3) — *EM CURSO* MVP paste híbrido ([ADR-003](docs/ADR-003-paste-hybrid-llm.md))
5. **Evidence / reporting** (Fase 4)

Não pular. Copiloto cedo = chat bonito em cima de árvore/KB ruim.

---

## Fase 0 — Base (FEITO)

- [x] App estático (`index.html` + `guide.html`)
- [x] Engine de decisão (`js/guide.js` + `data/playbook.js`)
- [x] Params drawer + hidratação de comandos + exports Kali
- [x] Visual garage / Hackers ’95 (preto/vermelho/ciano)
- [x] Rail, trilha, notas, atalhos

---

## Fase 1 — Árvore robusta (conteúdo completo · **pendente validação de campo** · v2.1.0)

Objetivo: playbook que aguenta engajamento web + host + AD light + cloud light + post-exploit, sem depender do que o Phantonite “já sabe”.

> Status honesto: conteúdo + wiring + smoke OK. **Valor de campo ainda não confirmado** — gate 1.3 aberto. Não tratar como “pronto pra combate” até fechar o lab.

### 1.1 Cobertura alvo

- [x] Recon passivo moderno (subs, asn, wayback, github dorks, crt.sh) → nó `passive`
- [x] Web moderno (API, JWT, upload, SSRF, XXE, deserial, cache/CDN, nuclei, LFI, SQLi, XSS, CMDi, GraphQL)
- [x] Auth avançada (OAuth/OIDC patterns, JWT) → `web-oauth`, `web-jwt`
- [x] CMS / painéis (WP, Jenkins, Tomcat)
- [x] Rede clássica + atual (SMB, LDAP, Kerberos, WinRM, NFS, SNMP, DNS)
- [x] DB (MySQL, MSSQL, Postgres, Redis, Mongo, ES)
- [x] AD attack path (enum → spray → BloodHound mindset → crack/relay → lateral)
- [x] Cloud light (AWS metadata, K8s exposed)
- [x] Mobile light (APK static)
- [x] Post-exploit Linux/Windows + file xfer + report/retest

### 1.2 Qualidade do conteúdo

- [x] Nós com `say` + comandos + choices (`data/playbook.js` + `data/playbook-extra.js`)
- [x] Placeholders `$IP` / `$TARGET` / `$DOMAIN` / wordlists alinhados (params + `hydrateCmd` + exports)
- [x] Smoke test: **61 nós, 0 links quebrados, 0 órfãos** (`node scripts/smoke-playbook.js`, 2026-08-26) — *antes: 53 na v2.0.0*
- [x] Densidade/wiring pré-lab: orphans ligados; hubs patchados; field-guide LFI/SQLi/XSS/CMDi/GQL/crack/relay/xfer
- [ ] **Só depois do lab:** revisar densidade/comandos no que doeu (ajuste fino, não reabre 1.1)

### 1.3 Critério de “pronto” da Fase 1

- [x] Conteúdo + wiring prontos pra engajamento web/host/AD-light/cloud-light/post (v2.1.0)
- [ ] **Gate teu:** 1 lab completo no HUB sem abrir writeup por “falta de ramo óbvio”
- [ ] **Pós-gate (opcional):** 2º lab de categoria diferente, mesmo critério

> Gate 1.5: dono validou uso em labs; avançar Fase 2 OK. Ajustes finos de conteúdo quando doer.

---

## Fase 2 — Colar output → salto (**FEITO** · [`02-DONE`](docs/fases/02-DONE.md))

Objetivo: tu cola stderr/stdout e o HUB sugere o próximo nó (regras, sem LLM).

- [x] UI: caixa “Colar output do terminal” (PASTE.LOG · `L`)
- [x] Matcher de padrões (timeout, connection refused, 401/403, SSL, SMB signing, Kerberos, WAF…)
- [x] Ação: `goto_node` sugerido + botão confirmar
- [x] Biblioteca `data/error-map.js` (padrão → nó + dica) v0.2.0 · 25 rules
- [x] Ligar erros ↔ ramos existentes (WebSec + serviços; sem nós novos)

### Critério de pronto

3 erros reais que tu já tomou no Kali caem no matcher certo. — coberto por `scripts/test-error-map.js` + uso em lab.

---

## Fase 3 — Copiloto

Objetivo: auxiliar conversacional **depois** da carne na árvore.

### 3.1 MVP passivo

- [ ] Drawer Copiloto
- [ ] Contexto: nó + params + trilha + notas
- [ ] Backend de modelo: Ollama local **ou** API key em Params
- [ ] Só aconselha (não muda estado sozinho)

### 3.2 Agente com tools

- [ ] `set_params`
- [ ] `goto_node` / `list_nodes`
- [ ] `explain_cmd`
- [ ] Confirmação humana em ações sensíveis
- [ ] Opcional: mandar output colado da Fase 2 pro modelo

### Critério de pronto

Perguntas do tipo “ajusta LHOST e me manda pro ramo shell” funcionam com confirmação.

---

## Fase 4 — Polish operacional (quando doer)

- [ ] Export finding `.md` a partir do template do ramo Report
- [ ] Multi-engajamento (profiles de params nomeados)
- [ ] Atalho desktop / PWA opcional
- [ ] Self-host fonts 100% offline
- [x] Smoke do playbook (`scripts/smoke-playbook.js`)
- [ ] Testes automatizados do hydrate + links da árvore (expandir)
- [x] First-run soft: abre params se IP vazio; bloqueia copy de cmd que depende de IP/LHOST sem session

---

## Fora de escopo (de propósito)

- SaaS, auth de usuários, billing
- Backend obrigatório em produção
- Substituir Burp/Kali pela IA
- “Auto-hack” sem RoE

---

## Como usar este roadmap

1. Marca checkboxes conforme fecha.
2. Não começa Fase N+1 com Fase N pela metade (exceto bugs urgentes de UI).
3. Conteúdo novo = `data/playbook.js` (+ `playbook-extra.js` + outline + choices).
4. Features novas = `guide.html` / `js/guide.js` / `css/hunter.css`.

---

## Log curto

| Data | O que |
|------|--------|
| 2026-08-26 | HUB nasce (UI + params + árvore inicial) |
| 2026-08-26 | Roadmap formal; árvore v2.0.0 (+34 nós em `playbook-extra.js`) |
| 2026-08-26 | Fase 1 fechada em conteúdo · v2.1.0 (61 nós, 0 órfãos; LFI/SQLi/XSS/CMDi/GQL/crack/relay/xfer) |
| 2026-08-28 | ADR-001 Knowledge architecture; `data/knowledge/` schema + registry v0.1.0 (entries vazias) |
| 2026-08-28 | Prompt 02: pilotos `ssrf`, `jwt-attacks`, `sqli` (registry v0.2.0) |
| 2026-08-28 | Prompt 03: foundations stubs + `cloud-metadata` (registry v0.3.0) |
| 2026-08-28 | Prompt 04: wire `web-ssrf/jwt/sqli` → KB + card no guide |
| 2026-08-28 | Prompt 05: RoE profissional (`roe` / `stop-roe`) — lab opcional |
| 2026-08-28 | Prompt 06: Fase 1 fechada → handoff 1.5 (`docs/fases/01-DONE.md`) |
| 2026-08-28 | Fase 1.5: toggle Study/Field + gate lab checklist (`01.5-DONE`) |
| 2026-08-28 | Drop `prompts-fase1`; add `docs/prompts-fase2` pack (paste→jump) |
| 2026-08-28 | ADR-002 paste→jump (matcher sem LLM; confirm before goto) |
| 2026-08-28 | Seed `data/error-map.js` v0.1.0 (12 rules) |
| 2026-08-28 | Prompt 03: PASTE.LOG UI + stub analyze (`L`) |
| 2026-08-28 | Prompt 04: matchOutput + confirm goto (`test-error-map.js`) |
| 2026-08-28 | Prompt 05: error-map v0.2.0 (25 rules · WebSec/services wire) |
| 2026-08-28 | Prompt 06: Fase 2 fechada → handoff Fase 3 (`docs/fases/02-DONE.md`) |
| 2026-08-29 | Ports map UX: search + cards; error-map v0.3.0 (Kali-real rules) |
| 2026-08-29 | ADR-003 + MVP paste híbrido (Analisar com IA · Ollama-first) |

---

*Phantonite HUB — Nullius in verba*
