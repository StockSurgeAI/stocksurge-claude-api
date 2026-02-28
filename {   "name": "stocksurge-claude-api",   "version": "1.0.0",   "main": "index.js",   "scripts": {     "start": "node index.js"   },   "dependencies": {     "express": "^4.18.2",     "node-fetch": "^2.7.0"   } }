const express = require('express');
const fetch = require('node-fetch');
const app = express();
app.use(express.json());

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

app.post('/generate-report', async (req, res) => {
  try {
    const { ticker, query, yahooData, ssaiData } = req.body;

    const prompt = `You are the StockSurge AI Pro Research Engine. 
Ticker: ${ticker}
User Question: ${query}
Yahoo Finance Data: ${JSON.stringify(yahooData)}
SSAI Historical Data: ${JSON.stringify(ssaiData)}

Respond ONLY with a valid JSON object in this exact format, no other text:
{
  "ticker": "SYMBOL",
  "company_name": "Full Company Name",
  "current_price": "000.00",
  "prev_close": "000.00",
  "change_pct": "+0.00%",
  "volume": "00.0M",
  "ssai_summary": {
    "frequency": "X signals (trailing 12 months)",
    "avg_gain": "+X.X% avg per signal",
    "hit_rate": "XX%"
  },
  "trade_structure": {
    "purchase_zone": "$X – $X",
    "stop_loss": "$X",
    "take_profit": "$X",
    "risk_reward": "X : 1"
  },
  "narrative": "2-3 sentence professional analysis here."
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
        max_tokens: 1024,
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
