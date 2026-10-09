/**
 * Fixtures paste híbrido — testes / mock (sem Ollama).
 * Spec Claude V4 §2 · node scripts/test-llm-paste.js
 */
window.HUNTER_LLM_FIXTURES = [
  {
    id: "F01-gobuster-console-400",
    kind: "enum",
    tool: "gobuster",
    expect_regex: "miss",
    raw: `gobuster dir -u http://10.66.132.201:5002 -w /usr/share/dirb/wordlists/common.txt
console              (Status: 400) [Size: 167]
Progress: 4613 / 4613 (100.00%)
Finished`,
    expect_ai: {
      hypothesis:
        "Path /console respondeu 400 (não 404) — endpoint vivo na :5002; investigar e ajustar TARGET.",
      confidence: "medium",
      suggestions: [
        {
          nodeId: "web",
          reason: "400 ≠ 404 — investigar /console.",
          params: { TARGET: "http://10.66.132.201:5002" },
        },
        { nodeId: "burp-method", reason: "Interceptar /console.", params: {} },
      ],
    },
  },
  {
    id: "F02-gobuster-admin-403",
    kind: "enum",
    tool: "gobuster",
    expect_regex: "miss",
    raw: `admin                (Status: 403) [Size: 289]
login                (Status: 200) [Size: 1801]
api                  (Status: 301) [Size: 0] [--> /api/]
backup.zip           (Status: 403) [Size: 289]`,
    expect_ai: {
      hypothesis: "/admin e /backup.zip existem (403); /login e /api/ são entradas.",
      confidence: "medium",
      suggestions: [
        { nodeId: "web-auth", reason: "/login 200.", params: {} },
        { nodeId: "web-api", reason: "/api/ redirect.", params: {} },
      ],
    },
  },
  {
    id: "F03-nmap-tomcat-8080",
    kind: "enum",
    tool: "nmap",
    expect_regex: "miss",
    raw: `PORT      STATE SERVICE VERSION
22/tcp    open  ssh     OpenSSH 8.9p1
80/tcp    open  http    nginx 1.18.0
8080/tcp  open  http    Apache Tomcat 9.0.65
3306/tcp  open  mysql   MySQL 8.0.33`,
    expect_ai: {
      hypothesis: "Tomcat 8080 + MySQL 3306 — priorizar manager/default creds.",
      confidence: "high",
      suggestions: [
        {
          nodeId: "tomcat",
          reason: "Apache Tomcat na 8080.",
          params: { TARGET: "http://10.10.55.20", RPORT: "8080" },
        },
        { nodeId: "mysql", reason: "MySQL 3306.", params: { RPORT: "3306" } },
      ],
    },
  },
  {
    id: "F04-nmap-tomcat-1234",
    kind: "enum",
    tool: "nmap",
    expect_regex: "miss",
    raw: `PORT      STATE SERVICE VERSION
21/tcp    open  ftp     vsftpd 3.0.3
1234/tcp  open  http    Apache Tomcat/Coyote JSP engine 1.1`,
    expect_ai: {
      hypothesis: "Tomcat em porta atípica 1234 — ajustar RPORT.",
      confidence: "high",
      suggestions: [
        {
          nodeId: "tomcat",
          reason: "Coyote/Tomcat na 1234.",
          params: { RPORT: "1234" },
        },
        { nodeId: "ftp", reason: "vsftpd 21.", params: { RPORT: "21" } },
      ],
    },
  },
  {
    id: "F05-curl-401",
    kind: "auth",
    tool: "curl",
    expect_regex: "hit",
    raw: `HTTP/1.1 401 Unauthorized
WWW-Authenticate: Basic realm="Restricted Area"`,
    expect_ai: null,
  },
  {
    id: "F06-curl-403-json",
    kind: "auth",
    tool: "curl",
    expect_regex: "hit",
    raw: `< HTTP/1.1 403 Forbidden
{"error":"Access denied: insufficient role"}`,
    expect_ai: null,
  },
  {
    id: "F07-conn-refused",
    kind: "error",
    tool: "curl",
    expect_regex: "hit",
    raw: `curl: (7) Failed to connect to 10.10.99.99 port 8443 after 3021 ms: Connection refused`,
    expect_ai: null,
  },
  {
    id: "F08-host-down",
    kind: "error",
    tool: "nmap",
    expect_regex: "hit",
    raw: `Note: Host seems down. If it is really up, but blocking our ping probes, try -Pn
Nmap done: 1 IP address (0 hosts up) scanned in 3.02 seconds`,
    expect_ai: null,
  },
  {
    id: "F09-sqlmap-waf",
    kind: "mixed",
    tool: "sqlmap",
    expect_regex: "hit",
    raw: `[WARNING] heuristics detected that the target is protected by some kind of WAF/IPS
[WARNING] parameter 'id' does not seem to be injectable`,
    expect_ai: null,
  },
  {
    id: "F10-sqlmap-not-injectable",
    kind: "error",
    tool: "sqlmap",
    expect_regex: "hit",
    raw: `[WARNING] GET parameter 'q' does not seem to be injectable
sqlmap identified no injectable parameters.`,
    expect_ai: null,
  },
  {
    id: "F11-hydra-mid-refused",
    kind: "auth",
    tool: "hydra",
    expect_regex: "hit",
    raw: `[STATUS] 143.00 tries/min, 143 tries in 00:01h
[ERROR] could not connect to target port 22: Connection refused`,
    expect_ai: null,
  },
  {
    id: "F12-smb-logon-failure",
    kind: "error",
    tool: "nxc",
    expect_regex: "hit",
    raw: `SMB    10.10.60.4    445    DC01   [-] CORP.LOCAL\\guest: STATUS_LOGON_FAILURE`,
    expect_ai: null,
  },
  {
    id: "F13-kerberos-skew",
    kind: "error",
    tool: "impacket",
    expect_regex: "hit",
    raw: `[-] KRB_AP_ERR_SKEW(Clock skew too great)`,
    expect_ai: null,
  },
  {
    id: "F14-evil-winrm-auth",
    kind: "auth",
    tool: "evil-winrm",
    expect_regex: "hit",
    raw: `Error: An error of type WinRM::WinRMAuthorizationError happened, message is WinRM::WinRMAuthorizationError`,
    expect_ai: null,
  },
  {
    id: "F15-jwt-token",
    kind: "mixed",
    tool: "curl",
    expect_regex: "miss",
    raw: `{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoidGVzdCIsInJvbGUiOiJ1c2VyIn0.abc123signature"}`,
    expect_ai: {
      hypothesis: "JWT com claim role — testar alg/claims no ramo jwt.",
      confidence: "high",
      suggestions: [
        { nodeId: "web-jwt", reason: "Token JWT no body.", params: {} },
        { nodeId: "web-api", reason: "Fluxo API login.", params: {} },
      ],
    },
  },
  {
    id: "F16-ssh-banner-noise",
    kind: "mixed",
    tool: "nc",
    expect_regex: "miss",
    raw: `(UNKNOWN) [10.10.90.1] 22 (ssh) open
SSH-2.0-OpenSSH_8.4p1 Debian-5+deb11u3`,
    expect_ai: {
      hypothesis: "Só banner SSH — pouco sinal; continua no mapa de portas.",
      confidence: "low",
      suggestions: [],
    },
  },
];
