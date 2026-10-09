/**
 * Phantonite HUB — error-map (paste → jump)
 *
 * Como adicionar regra:
 * 1. `id` único (kebab-case)
 * 2. `patterns`: RegExp[] — qualquer um que case = hit
 * 3. `to`: nodeId existente no playbook, ou `null` (só hint, sem goto)
 * 4. `hint`: uma linha para a UI
 * 5. `priority`: maior vence; empate → `id` asc; UI mostra top 3 (dedup por `to`)
 *
 * ADR: docs/ADR-002-paste-jump.md
 * Load: guide.html → data/error-map.js
 * Test: node scripts/test-error-map.js
 */
window.HUNTER_ERROR_MAP = {
  meta: {
    version: "0.3.0",
    name: "Phantonite error-map",
  },
  rules: [
    /* ——— reachability / setup (alto) ——— */
    {
      id: "conn-refused",
      patterns: [/connection refused/i, /ECONNREFUSED/],
      to: "alive",
      hint: "Nada escuta nesse host:porta — confirma IP/porta/VPN antes de scan pesado.",
      priority: 20,
    },
    {
      id: "no-route",
      patterns: [/No route to host/i, /Network is unreachable/i, /ENETUNREACH/],
      to: "alive",
      hint: "Rota/VPN morta — checa tun0, IP e se o alvo está no escopo alcançável.",
      priority: 20,
    },
    {
      id: "hydra-lockout",
      patterns: [
        /account locked/i,
        /too many (login )?attempts/i,
        /\blockout\b/i,
        /Login incorrect \(hydra/i,
      ],
      to: "roe",
      hint: "Sinal de lockout — para o spray. Revisa RoE/rate antes de voltar a auth.",
      priority: 19,
    },
    {
      id: "name-resolve",
      patterns: [
        /Name or service not known/i,
        /Temporary failure in name resolution/i,
        /nodename nor servname provided/i,
        /getaddrinfo failed/i,
        /Could not resolve host/i,
      ],
      to: "session",
      hint: "DNS/nome não resolve — confere DOMAIN/TARGET nos params ou usa IP.",
      priority: 18,
    },
    {
      id: "dead-host",
      patterns: [/Host seems down/i, /0 hosts up/i, /Note: Host seems down/i],
      to: "dead-target",
      hint: "Nmap acha host down — confirma alive/VPN; não insiste no quarteto no escuro.",
      priority: 18,
    },

    /* ——— WebSec específico (bate timeout genérico) ——— */
    {
      id: "sql-error",
      patterns: [
        /You have an error in your SQL syntax/i,
        /SQL syntax.*MySQL/i,
        /Unclosed quotation mark after the character string/i,
        /ORA-\d{5}/,
        /sqlmapidentified/i,
        /sqlmap\.org/i,
      ],
      to: "web-sqli",
      hint: "Cheiro de SQLi — confirma manual no Burp antes de sqlmap agressivo.",
      priority: 18,
    },
    {
      id: "jwt-invalid",
      patterns: [
        /invalid signature/i,
        /jwt\.exceptions/i,
        /Invalid JWT/i,
        /\balg\b.*\bnone\b/i,
        /JWTDecodeError/i,
      ],
      to: "web-jwt",
      hint: "JWT/assinatura — decodifica header/claims e testa no ramo jwt-attacks.",
      priority: 17,
    },
    {
      id: "lfi-path",
      patterns: [
        /failed to open stream/i,
        /No such file or directory in/i,
        /etc\/passwd/i,
        /include\(_once\)?/i,
        /Warning:.*\.\.\/\.\.\//i,
      ],
      to: "web-lfi",
      hint: "Path/include — candidato a LFI. Prova mínima sem dump massivo.",
      priority: 17,
    },
    {
      id: "ssrf-metadata",
      patterns: [
        /169\.254\.169\.254/,
        /metadata\.google\.internal/i,
        /latest\/meta-data/i,
      ],
      to: "web-ssrf",
      hint: "Metadata/cloud no output — trata como SSRF/cloud; RoE antes de exfil.",
      priority: 17,
    },
    {
      id: "smb-signing",
      patterns: [
        /SMB.*signing.*(required|enabled)/i,
        /message.?signing.*(enabled|required)/i,
        /signing enabled/i,
      ],
      to: "smb",
      hint: "SMB signing on — relay fica difícil. Enum shares/users; não force ntlm-relay cego.",
      priority: 18,
    },
    {
      id: "smb-status",
      patterns: [
        /STATUS_LOGON_FAILURE/i,
        /STATUS_ACCESS_DENIED/i,
        /NT_STATUS_LOGON_FAILURE/i,
        /NT_STATUS_ACCESS_DENIED/i,
        /NT_STATUS_PASSWORD_MUST_CHANGE/i,
      ],
      to: "smb",
      hint: "SMB auth fail — enum com nxc/smbclient; spray só com RoE.",
      priority: 17,
    },
    {
      id: "kerberos",
      patterns: [
        /\bKRB_AP_ERR_SKEW\b/i,
        /\bKRB5KDC_ERR\b/i,
        /Clock skew too great/i,
        /Preauthentication failed/i,
        /\bkrb5\b/i,
      ],
      to: "kerberos",
      hint: "Kerberos/clock skew — sync hora e segue o ramo kerberos (só no escopo).",
      priority: 17,
    },

    /* ——— auth / HTTP ——— */
    {
      id: "http-401",
      patterns: [
        /\b401\b.*\bUnauthorized\b/i,
        /\bHTTP\/\d(?:\.\d)?\s+401\b/i,
        /WWW-Authenticate:/i,
      ],
      to: "web-auth",
      hint: "401 — auth requerida. Ramo auth (defaults, spray RoE, JWT/OAuth).",
      priority: 16,
    },
    {
      id: "http-403",
      patterns: [/\bHTTP\/\d(?:\.\d)?\s+403\b/i, /\b403\b.*\bForbidden\b/i],
      to: "web-auth",
      hint: "403 — auth vs path vs allowlist. Não força bypass WAF no escuro.",
      priority: 15,
    },
    {
      id: "http-429",
      patterns: [/\bHTTP\/\d(?:\.\d)?\s+429\b/i, /Too Many Requests/i, /rate.?limit/i],
      to: null,
      hint: "Rate limit — reduz threads, backoff. Sem nó dedicado; fica no path atual.",
      priority: 16,
    },
    {
      id: "ssl-cert",
      patterns: [
        /SSL certificate problem/i,
        /certificate verify failed/i,
        /self[- ]signed certificate/i,
        /SSL: CERTIFICATE_VERIFY_FAILED/i,
        /curl:\s*\(60\)/i,
      ],
      to: "web",
      hint: "TLS quebrado/self-signed — lab: -k com consciência; engajamento: anota finding.",
      priority: 14,
    },
    {
      id: "waf-blocked",
      patterns: [
        /\bWAF\b/i,
        /Request blocked/i,
        /Attention Required! \| Cloudflare/i,
        /\bcaptcha\b/i,
        /The request was rejected/i,
      ],
      to: "web",
      hint: "WAF/captcha — não inventa bypass. Reduz ruído, muda vetor, documenta.",
      priority: 13,
    },

    /* ——— serviços clássicos ——— */
    {
      id: "ssh-denied",
      patterns: [
        /Permission denied \(publickey/i,
        /Permission denied \(password/i,
        /Authentications that can continue/i,
        /ssh_exchange_identification/i,
      ],
      to: "ssh",
      hint: "SSH auth fail — keys/users no ramo ssh; sem spray agressivo sem RoE.",
      priority: 15,
    },
    {
      id: "ftp-login",
      patterns: [/530 Login incorrect/i, /530 Permission denied/i, /ftp: Login failed/i],
      to: "ftp",
      hint: "FTP login fail — anonymous? enum no ramo ftp.",
      priority: 14,
    },
    {
      id: "rdp-auth",
      patterns: [
        /CredSSP/i,
        /NLA.*required/i,
        /STATUS_LOGON_FAILURE.*3389/i,
        /xfreerdp.*Authentication failure/i,
      ],
      to: "rdp",
      hint: "RDP/NLA — ramo rdp; lockout é real, rate baixo.",
      priority: 15,
    },
    {
      id: "mysql-access",
      patterns: [/Access denied for user/i, /ERROR 1045/i, /mysql.*using password: YES/i],
      to: "mysql",
      hint: "MySQL access denied — ramo mysql; não brute cego.",
      priority: 15,
    },
    {
      id: "mssql-login",
      patterns: [/Login failed for user/i, /Error Number:\s*18456/i, /severityql.*Login failed/i],
      to: "mssql",
      hint: "MSSQL login failed — ramo mssql / linked servers depois de auth.",
      priority: 15,
    },
    {
      id: "redis-auth",
      patterns: [/NOAUTH Authentication required/i, /-WRONGPASS/i, /Redis.*DENIED/i],
      to: "redis",
      hint: "Redis pede auth ou negou comando — ramo redis.",
      priority: 15,
    },
    {
      id: "winrm-auth",
      patterns: [
        /WinRM::WinRMAuthorizationError/i,
        /WinRM::WinRMHTTPTransportError/i,
        /evil-winrm.*Unauthorized/i,
        /HTTPClient::KeepAliveDisconnected/i,
      ],
      to: "winrm",
      hint: "WinRM auth/transporte — cred ou 5985/5986. Ramo winrm.",
      priority: 16,
    },
    {
      id: "ldap-creds",
      patterns: [
        /INVALID_CREDENTIALS/i,
        /invalid credentials/i,
        /strongerAuthRequired/i,
        /ldap_bind: Invalid credentials/i,
      ],
      to: "ldap",
      hint: "LDAP bind falhou — ramo ldap; não spray o DC sem RoE.",
      priority: 16,
    },
    {
      id: "ssh-kex",
      patterns: [
        /kex_exchange_identification/i,
        /Connection closed by remote host/i,
        /Unable to negotiate with/i,
        /no matching (key exchange|host key|cipher)/i,
      ],
      to: "ssh",
      hint: "SSH handshake/kex — versão/algos ou ban. Ramo ssh.",
      priority: 15,
    },
    {
      id: "impacket-smb",
      patterns: [
        /SessionError:/i,
        /STATUS_MORE_PROCESSING_REQUIRED/i,
        /SMB SessionError/i,
        /tree connect failed/i,
      ],
      to: "smb",
      hint: "Impacket/SMB session error — signing, cred, share. Ramo smb.",
      priority: 16,
    },
    {
      id: "sqlmap-waf",
      patterns: [
        /seems to be protected by a WAF/i,
        /protected by a WAF\/IPS/i,
        /heuristic indicates.*WAF/i,
        /target URL content is not stable/i,
        /all tested parameters do not appear to be injectable/i,
        /does not seem to be injectable/i,
        /sqlmap identified no injectable/i,
      ],
      to: "web-sqli",
      hint: "sqlmap WAF/instável/sem inject — volta ao manual no Burp; não sobe risk cego.",
      priority: 14,
    },
    {
      id: "gobuster-noise",
      patterns: [
        /the server returns a status code that matches/i,
        /Error: error on running gobuster/i,
        /wildcard response found/i,
      ],
      to: "web",
      hint: "Gobuster wildcard/status — ajusta -b/-s/--exclude-length no ramo web.",
      priority: 12,
    },
    {
      id: "wordlist-missing",
      patterns: [
        /No such file or directory.*wordlist/i,
        /cannot open wordlist/i,
        /rockyou\.txt.*No such file/i,
        /Error opening wordlist/i,
      ],
      to: "session",
      hint: "Wordlist path errado — corrige WORDLIST nos params / locate rockyou.",
      priority: 17,
    },
    {
      id: "hydra-connect",
      patterns: [
        /\[ERROR\] could not connect/i,
        /Hydra.*can'?t connect/i,
        /waiting for children to finish.*0 valid passwords/i,
      ],
      to: "alive",
      hint: "Hydra não conecta — alvo/porta/VPN antes de culpar a wordlist.",
      priority: 14,
    },
    {
      id: "nfs-showmount",
      patterns: [
        /clnt_create: RPC: Program not registered/i,
        /showmount:.*Unable to connect/i,
        /RPC: Port mapper failure/i,
      ],
      to: "nfs",
      hint: "NFS/RPC fail — ramo nfs; confirma 111/2049 no nmap.",
      priority: 14,
    },
    {
      id: "nmap-resolve",
      patterns: [
        /Failed to resolve/i,
        /Failed to resolve ".*"/i,
        /nmap.*Name or service not known/i,
      ],
      to: "session",
      hint: "nmap não resolve o nome — usa IP nos params ou confere DOMAIN.",
      priority: 17,
    },

    /* ——— recon genérico (baixo) ——— */
    {
      id: "nmap-filtered",
      patterns: [
        /\d+\/tcp\s+filtered/i,
        /All \d+ scanned ports.*filtered/i,
        /host is up.*filtered/i,
      ],
      to: "ports",
      hint: "Portas filtered — mapa de portas; não assume serviço morto.",
      priority: 11,
    },
    {
      id: "timeout",
      patterns: [/Connection timed out/i, /ETIMEDOUT/, /Timeout was reached/i],
      to: "alive",
      hint: "Timeout genérico — sanidade alive antes do quarteto. Específicos (SQL/JWT/SMB) ganham se também casarem.",
      priority: 6,
    },
  ],
};
