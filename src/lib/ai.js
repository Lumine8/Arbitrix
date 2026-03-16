/**
 * ════════════════════════════════════════════
    ARBITRIX — Claude AI Integration
    Powers trade explanations & stock reasoning
    Uses backend proxy to avoid CORS issues
═════════════════════════════════════════════ */

export async function callAI(system, user, maxTokens = 400) {
  try {
    // Call our backend proxy for Claude API
    const response = await fetch(`${window.location.origin}/api/ai`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        system,
        user,
        maxTokens
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error("Claude API error:", err);
      return "";
    }

    const data = await response.json();
    return data?.content?.[0]?.text?.trim() || "";
  } catch (err) {
    console.error("AI request failed:", err);
    return "";
  }
}

export async function getTradeReasoning(type, name, symbol, analysis) {
  const a = analysis || {};

  return callAI(
    "You are an Indian equity trading coach. Be specific and concise. Maximum 3 sentences.",
    `${type} ${name} (${symbol.replace(".NS", "")}).\n` +
      `Composite=${a.composite || 0}, conf=${a.confidence || 0}%, ` +
      `RLFS=${a.rlfs || 1}, entropy=${a.ent ? a.ent.normalized.toFixed(2) : "0.50"}, ` +
      `tier=${a.tier || "STABLE"}, 10d target=₹${a.targetPrice ? a.targetPrice.toFixed(2) : "—"}.\n` +
      `Explain the signal rationale, the PIEC regime context, and one risk tip.`,
  );
}

export async function getBestPickReason(
  type,
  name,
  symbol,
  analysis,
  alternatives,
) {
  const a = analysis || {};

  return callAI(
    "You are an Indian equity analyst. Be specific and concise. Maximum 3 sentences.",
    `User is about to ${type} ${name} (${symbol.replace(".NS", "")}).\n` +
      `Signal: composite=${a.composite || 0}, conf=${a.confidence || 0}%, ` +
      `RLFS=${a.rlfs || 1}, entropy=${a.ent ? a.ent.normalized.toFixed(2) : "0.50"}, ` +
      `RSI=${a.rsi || 50}, tier=${a.tier || "STABLE"}, target=₹${a.targetPrice ? a.targetPrice.toFixed(2) : "—"}.\n` +
      `Other ${type} candidates: ${JSON.stringify(alternatives)}.\n` +
      `Why is ${name} the BEST ${type} choice right now compared to the alternatives?`,
  );
}

export async function getAlternativeComparison(type, targetName, alternatives) {
  if (!alternatives.length) return [];

  const raw = await callAI(
    "Return ONLY a valid JSON array. No markdown, no explanation.",
    `For each stock below, provide one sentence on why it is a WORSE ${type} than ${targetName}.\n` +
      `Stocks: ${JSON.stringify(alternatives.slice(0, 3))}.\n` +
      `Format: [{"symbol":"SYM","reason":"sentence"}]`,
  );

  try {
    const clean = raw
      .replace(/```json/gi, "")
      .replace(/```/g)
      .replace(/\n/g, "")
      .trim();

    return JSON.parse(clean);
  } catch (err) {
    console.warn("Failed to parse AI JSON:", raw);
    return [];
  }
}