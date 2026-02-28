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
User Question: ${query}
Yahoo Finance Data: ${JSON.stringify(yahooData)}
SSAI Historical Data: ${JSON.stringify(ssaiData)}

Use the data provided above. For any fields not available in the data, make a reasonable professional estimate based on the ticker and market context, clearly noting when estimated.

Respond ONLY with a valid JSON object in this exact format, no other text, no markdown:
{
  "ticker": "SYMBOL",
  "company_name": "Full Company Name",
  "report_date": "Current date and time EST",
  "anchor_price": "000.00",
  "current_price": "000.00",
  "prev_close": "000.00",
  "change_pct": "+0.00%",
  "volume": "00.0M",
  "volume_vs_avg": "X.Xx average",
  "trade_structure": {
    "anchor_note": "Calculated from verified anchor price as of [date]",
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
    "performance_summary": "Brief SSAI historical performance narrative"
  },
  "sources": ["url1", "url2"],
  "narrative": "2-3 sentence professional synthesis combining technicals, fundamentals, and SSAI signal context.",
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
