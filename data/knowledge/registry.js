/**
 * Phantonite HUB — Knowledge registry (Fase 1)
 * Contrato: data/knowledge/schema.md
 * Estático. Sem graph DB.
 * Prompt 02: pilotos ssrf | jwt-attacks | sqli
 * Foundations stubs (http, auth, …) → prompt 03
 */

window.HUNTER_KNOWLEDGE = {
  meta: {
    name: "Phantonite Knowledge",
    version: "0.3.0",
    updated: "2026-08-28",
  },

  entries: {
    /* ——— FOUNDATIONS (stubs · prompt 03) ——— */

    http: {
      id: "http",
      kind: "concept",
      title: "HTTP",
      domain: "foundations",
      freshness: "current",
      study: {
        summary:
          "HTTP é o protocolo de requisição/resposta da web: método, URL, headers, body, status. Cookies, cache, redirects e encoding moldam o que o browser e o servidor interpretam. No pentest, quase toda superfície web é observação e manipulação de mensagens HTTP.",
        whenToLook: "Sempre que houver app web/API — é o transporte base.",
      },
      field: {
        observe: "Método, path, query, headers (Cookie, Authorization, Host), body, status e redirects.",
        hypotheses: [
          "Parâmetros em query/body/header controlam comportamento server-side.",
          "Headers (Host, X-Forwarded-*) influenciam roteamento ou cache.",
          "Diferença GET vs POST vs método alternativo muda o sink.",
        ],
        tests: [
          "Inventariar requests no proxy (Burp history).",
          "Mudar um elemento por vez (param, header, método).",
          "Seguir redirects e ver se o destino/state muda.",
        ],
        tools: ["Burp Suite", "curl", "browser DevTools"],
      },
      related: [
        { id: "ssrf", rel: "see-also" },
        { id: "sqli", rel: "see-also" },
        { id: "jwt-attacks", rel: "see-also" },
        { id: "trust-boundaries", rel: "see-also" },
      ],
    },

    authentication: {
      id: "authentication",
      kind: "concept",
      title: "Authentication (AuthN)",
      domain: "foundations",
      freshness: "current",
      study: {
        summary:
          "Autenticação responde ‘quem é você?’: prova de identidade (senha, OTP, federação, certificado). Sessões e tokens são o resultado típico. No pentest, AuthN fraca vira account takeover; AuthN forte mal ligada à AuthZ ainda deixa buracos.",
        whenToLook: "Login, registro, reset, SSO/OAuth, MFA, APIs com Bearer/API key.",
      },
      field: {
        observe: "Fluxo de login; onde a sessão/token nasce; mensagens de erro; MFA; logout.",
        hypotheses: [
          "Credencial ou token pode ser previsível, reutilizável ou forjável.",
          "Enumera users via erro/timing.",
          "Logout não invalida o artefato de sessão.",
        ],
        tests: [
          "Mapear artefato pós-login (cookie vs JWT vs API key).",
          "Testar reset/recover e lockout (com RoE).",
          "Ver se token roubado ainda funciona após logout.",
        ],
        tools: ["Burp Suite", "browser"],
      },
      related: [
        { id: "jwt-attacks", rel: "see-also" },
        { id: "authorization", rel: "see-also" },
        { id: "http", rel: "foundational" },
      ],
    },

    authorization: {
      id: "authorization",
      kind: "concept",
      title: "Authorization (AuthZ)",
      domain: "foundations",
      freshness: "current",
      study: {
        summary:
          "Autorização responde ‘o que você pode fazer?’ sobre objetos e funções. Falhas clássicas: IDOR/BOLA, escalação vertical, trust em claims do cliente. No pentest moderno (APIs), AuthZ costuma valer mais que ‘achar XSS’.",
        whenToLook: "Recursos por id, painéis admin, multi-tenant, roles, APIs object-level.",
      },
      field: {
        observe: "IDs em path/body; roles no JWT/UI; endpoints admin; respostas 403 vs 404 vs 200.",
        hypotheses: [
          "Trocar o id acessa objeto de outro usuário (horizontal).",
          "User low-priv alcança função admin (vertical).",
          "AuthZ só no front — API aceita direto.",
        ],
        tests: [
          "Duas contas: repetir request da A com sessão da B trocando object id.",
          "Chamar endpoints admin com user comum.",
          "Remover/alterar claims de role e ver se o server revalida.",
        ],
        tools: ["Burp Suite", "ffuf (ids)", "duas sessões de teste"],
      },
      related: [
        { id: "jwt-attacks", rel: "see-also" },
        { id: "sqli", rel: "see-also" },
        { id: "authentication", rel: "see-also" },
      ],
    },

    cryptography: {
      id: "cryptography",
      kind: "concept",
      title: "Cryptography (mindset pentest)",
      domain: "foundations",
      freshness: "educational",
      study: {
        summary:
          "No pentest web, crypto aparece como integridade e autenticidade (HMAC, assinaturas RSA/ECDSA), não como ‘quebrar AES’. JWT e cookies assinados dependem de algoritmo certo, chave secreta e verificação real. Hash ≠ encryption; Base64 ≠ crypto.",
        whenToLook: "JWT, signed cookies, password storage, TLS issues, ‘encrypted’ params que só estão encoded.",
      },
      field: {
        observe: "alg no JWT; menção a HMAC/RSA; segredos em client; tokens ‘encrypted’ que decodificam fácil.",
        hypotheses: [
          "Assinatura não é verificada ou secret é fraco (HS*).",
          "Confusão de algoritmo (RS public key usada como HS secret).",
          "Dado sensível só ofuscado (Base64), não cifrado.",
        ],
        tests: [
          "Separar encoding vs crypto vs hashing.",
          "Verificar se tamper + signature inválida é rejeitado.",
          "Não ‘atacar RSA’ — atacar validação e key management.",
        ],
        tools: ["jwt_tool", "CyberChef", "Burp"],
      },
      related: [
        { id: "jwt-attacks", rel: "see-also" },
        { id: "authentication", rel: "see-also" },
      ],
    },

    databases: {
      id: "databases",
      kind: "concept",
      title: "Databases & SQL (mindset)",
      domain: "foundations",
      freshness: "current",
      study: {
        summary:
          "Bancos guardam estado da aplicação. SQL descreve consultas; a app não deve deixar o usuário escrever a consulta. Entender sinks (WHERE, ORDER BY, identifiers) e privilégios da conta da app explica o impacto de SQLi e de leaks via erros.",
        whenToLook: "Qualquer dado persistido, filtros, login, relatórios, ORMs com raw SQL.",
      },
      field: {
        observe: "Erros de SQL; latência em queries; parâmetros que cheiram a filtro/id/sort.",
        hypotheses: [
          "Input entra na query sem binding.",
          "Conta do DB tem privilégio alto demais.",
          "Erro verboso vaza schema/versão.",
        ],
        tests: [
          "Tratar cada param suspeito como possível sink.",
          "Prova mínima de injeção antes de tooling pesado.",
          "Avaliar impacto pelo que a role do DB permite.",
        ],
        tools: ["Burp", "sqlmap (assistido)", "docs do SGBD"],
      },
      related: [
        { id: "sqli", rel: "see-also" },
        { id: "trust-boundaries", rel: "see-also" },
      ],
    },

    "trust-boundaries": {
      id: "trust-boundaries",
      kind: "concept",
      title: "Trust boundaries",
      domain: "foundations",
      freshness: "educational",
      study: {
        summary:
          "Trust boundary é onde dado ou controle passa de um lado ‘menos confiável’ para outro ‘mais confiável’ (browser→app, app→DB, app→rede interna, user A→objeto de B). Vulnerabilidades exploram validação fraca nessas fronteiras.",
        whenToLook: "Todo input externo; toda chamada server-side; toda checagem de AuthZ; SSRF, SQLi, upload, desserialização.",
      },
      field: {
        observe: "O que o usuário controla vs o que o servidor assume seguro.",
        hypotheses: [
          "O servidor confia em dado que atravessou a boundary sem revalidar.",
          "Um componente interno é tratado como trusted network.",
        ],
        tests: [
          "Marcar mentalmente: client → app → DB / HTTP client → rede.",
          "Perguntar: quem valida de novo do outro lado?",
          "Priorizar testes onde a boundary é cruzada com input rico (URL, SQL, template, file).",
        ],
        tools: ["mapa mental / notas", "Burp (ver o que realmente chega)"],
      },
      related: [
        { id: "ssrf", rel: "see-also" },
        { id: "sqli", rel: "see-also" },
        { id: "http", rel: "see-also" },
      ],
    },

    "cloud-metadata": {
      id: "cloud-metadata",
      kind: "concept",
      title: "Cloud metadata services",
      domain: "cloud",
      freshness: "current",
      study: {
        summary:
          "Instâncias cloud expõem serviços de metadata no link-local (ex.: 169.254.169.254) com credenciais/role temporárias. Em SSRF, alcançar metadata pode virar acesso à cloud. É superfície especializada, não ‘mais uma URL’.",
        whenToLook: "SSRF confirmado ou suspeito em app hospedada em AWS/GCP/Azure.",
      },
      field: {
        observe: "App em cloud; SSRF com hit OOB; headers/imprints de cloud no stack.",
        hypotheses: [
          "O fetch server-side alcança o endpoint de metadata.",
          "IMDSv1 (ou equivalente) ainda responde sem hop limit.",
        ],
        tests: [
          "Só com RoE claro — metadata pode ser credencial real.",
          "Testar paths conhecidos do provedor após SSRF baseline.",
          "Tratar qualquer token obtido como evidência crítica e rotacionável.",
        ],
        tools: ["Burp", "curl via SSRF", "docs do provedor"],
      },
      related: [
        { id: "ssrf", rel: "see-also" },
        { id: "trust-boundaries", rel: "foundational" },
      ],
    },

    /* ——— WEBSEC PILOTS (prompt 02) ——— */

    ssrf: {
      id: "ssrf",
      kind: "technique",
      title: "SSRF — Server-Side Request Forgery",
      domain: "websec",
      freshness: "current",
      study: {
        summary:
          "SSRF ocorre quando a aplicação inicia requisições HTTP(S) (ou outros esquemas) a partir do servidor usando um alvo controlável pelo usuário. O atacante não fala com o recurso interno direto: o servidor age como proxy involuntário.",
        whenToLook:
          "Qualquer feature que aceite URL, hostname, webhook, import de feed, preview de link, PDF/HTML remoto, avatar por URL, health-check, proxy, ‘fetch URL’, integrações cloud, ou callbacks.",
        howItWorks:
          "O input vira destino (ou parte dele) de um cliente HTTP no backend. Controles fracos (blocklist de IP, só http/https, redirect follow) falham contra DNS rebinding, redirects, IPv6, decimal IP, ou hostnames internos. O impacto depende do que a rede do servidor alcança (metadata cloud, admin panels, file://, gopher, etc.).",
        limitations:
          "Nem todo ‘fetch’ é SSRF explorável: allowlist rígida de hosts, negação de redirects, e resolução DNS fixa reduzem. Blind SSRF exige canal OOB. Achado sem prova de acesso a recurso não autorizado fica só como hipótese.",
        prerequisites: ["http", "trust-boundaries"],
        references: [
          "https://owasp.org/www-community/attacks/Server_Side_Request_Forgery",
          "https://portswigger.net/web-security/ssrf",
          "https://owasp.org/API-Security/editions/2023/en/0xa10-unsafe-consumption-of-apis/",
        ],
      },
      field: {
        observe:
          "Parâmetro/body com URL; feature ‘import/preview/webhook’; resposta ou tempo muda conforme host; erros de conexão vazando IPs internos; headers refletindo fetch server-side.",
        hypotheses: [
          "O servidor busca a URL que eu controlaria.",
          "Redirects ou DNS permitem sair da allowlist aparente.",
          "Há alcance a 127.0.0.1, RFC1918 ou metadata cloud (169.254.169.254 / equivalentes).",
          "Esquemas além de https (file, gopher, dict) são aceitos.",
        ],
        tests: [
          "Mapear todos os inputs que aceitam URL/host.",
          "Baseline: URL externa controlada (Burp Collaborator / interactsh / servidor seu) e ver se há hit.",
          "Variar loopback e privados: 127.0.0.1, localhost, 0.0.0.0, ::1, 10/8, 172.16/12, 192.168/16.",
          "Testar bypass clássicos só como hipótese (decimal, IPv6, DNS para IP interno, redirect 302).",
          "Se cloud: metadata endpoints relevantes ao provedor (com RoE).",
          "Registrar o que mudou: status, body, timing, DNS hit — sem assumir RCE.",
        ],
        tools: ["Burp Suite", "curl", "interactsh / Collaborator", "ffuf (fuzz de path metadata)"],
        commands: [
          `curl -s -X POST "$TARGET/endpoint" -H "Content-Type: application/json" -d '{"url":"http://SEU_OOB/ssrf"}'`,
          `curl -s "$TARGET/proxy?url=http://127.0.0.1:80/"`,
        ],
        validate:
          "Prova mínima: o servidor gerou tráfego para um destino que o cliente não alcançaria do mesmo jeito, ou retornou conteúdo de recurso interno/metadata. Timing-only sem OOB = evidência fraca.",
        evidence:
          "Request/response raw; hit OOB (screenshot/log); se interno: trecho da resposta (redacted) + mapeamento do destino. Deixar claro o asset (endpoint/param).",
        impact:
          "De info leak (port scan interno, cloud creds) até movimento lateral e, em casos extremos, RCE via serviços internos. Impacto = o que aquele servidor enxerga na rede.",
        remediation:
          "Allowlist de destinos; bloqueio de ranges privados/metadata; não seguir redirects para fora da allowlist; autenticação em URLs internas; network egress controls; validar e parser URL de forma strict.",
        retest:
          "Repetir OOB + tentativa a metadata/loopback após o fix; confirmar allowlist e política de redirect.",
      },
      related: [
        { id: "http", rel: "foundational" },
        { id: "trust-boundaries", rel: "foundational" },
        { id: "cloud-metadata", rel: "see-also" },
      ],
    },

    "jwt-attacks": {
      id: "jwt-attacks",
      kind: "technique",
      title: "JWT — abusos de autenticação/autorização",
      domain: "websec",
      freshness: "current",
      study: {
        summary:
          "JSON Web Tokens carregam claims (identidade, roles, expiry) e uma assinatura. Falhas surgem quando o servidor confia em claims sem validar assinatura/algoritmo/issuer/audience, ou quando a chave é fraca/exposta. O token é um artefato de sessão — não ‘criptografia mágica’.",
        whenToLook:
          "APIs e SPAs com Authorization: Bearer, cookies com JWT, mobile apps, microserviços com auth gateway, ‘login retorna access_token/id_token’.",
        howItWorks:
          "Header.payload.signature (Base64url). alg define verificação (HS256 chave simétrica, RS256/ES256 assimétrica). Ataques clássicos: alg=none, confusão RS→HS com chave pública, kid/jku apontando para chave controlada, brute de secret HMAC fraco, tamper de claims (sub/role/admin) se a assinatura não for checada de verdade.",
        limitations:
          "JWT bem validado (alg allowlist, key management, exp/nbf, aud/iss) não é vulnerável só por ser JWT. Roubo de token (XSS, log) é problema de sessão/armazenamento, não de ‘quebra de alg’.",
        prerequisites: ["authentication", "authorization", "cryptography", "http"],
        references: [
          "https://datatracker.ietf.org/doc/html/rfc7519",
          "https://portswigger.net/web-security/jwt",
          "https://owasp.org/www-community/vulnerabilities/JSON_Web_Token_(JWT)_Cheat_Sheet_for_Java",
          "https://jwt.io/introduction",
        ],
      },
      field: {
        observe:
          "Bearer JWT no header/cookie/localStorage; três partes Base64; claims visíveis no payload; erros ‘invalid signature’ vs aceite silencioso; refresh tokens.",
        hypotheses: [
          "Assinatura não é verificada (ou alg=none aceito).",
          "Secret HMAC é fraco / previsível.",
          "Claims de autorização (role, admin, scope) são confiadas sem binding server-side.",
          "kid/jku/x5u permite chave controlada pelo atacante.",
          "Token de um contexto (aud/iss) é aceito em outro.",
        ],
        tests: [
          "Decodificar header/payload; inventariar claims e alg.",
          "Replay com claim alterada (sub/role) mantendo signature — se aceitar, validação quebrada.",
          "Testar alg=none e remoção de signature (só se RoE permitir e ambiente controlado).",
          "Se HS*: avaliar força do secret (wordlist) com ferramenta adequada — cuidado com rate/lockout.",
          "Mapear onde o token é armazenado (XSS → roubo) e se HttpOnly/Secure/SameSite aplicam a cookies.",
          "Verificar expiração real (exp) e logout (token ainda válido?).",
        ],
        tools: ["Burp Suite (JWT Editor / Repeater)", "jwt_tool", "jq / cyberchef", "hashcat (se secret cracking autorizado)"],
        commands: [
          `# decodifica payload (sem verificar assinatura)
echo "$JWT" | cut -d. -f2 | tr '_-' '/+' | base64 -d 2>/dev/null; echo`,
        ],
        validate:
          "Prova: ação autenticada/autorizada que não deveria ser possível com o token original — ex.: acessar recurso de outro sub, elevar role, ou autenticar com token forjado. Documentar before/after.",
        evidence:
          "JWT original vs modificado (redact secrets); requests que demonstram o bypass; claims relevantes. Separar ‘token roubado via XSS’ (finding de sessão) de ‘assinatura quebrada’.",
        impact:
          "Account takeover, escalação de privilégio, impersonação cross-tenant — conforme o que as claims controlam.",
        remediation:
          "Allowlist de alg; nunca confiar em alg do header às cegas; chaves fortes e rotação; validar iss/aud/exp; autorização server-side por objeto, não só ‘admin=true’ no JWT; armazenamento seguro do token.",
        retest:
          "Repetir tamper de claims + alg confusion após o patch; confirmar rejeição e logs.",
      },
      related: [
        { id: "authentication", rel: "foundational" },
        { id: "authorization", rel: "foundational" },
        { id: "cryptography", rel: "foundational" },
        { id: "http", rel: "see-also" },
      ],
    },

    sqli: {
      id: "sqli",
      kind: "technique",
      title: "SQL Injection",
      domain: "websec",
      freshness: "current",
      study: {
        summary:
          "SQL Injection é a quebra da fronteira entre dado e instrução SQL: input do usuário passa a alterar a estrutura da query. Continua atual em apps legadas, queries dinâmicas, ORMs mal usados, procedures e APIs que concatenam SQL.",
        whenToLook:
          "Login, busca, filtros, sort, id em path/query, relatórios, imports, qualquer parâmetro que cheire a ir para o banco. Também second-order (dado guardado e reutilizado em query depois).",
        howItWorks:
          "Concatenação/string building ou escape incorreto. Boolean/time/error-based e UNION extraem ou alteram dados. Em alguns stacks há stacked queries / RCE via DB — depende do SGBD e permissões. ORM ≠ imunidade (raw queries, order by dinâmico).",
        limitations:
          "WAF e parameterized queries bem feitos reduzem. Nem todo erro 500 é SQLi. Exfiltração massiva pode violar RoE — preferir prova mínima.",
        prerequisites: ["databases", "trust-boundaries", "http"],
        references: [
          "https://owasp.org/www-community/attacks/SQL_Injection",
          "https://portswigger.net/web-security/sql-injection",
          "https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html",
        ],
      },
      field: {
        observe:
          "Parâmetros em listagens/login; erros SQL vazando; comportamento diferente com ' \" ; -- ; latência em SLEEP/BENCHMARK; ranking/sort suspeito.",
        hypotheses: [
          "O valor entra na query sem parameter binding.",
          "É string (aspas) vs número (sem aspas) — muda o payload.",
          "Há blind boolean ou time-based.",
          "ORDER BY / LIMIT dinâmicos também concatenam.",
          "Second-order: o sink não é o mesmo request do source.",
        ],
        tests: [
          "Baseline estável do request (Burp).",
          "Sondas mínimas: ' \" ; -- /* e observar erro/diff (não dump).",
          "Confirmar injeção com boolean ou time controlado (impacto baixo).",
          "Se UNION: enumerar colunas com cuidado; extrair só o necessário pra prova (ex.: versão DB / user atual).",
          "Mapear sink (qual param). Testar authz: SQLi que lê outro tenant = impacto maior.",
          "sqlmap só depois do ponto confirmado manualmente e com escopo/rate alinhados ao RoE.",
        ],
        tools: ["Burp Suite", "curl", "sqlmap (assistido)", "logging do app (se disponível no engajamento)"],
        commands: [
          `curl -s -G "$TARGET/items" --data-urlencode "id=1"`,
          `# após confirmar o ponto no Burp, salvar request:
# sqlmap -r requests/sqli.req --batch -p id`,
        ],
        validate:
          "Prova: diferença determinística controlada (boolean/time) ou dado que só o DB conheceria (versão, user DB) sem autorização legítima. Não confundir WAF block com ‘não vulnerável’.",
        evidence:
          "Raw request/response; descrição do sink; resultado mínimo (ex.: string de versão). Marcar se foi só detection ou também leitura de dados sensíveis.",
        impact:
          "Leitura/alteração/deleção de dados, bypass de auth, em pior caso RCE via DB — conforme privilégios da conta da aplicação.",
        remediation:
          "Queries parametrizadas / prepared statements em todo sink; evitar SQL dinâmico em identifiers (whitelist de colunas); least privilege no DB; WAF como defesa em profundidade, não única.",
        retest:
          "Repetir sonda no mesmo sink + regressão em params vizinhos; confirmar prepared statements no código se o cliente fornecer.",
      },
      related: [
        { id: "databases", rel: "foundational" },
        { id: "trust-boundaries", rel: "foundational" },
        { id: "http", rel: "see-also" },
        { id: "authorization", rel: "see-also" },
      ],
    },
  },
};
