# PHANTONITE HUB — Prompt-mestre V2 · Revisão arquitetural crítica

> Cole este arquivo no Cursor / ChatGPT / Claude para **evoluir a arquitetura de conhecimento** do HUB.  
> Gap: “árvore de cmds” → **Knowledge Base operacional de Pentest + Decision Engine**.  
>
> ### Freeze de implementação (obrigatório nesta etapa)
> **Não altere código. Não crie arquivos. Não reorganize o playbook. Não refatore pastas.**  
> Só diagnóstico + arquitetura proposta + plano. Implementação **somente** depois do dono aceitar o diagnóstico.

---

## Visão-alvo

> **Base de conhecimento operacional para pentesters, organizada como sistema de decisão.**  
> Enciclopédia guiada de Pentest para **estudo + uso profissional autorizado**, com **especialização em Web Security**.

**Não é:** cheatsheet navegável · CTF walkthrough · Notion em HTML · chatbot-first · SaaS · tool encyclopedia · substitute de Burp/Kali.

Os ~62 nós atuais **não se abandonam**: são o **primeiro corpus** a classificar, criticar e reorganizar — **não** a expandir por cobertura.

---

## Regra de ouro

**O comando não é a unidade principal de conhecimento.** É implementação de uma decisão.

```text
observar → significar → hipótese → verificar → técnica → ferramenta
  → validar → evidência → finding → impacto → documentar → retest
```

### Anti tool-first (explícito)

> **Ferramentas são recursos intercambiáveis associados a técnicas — não categorias primárias do conhecimento.**

Proibido estruturar a KB como:

```text
Nmap / Gobuster / ffuf / Nuclei / Metasploit / Impacket / …
```

e depois “encaixar” teoria dentro delas. Tool vive **embaixo** de Technique/Field, nunca como eixo do grafo.

---

## Arquitetura conceitual

```text
PHANTONITE
│
├── FOUNDATIONS
├── METHODOLOGY          ← navegação/contexto ITERATIVO (não pipeline rígido)
├── WEBSEC ★★★★★         ← especialização (profundidade, não volume)
├── INFRA (Net/Win/Linux/AD)
└── CLOUD
        │
        ↓
 KNOWLEDGE GRAPH
   Concept · Technique · Vulnerability/Condition · Tool · Playbook/Path · Finding
        │
        ↓
 DECISION ENGINE (“o que faço agora?”)
        │
   STUDY  |  FIELD
        │
   test → validate → EVIDENCE → FINDING → REPORT → RETEST
```

**Knowledge Base alimenta a árvore; não a substitui por wiki.**

### Metodologia ≠ árvore linear

Recon → Enum → Exploit → Post **não** é um trilho obrigatório.

> Metodologia é **modelo de navegação e contexto**. O pentester pode voltar a Recon, mudar hipótese, abrir nova superfície e reavaliar. O HUB deve permitir **reentrada**, não só “próximo passo da lista”.

### Evidence / Finding (primeira classe conceitual)

Mesmo que a UI/export venha na Fase 4, a arquitetura **já** deve incluir:

```text
Finding
├── Evidence
├── Affected asset
├── Preconditions
├── Reproduction
├── Impact
├── Severity
├── Remediation
└── Retest
```

“Consegui explorar” **não** é o fim do fluxo profissional.

### O que é WebSec profundo (anti-má interpretação)

> WebSec profundo = **fundamentos + arquitetura + vulnerabilidades + técnicas + validação + impacto (+ remediação)**,  
> **não** “mais quantidade de nós/vulns”.

Proibido interpretar especialização como: *adicionar 200 CVE-names na árvore*.

---

## STUDY vs FIELD

| Modo | Job |
|------|-----|
| **STUDY** | O que é, como funciona, pré-requisitos, relações, atual vs legado, refs |
| **FIELD** | O que observar, hipótese, teste, tools/cmds, validação, evidência, impacto, documentar |

Mesma `KnowledgeEntry`, duas views — não dois mundos duplicados.

---

## Separação de entidades

`Concept` ≠ `Technique` ≠ `Vulnerability/Condition` ≠ `Tool` ≠ `Playbook/Path` ≠ `Finding`

Freshness: `CURRENT` · `LEGACY` · `SPECIALIZED` · `EDUCATIONAL` · `DEPRECATED`

### Métricas certas

Coverage · Depth · Accuracy · Current relevance · Discoverability · Field usefulness · Study usefulness · Validation quality  

**Não** usar nº de nodes/cmds como KPI.

---

## Fases (6) — ver `docs/fases/`

```text
0 Base (FEITO)
1 Knowledge architecture + WebSec piloto + Foundations mínimas
1.5 Content QA · Freshness · Study/Field UX · Gate lab
2 Paste output → decision engine (sem LLM)
3 Copilot
4 Evidence / Findings / Reporting (implementação; conceito já existe desde já)
```

Copilot **depois** da qualidade da base.

---

## Regras absolutas

1. Freeze: **zero** código/arquivos/reorg de playbook nesta etapa de análise.  
2. Não reescrever o app / redesign visual gratuito.  
3. Não chatbot-first, CTF platform, SaaS, auto-hack.  
4. Não substituir Kali/Burp.  
5. Não comandos nem **tools** como eixo do conhecimento.  
6. Smoke ≠ Content QA.  
7. Não inventar cobertura; se não ver: **“não verificado nos arquivos.”**  
8. Árvore central; KB alimenta a árvore.  
9. WebSec = profundidade máxima (qualidade); Foundations = first-class (não mesma profundidade).  
10. Pentest autorizado / estudo controlado — não “zerar máquina”.  
11. Criticar ideias ruins do brief.  
12. Corpus atual (~62 nós) = auditar/reorganizar, **não** expandir por checklist.

### Pergunta central

> O Phantonite ajuda o pentester a **pensar melhor** ou só diz **qual comando / ferramenta executar**?

---

## Estado do repo (atualizar se mudar)

```text
Playbook efetivo: v2.1.0 (playbook-extra)
Smoke: ~62 nós · ~320 choices · 0 broken · 0 orphans
Stack: index.html + guide.html + js/guide.js + data/playbook*.js
Engine field: hydrate, copy, exports, trail, params, ports, minimap, notes, shortcuts, RoE
Fases: docs/fases/README.md
```

Ler no mínimo: `README.md`, `ROADMAP.md`, `docs/fases/*`, `index.html`, `guide.html`, `js/guide.js`, `js/den.js`, `data/playbook.js`, `data/playbook-extra.js`, `css/hunter.css`, `scripts/smoke-playbook.js`.

---

## Entregáveis (nessa ordem — sem codar)

1. Veredito — hoje vs deve se tornar  
2. Gap analysis (tabela)  
3. Crítica da arquitetura (Node, escala, entidades, Study/Field, Finding)  
4. Crítica do conteúdo (thin / tool-first / gaps — só verificado)  
5. Arquitetura proposta (entidades, relações, navegação iterativa)  
6. Roadmap revisado  
7. Top 15 mudanças  
8. O que NÃO fazer  
9. Primeiro ciclo (menor conjunto; **ainda sem implementar**)

Comece pelo veredito.

---

## Bloco final — complemento arquitetural (avaliar, não implementar)

### Knowledge Graph = conceitual

“Knowledge Graph” **não** significa graph DB, backend ou motor de relacionamentos complexo.  
Nesta fase: **modelo conceitual de relações**, compatível com app **estático / local-first / sem backend obrigatório**. Sem overengineering.

### Vulnerability ≠ Finding

```text
SQL Injection                    → Vulnerability / Condition (conhecimento)
SQLi em /api/users?id= no eng. X → Finding (ocorrência documentável)
Burp / sqlmap / curl             → Tool
Testar IDOR/BOLA                 → Technique
```

### Asset / Attack Surface / Observation

Avalie se o modelo precisa de (formais, metadados ou só navegação):

```text
Asset → Attack Surface → Observation/Signal → Hypothesis
  → Technique → Validation → Evidence → Finding
  → Impact → Remediation → Retest
```

Exemplos WebSec de surface: domain, app, API, endpoint, param, cookie, auth mechanism, upload, cloud service.  
**Não implemente automaticamente** — diga se deve ser entidade, metadado ou só checklist mental.

### Critério anti-superficial

Uma entry boa responde: o que estou vendo? o que significa? por que importa? hipótese? o que testar? como validar? evidência? quando vira Finding? impacto? remediação? retest?  
Se só responde “rode este comando” → tool-first / raso.

### Ciclo profissional (raciocínio, não UI rígida)

```text
Observe → Understand → Hypothesize → Test → Validate
  → Evidence → Finding → Remediation → Retest
```

Reentrada permitida. Fase 4 do roadmap = UI/export; o **conceito** Finding/Remediation/Retest já existe aqui.
