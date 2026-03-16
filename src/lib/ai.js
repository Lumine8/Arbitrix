/* ═══════════════════════════════════════════
   ARBITRIX — Claude AI Integration
   Powers trade explanations & stock reasoning
═══════════════════════════════════════════ */

export async function callAI(system, user, maxTokens = 800) {
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: maxTokens,
        system,
        messages: [{ role: 'user', content: user }],
      }),
    })
    const data = await r.json()
    return data?.content?.[0]?.text || ''
  } catch (_) {
    return ''
  }
}

export async function getTradeReasoning(type, name, symbol, analysis) {
  const a = analysis || {}
  return callAI(
    'You are an Indian equity trading coach. Be specific and concise. 3 sentences max.',
    `${type} ${name} (${symbol.replace('.NS', '')}).\n` +
    `Composite=${a.composite || 0}, conf=${a.confidence || 0}%, ` +
    `RLFS=${a.rlfs || 1}, entropy=${a.ent ? a.ent.normalized.toFixed(2) : '0.50'}, ` +
    `tier=${a.tier || 'STABLE'}, 10d target=₹${a.targetPrice ? a.targetPrice.toFixed(2) : '—'}.\n` +
    `Explain: signal rationale, PIEC regime context, and one risk tip.`
  )
}

export async function getBestPickReason(type, name, symbol, analysis, alternatives) {
  const a = analysis || {}
  return callAI(
    'Indian equity analyst. Be specific. Max 3 sentences.',
    `User is about to ${type} ${name} (${symbol.replace('.NS', '')}).\n` +
    `Signal: composite=${a.composite || 0}, conf=${a.confidence || 0}%, ` +
    `RLFS=${a.rlfs || 1}, entropy=${a.ent ? a.ent.normalized.toFixed(2) : '0.50'}, ` +
    `RSI=${a.rsi || 50}, tier=${a.tier || 'STABLE'}, target=₹${a.targetPrice ? a.targetPrice.toFixed(2) : '—'}.\n` +
    `Other ${type} candidates: ${JSON.stringify(alternatives)}.\n` +
    `Why is ${name} the BEST ${type} right now vs the alternatives? 3 sentences, be specific.`
  )
}

export async function getAlternativeComparison(type, targetName, alternatives) {
  if (!alternatives.length) return []
  const raw = await callAI(
    'Return ONLY a valid JSON array, no markdown, no extra text.',
    `For each stock below, one sentence on why it is a WORSE ${type} than ${targetName}.\n` +
    `Stocks: ${JSON.stringify(alternatives.slice(0, 3))}.\n` +
    `Format: [{"symbol":"SYM","reason":"sentence"}]`
  )
  try {
    const clean = raw.replace(/```json/g, '').replace(/```/g, '').trim()
    return JSON.parse(clean)
  } catch (_) { return [] }
}
