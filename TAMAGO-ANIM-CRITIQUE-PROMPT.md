# PHANTONITE HUB — Prompt V4 · Briefing técnico pro Cursor (Paste flexível + Copiloto mínimo)

> Cole este arquivo no **Claude**.  
> Job do Claude: **fazer o trabalho de especificação** que o dono não quer/faz mal — outputs Kali realistas, contratos, respostas a dúvidas, desenho provider-agnostic.  
> O resultado deste chat Claude será colado de volta no **Cursor (Grok)** para implementar.  
>
> ### Freeze neste chat Claude
> **Não peça ao dono para colar outputs reais do lab.** Invente/reproduza outputs **realistas** de Kali/THM (gobuster, nmap, curl, hydra, sqlmap, evil-winrm, etc.) como fixtures.  
> **Não escreva o código da app** aqui (pode esboçar JSON/schemas/prompts de sistema).  
> Seja concreto, opinativo e completo — o Cursor não deve ficar com “perguntas em aberto”.

---

## Quem é quem

| Papel | Função |
|-------|--------|
| **Dono** | Pentester; lab amanhã; quer paste flexível + copiloto que **ajuda a escolher caminho** com confirmação |
| **Claude (tu)** | Especialista: gera fixtures Kali, fecha decisões de produto/técnicas, entrega spec implementável |
| **Cursor** | Implementa no repo `jornada-hunter` depois, usando **só** o que tu entregares |

---

## Decisões já travadas (não reabrir sem argumento forte)

1. **L hoje** = error-map RegExp (Fase 2) — manter como 1ª linha.  
2. **Não** inflar regex pra gobuster/nmap/enum (2.5 “popular error-map” adiada).  
3. **Híbrido:** regex casa → UI atual; **não casa** → botão explícito **“Analisar com IA”** (nunca auto).  
4. Mesma UI de confirmação (top 3 + **Ir →**); sem chat persistente; sem auto-goto; sem tool-calling neste MVP.  
5. Modelo pode sugerir `{ hipótese, nós, params }` — humano confirma.  
6. **Só sugerir `nodeId` que existe** na árvore; se não houver ramo, genérico mais próximo + aviso (nunca inventar nó).  
7. Mapa de portas = jump determinístico por porta/serviço; copiloto **pode sugerir** `TARGET`/`RPORT`/etc. com confirm.  
8. App local-first / estático o máximo possível; sem graph DB / SaaS.

### Preferências de modelo (dono + Cursor — tu detalhas a spec)

- **Ollama local primeiro** (lab / VPN / offline).  
- **API key opcional** em Params como escape (OpenAI-compatible ou similar).  
- Desenho **provider-agnostic:** `baseUrl` + `model` (+ key se remoto).

---

## Estado do produto (resumo)

- Stack: `guide.html`, `js/guide.js`, `data/playbook*.js`, `data/error-map.js`, `data/knowledge/*`  
- ~62 nós; KB wired: `web-ssrf`, `web-jwt`, `web-sqli`  
- Paste: `L` / PASTE.LOG · `matchOutput` · ADR-002  
- Ports: search + cards  
- Docs: `docs/fases/`, `docs/ADR-002-paste-jump.md`, `ROADMAP.md`  
- Norte copiloto: ajudar caminho + params/`goto` com confirmação — **não** decidir sozinho  

Caso canónico que regex falhou (enum, não erro):

```text
gobuster dir → path "console" (Status: 400) [Size: 167] em http://IP:5002
```

Interpretação desejada: sinal ≠ 404 → investigar `/console`, ajustar TARGET:5002, sugerir ramo web/burp — não “nenhum padrão” sem saída.

---

## O que o Cursor precisa de ti (entregáveis obrigatórios)

Produz **nesta ordem**, em Markdown limpo, copy-paste friendly.

### 1. Veredito curto (5 linhas)
Confirma o híbrido e o que o MVP resolve / não resolve.

### 2. Fixture pack — outputs Kali (o mais importante)
Cria **12–20 fixtures** realistas. Para **cada** uma:

| Campo | Conteúdo |
|-------|----------|
| `id` | slug |
| `kind` | `error` \| `enum` \| `auth` \| `mixed` |
| `tool` | gobuster, nmap, curl, … |
| `raw` | bloco de texto multilinha **como no terminal** |
| `expect_regex` | `hit` \| `miss` (se a 1ª linha error-map provavelmente casa ou não) |
| `expect_ai` | hipótese 1 frase + até 3 `nodeId` **plausíveis** da árvore Phantonite + params sugeridos (`TARGET`, `RPORT`, `IP`, …) |
| `notes` | por que isso importa em lab |

**Obrigatório incluir pelo menos:**
- gobuster com path interessante (400/301/403) — variante do caso real  
- nmap `-sV` com várias portas (incluir Tomcat/http em porta não óbvia, ex. 1234 ou 8080)  
- curl `-v` / `-I` 401 e 403  
- connection refused / timed out  
- sqlmap WAF / “not injectable”  
- hydra fail / lockout-ish  
- SMB `NT_STATUS_*`  
- Kerberos skew  
- evil-winrm auth error  
- JWT / Bearer snipped em response ou decode  
- 1 output “ruído” (banner inútil) onde a IA deve dizer “pouco sinal — fica no path / mapa de portas”

Lista de `nodeId` existentes (usar só estes em `expect_ai`):  
`roe`, `session`, `alive`, `dead-target`, `trio`, `ports`, `passive`, `web`, `web-auth`, `web-api`, `web-graphql`, `web-jwt`, `web-oauth`, `web-sqli`, `web-xss`, `web-lfi`, `web-cmdi`, `web-upload`, `web-ssrf`, `web-xxe`, `web-ssti`, `web-deserial`, `web-cache`, `wordpress`, `jenkins`, `tomcat`, `nuclei`, `burp-method`, `msf`, `smb`, `nxc-smb`, `ldap`, `kerberos`, `winrm`, `ad-attack`, `crack-hash`, `ssh`, `ftp`, `rdp`, `nfs`, `snmp`, `smtp`, `dns-axfr`, `mysql`, `mssql`, `postgres`, `redis`, `mongodb`, `elasticsearch`, `aws-metadata`, `k8s-exposed`, `android-apk`, `shell`, `report`, `file-xfer`, `lateral`, `privesc-linux`, `privesc-windows`, `responder`, `ntlm-relay`, …

Se um nó não existir na lista acima, **não inventes** — escolhe o mais próximo e marca aviso.

### 3. Contrato do paste híbrido (spec)
Fluxo exacto UI + estados:

```text
colar → Analisar (regex) → hit | miss
miss → [Analisar com IA] → loading → top 3 + hipótese + params sugeridos → confirm
```

Define labels PT-BR, empty states, erros (Ollama down, timeout, JSON inválido).

### 4. Contrato do LLM (provider-agnostic)
Especifica:

- Campos Params: `llm_base_url`, `llm_model`, `llm_api_key` (opcional), defaults Ollama (`http://127.0.0.1:11434`, model sugerido)  
- Endpoint shape (OpenAI-compatible `/v1/chat/completions` se possível — justifica)  
- **System prompt** completo (PT ou EN — o que performar melhor; justifica)  
- **User payload** template (texto colado + allowlist de nós + params atuais)  
- **JSON schema** de resposta estrito (campos, tipos, max 3 suggestions)  
- Regras: só `nodeId` allowlisted; params só chaves conhecidas do HUB; 1 hipótese curta; sem markdown na resposta se JSON puro  
- Timeout, retries, tamanho máx do paste (chars)  
- Como validar/parsear resposta no cliente (rejeitar nó fantasma)

### 5. Resposta a todas as dúvidas do Cursor (secção Q&A)
Responde **explicitamente** (não deixes TBD):

1. Ollama-first vs API: defaults, UX se Ollama offline, quando mostrar campo API key.  
2. Nó sugerido inexistente: comportamento exacto.  
3. Log de pastes miss: no MVP sim/não; se sim, onde (localStorage?) e privacidade.  
4. Provider: lista mínima de campos + exemplo config Ollama + exemplo API.  
5. Params vs goto: como a UI confirma `set_params` vs `go(node)` (um botão ou dois passos).  
6. Contexto enviado ao modelo: incluir ou não Study/Field KB? trail? notes? (mínimo viável).  
7. Segurança: RoE — o modelo não deve incentivar DoS/fora de escopo; como no system prompt.  
8. Latência lab: expectativa UX (skeleton, cancelar).  
9. Testes: como o Cursor valida sem GPU (fixtures + mock fetch).  
10. O que fica **explicitamente fora** do MVP (chat, memory, tools, Fase 4).

### 6. Prompt de sistema + 3 few-shots
- 1 system prompt final  
- 3 exemplos (user → assistant JSON): (a) gobuster 400, (b) connection refused, (c) nmap tomcat porta atípica  

Os few-shots devem usar `nodeId` reais e JSON válido.

### 7. Plano de implementação pro Cursor (checklist ordenado)
Ficheiros prováveis a tocar (`guide.html`, `guide.js`, `hunter.css`, Params, talvez `data/llm-prompt.js` ou similar).  
Sem código completo — só checklist com critérios de done.

### 8. Critérios de aceite do MVP
Lista checkbox: ex. “gobuster fixture → Analisar com IA → sugere web + TARGET com :5002 → Ir confirma”.

### 9. O que NÃO fazer (lista curta agressiva)

---

## Regras para o Claude

- Sê **mais específico que o dono**; preenche gaps com julgamento de pentest júnior–pleno em lab.  
- Prefere **fixtures ricos** a teoria.  
- Flexibilidade do L = **interpretação via LLM no miss**, não regex criativa.  
- Critica o brief se algo for inconsistente.  
- Não proponhas Neo4j, microserviços, mobile app.  
- Output final deve ser **auto-contido**: o Cursor implementa sem nova ronda de perguntas ao dono.

---

## Arranque

Começa pelo **§1 Veredito** e segue a ordem dos entregáveis até ao §9.  
No fim: uma linha — “Spec pronta para o Cursor implementar o MVP híbrido.”
