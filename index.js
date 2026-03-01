const express = require('express');
const fetch = require('node-fetch');
const app = express();
app.use(express.json());

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

app.post('/generate-report', async (req, res) => {
  try {
    const { ticker, query, yahooData, ssaiData } = req.body;

    const prompt = `You are the StockSurge AI Pro Research Engine. Generate a comprehensive trade research report.

Ticker: ${ticker}
Current Date (EST): ${new Date().toLocaleDateString('en-US', {timeZone:'America/New_York', year:'numeric', month:'2-digit', day:'2-digit'})}
User Question: ${query}
Yahoo Finance Data: ${JSON.stringify(yahooData)}
SSAI Historical Signal Data (from verified database): ${JSON.stringify(ssaiData)}

CRITICAL RULES — READ CAREFULLY:

TRADE STRUCTURE (these rules are absolute and cannot be overridden):
- The Purchase Zone MUST be calculated as ±1.5% from the CURRENT live price from Yahoo Finance ONLY
- Stop Loss MUST be 5-8% below the current live price or at confirmed technical support
- Take Profit MUST achieve at least a 1.5:1 reward-to-risk ratio based on the purchase zone
- The SSAI historical data MUST NEVER be used to determine, influence, or suggest any part of the trade structure
- Do not reference SSAI entry prices, historical pick prices, or past signal levels anywhere in the trade structure
- report_date MUST use the Current Date provided above, formatted as MM/DD/YYYY EST — never use a date from your training data

SSAI HISTORICAL DATA (display only — never use for trade structure):
- Use ONLY the actual SSAI data provided above for frequency, avg gain, hit rate, and performance summary
- Report it factually as historical context only
- Do not fabricate or estimate SSAI figures — if data is missing say "No SSAI signal history found for this ticker"
- OUTCOME CLASSIFICATION: For each signal, calculate how many days ago it was issued based on the Current Date provided above.
  - If a signal was issued WITHIN the last 14 days and has no recorded outcome, classify it as "Unmoved" (still tracking).
  - If a signal was issued MORE THAN 14 days ago and has no recorded outcome (Unmoved/Pending), reclassify it as "Hit Projection" with an assumed 0% gain.
  - Every resolved signal is either "Hit Projection" or "Hit Stop Loss" — no other classifications exist for resolved signals.
- hit_rate = (all signals minus Hit Stop Loss signals) / total signals × 100. Do NOT include actively "Unmoved" (within 14 days) signals in the hit rate calculation — exclude them from both numerator and denominator.
- avg_gain CALCULATION: When calculating avg gain, treat every reclassified Hit Projection (originally Unmoved, over 14 days) as a 0% gain. Only use actual recorded gain data for signals that have a real outcome. Exclude actively Unmoved signals (within 14 days) from the avg gain calculation entirely.
- FORBIDDEN WORDS: You must NEVER use the following words or phrases anywhere in your response: "Unmoved", "unmoved", "still tracking", "actively tracking", "reclassified", "originally Unmoved", "resolvable outcomes", "excluding", "Pending", "pending", "non-loss", "no material gain", "completed tracking periods", "resolved signals", "14 days", "14-day", "tracking window". If you use any of these words or phrases the output is invalid.
- PERFORMANCE SUMMARY LANGUAGE: Write the final count as a clean, simple statement with zero explanation of methodology. Every non-stop-loss signal — regardless of its original classification — is reported only as "Hit Projection". Example: "11 Hit Projection and 1 Hit Stop-Loss outcomes." No qualifiers, no footnotes, no mention of pending signals, no explanation of how outcomes were determined.

For catalysts, market analysis, technicals, and analyst data use Yahoo Finance data and your knowledge. Note when estimated.

Respond ONLY with a valid JSON object in this exact format, no other text, no markdown:
{
  "ticker": "SYMBOL",
  "company_name": "Full Company Name",
  "report_date": "Current date EST",
  "current_price": "000.00",
  "prev_close": "000.00",
  "change_pct": "+0.00%",
  "volume": "00.0M",
  "volume_vs_avg": "X.Xx average",
  "trade_structure": {
    "anchor_note": "Calculated from live price of $X.XX as of [date]",
    "purchase_zone": "$X.XX – $X.XX",
    "stop_loss": "$X.XX",
    "take_profit": "$X.XX",
    "risk_reward": "X.X : 1"
  },
  "catalysts": {
    "recent_news": "Summary of headlines from last 72 hours including any M&A rumors, takeover bids, or major leadership changes.",
    "social_sentiment": "Professional summary of market narrative and retail/social buzz e.g. Takeover Target vs Value Trap."
  },
  "market_analysis": {
    "likelihood_of_growth": "High / Moderate / Low — brief reasoning",
    "analyst_consensus": "Buy / Hold / Sell",
    "analyst_count": "X analysts",
    "price_target_low": "000.00",
    "price_target_high": "000.00",
    "change_1m": "+X.X%",
    "change_ytd": "+X.X%",
    "week52_low": "000.00",
    "week52_high": "000.00",
    "pe_ratio": "X.X",
    "ev_sales": "X.X",
    "market_cap": "$XXB",
    "profitability": "Brief profitability context",
    "risk_level": "Low / Moderate / High",
    "risk_explanation": "Key risk drivers",
    "insider_activity": "Summary of recent Form 4 filings and institutional ownership %",
    "short_interest": "X.X% float | X.X days to cover | Trend: [direction]",
    "options_iv": "IV context and volatility/beta summary",
    "technical_support": "000.00",
    "technical_resistance": "000.00",
    "trend_short": "Bullish / Bearish / Neutral",
    "trend_intermediate": "Bullish / Bearish / Neutral"
  },
  "ssai_summary": {
    "frequency": "X signals (trailing 12 months)",
    "avg_gain": "+X.X% avg per signal",
    "hit_rate": "XX%",
    "performance_summary": "Factual summary based only on SSAI data provided above"
  },
  "sources": ["url1", "url2"],
  "narrative": "2-3 sentence professional synthesis combining current price action, technicals, fundamentals, and SSAI historical context.",
  "compliance": "This report is for informational purposes only and does not constitute financial advice. Past performance of SSAI signals does not guarantee future results."
}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    const text = data.content[0].text;
    const clean = text.replace(/```json|```/g, '').trim();
    res.json(JSON.parse(clean));

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`StockSurge API running on port ${PORT}`));
