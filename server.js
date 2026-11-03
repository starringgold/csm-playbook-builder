const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/data', express.static(path.join(__dirname, 'data')));

app.post('/api/verify-access', (req, res) => {
  const { code } = req.body;
  const ACCESS_CODE = process.env.ACCESS_CODE;
  // No env var set = open access (local dev)
  if (!ACCESS_CODE) return res.json({ valid: true });
  if (code && code.trim() === ACCESS_CODE.trim()) return res.json({ valid: true });
  return res.json({ valid: false });
});

app.post('/api/generate', async (req, res) => {
  const { apiKey, segment, product, industry, companySize, goals, plays } = req.body;

  if (!apiKey) return res.status(400).json({ error: 'A Claude API key is required.' });
  if (!segment || !product || !industry || !goals) return res.status(400).json({ error: 'Please fill in all required fields.' });

  const client = new Anthropic({ apiKey });

  const playsContext = plays && plays.length > 0
    ? `\n\nThe CSM has shared ${plays.length} proven winning play${plays.length > 1 ? 's' : ''} from their own experience. Reference and adapt these naturally where they apply:\n\n${plays.map((p, i) =>
        `Play ${i + 1}:\n  Situation: "${p.situation}"\n  What I did: "${p.play}"\n  Result: "${p.outcome}"`
      ).join('\n\n')}`
    : '\n\n(No previous plays provided — generate a strong general playbook based on the context above.)';

  const prompt = `You are a senior Customer Success strategist with deep expertise across SaaS companies of all sizes. Generate a highly specific, actionable Customer Success Playbook for the following context.

Customer Context:
- Segment: ${segment}
- Product / Platform: ${product}
- Industry: ${industry}
- Company Size: ${companySize || 'Not specified'}
- Primary Goals: ${goals}
${playsContext}

Generate a comprehensive playbook using the exact structure below. Use markdown. Every recommendation must be specific to this customer — avoid generic boilerplate. Give a CSM something they can actually use on Monday morning.

---

## 🚀 Onboarding Milestones

Break into four clear phases:

**Day 1** — What must happen on day one (kickoff call goals, access setup, stakeholder intros, first win to aim for)

**Week 1** — Key setup tasks, first check-in, early signal to watch for

**Month 1** — First milestone checkpoint, success metrics to review, adoption target

**Months 2-3** — Deeper adoption goals, health check cadence, criteria for a successful onboarding exit

---

## 👥 Stakeholder Mapping

List the key roles to identify and engage at this type of customer. For each:
- Who they are
- What they care about most
- How to engage them effectively
- Red flag if they go quiet

---

## 📈 Adoption Checkpoints

Specific metrics and behaviors to track at each stage. Include:
- What "healthy" looks like at 30 / 60 / 90 days
- Leading indicators of good adoption (not just logins)
- How to course-correct if adoption stalls

---

## 🚨 Risk Signals and Early Warning Indicators

Concrete signals to watch for, organized by severity:

**Yellow flags** (watch and probe) — list 4-5 with suggested response for each

**Red flags** (act immediately) — list 3-4 with escalation playbook for each

---

## 💡 Expansion Triggers

Signals that this customer is ready for upsell or expansion conversation:
- Behavioral signals (what you see in the product or in their responses)
- Timing recommendations (when in the lifecycle to start the conversation)
- How to frame the expansion conversation for this segment and industry

---

## 📅 Recommended Cadence

| Meeting Type | Frequency | Owner | Agenda Focus |
|---|---|---|---|
| [fill in rows] | | | |

Include 3-5 meeting types appropriate for this segment with brief agenda focus for each.`;

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }]
    });
    res.json({ playbook: message.content[0].text });
  } catch (error) {
    console.error('Claude API error:', error.message);
    if (error.status === 401) return res.status(401).json({ error: 'Invalid API key. Check yours at console.anthropic.com.' });
    if (error.status === 429) return res.status(429).json({ error: 'Rate limit hit. Wait a moment and try again.' });
    res.status(500).json({ error: error.message || 'Something went wrong.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`CSM Playbook Builder running at http://localhost:${PORT}`));
