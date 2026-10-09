/**
 * Phantonite HUB — LLM prompt pack (paste híbrido · copiloto mínimo)
 * Spec: TAMAGO V4 / Claude briefing · ADR-003
 */
window.HUNTER_LLM = {
  meta: { version: "0.1.0", maxPasteChars: 4000, timeoutMs: 20000 },

  SYSTEM_PROMPT: `És um assistente de reconhecimento para o Phantonite HUB, um field guide de pentest autorizado.

A tua única tarefa: ler um output de terminal colado pelo utilizador (ferramenta Kali/pentest) e sugerir, no máximo, 3 próximos nós da árvore de decisão do HUB — nunca decides nem executas nada, só sugeres.

REGRAS ABSOLUTAS:
1. Só podes sugerir "nodeId" que apareçam literalmente na lista "NÓS DISPONÍVEIS" fornecida pelo utilizador. Nunca inventes um nodeId. Se nenhum nó da lista fizer sentido, devolve "suggestions": [].
2. Nunca sugiras ações de negação de serviço (DoS), scans agressivos fora do que já está implícito no output colado, nem qualquer alvo/IP que não apareça no texto colado ou nos params atuais.
3. A "hypothesis" é sempre 1 frase curta, em português, sem markdown, sem bullet points.
4. Se o output tiver pouco sinal (ex: banner genérico sem indício de vulnerabilidade ou próximo passo claro), define "confidence": "low" e podes devolver "suggestions" vazio — não forces 3 sugestões só para preencher o formato.
5. "params" só deve incluir chaves reconhecidas (TARGET, IP, RPORT, LHOST, LPORT, domain, wordlist) e apenas quando o output justificar claramente esse valor (ex: uma porta específica detectada).
6. Responde SEMPRE em JSON puro, válido, seguindo exatamente este formato, sem texto antes ou depois:
{
  "hypothesis": string,
  "confidence": "high" | "medium" | "low",
  "suggestions": [
    { "nodeId": string, "reason": string, "params": { } }
  ]
}`,

  ALLOWED_PARAM_KEYS: [
    "TARGET",
    "IP",
    "RPORT",
    "LHOST",
    "LPORT",
    "domain",
    "wordlist",
    "target",
    "ip",
    "rport",
    "lhost",
    "lport",
  ],

  /** Map LLM param keys → session field keys */
  PARAM_TO_SESSION: {
    TARGET: "target",
    target: "target",
    IP: "ip",
    ip: "ip",
    RPORT: "rport",
    rport: "rport",
    LHOST: "lhost",
    lhost: "lhost",
    LPORT: "lport",
    lport: "lport",
    domain: "domain",
    wordlist: "wordlist",
  },

  buildUserPayload(rawText, allowlist, currentNode, currentParams) {
    const max = this.meta.maxPasteChars;
    let text = String(rawText || "");
    let truncated = false;
    if (text.length > max) {
      text = text.slice(0, max);
      truncated = true;
    }
    const paramsJson = JSON.stringify(currentParams || {});
    const nodes = (allowlist || []).join(", ");
    return {
      truncated,
      content: `OUTPUT COLADO:
"""
${text}
"""

NÓS DISPONÍVEIS (usar apenas destes IDs):
${nodes}

ESTADO ATUAL DA SESSÃO:
- nó atual: ${currentNode || "?"}
- params atuais: ${paramsJson}`,
    };
  },

  /**
   * Validate + sanitize model JSON.
   * @returns {{ ok: boolean, error?: string, data?: object }}
   */
  sanitizeResponse(parsed, allowlistSet) {
    if (!parsed || typeof parsed !== "object") {
      return { ok: false, error: "json" };
    }
    const hypothesis = String(parsed.hypothesis || "").trim().slice(0, 220);
    const confidence = ["high", "medium", "low"].includes(parsed.confidence)
      ? parsed.confidence
      : "medium";
    const rawSug = Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 3) : [];
    const suggestions = [];
    for (const s of rawSug) {
      if (!s || typeof s !== "object") continue;
      const nodeId = String(s.nodeId || "").trim();
      if (!nodeId || !allowlistSet.has(nodeId)) continue;
      const reason = String(s.reason || "").trim().slice(0, 140);
      const paramsIn = s.params && typeof s.params === "object" ? s.params : {};
      const params = {};
      for (const [k, v] of Object.entries(paramsIn)) {
        if (!this.ALLOWED_PARAM_KEYS.includes(k)) continue;
        if (v == null) continue;
        params[k] = String(v).trim();
      }
      suggestions.push({ nodeId, reason, params });
    }
    return {
      ok: true,
      data: { hypothesis, confidence, suggestions },
    };
  },
};
