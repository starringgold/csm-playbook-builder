# CSM Playbook Builder

An AI-powered Customer Success Playbook generator that builds fully customized playbooks based on your customer segment, product context, and — most importantly — your own proven winning plays.

Most playbook generators give you generic advice. This one learns from *your* experience. Add the plays that actually worked for you and they get woven into every playbook you generate.

## What It Generates

Each playbook includes:

- **Onboarding Milestones** — Phase-by-phase plan for Days 1 through 90
- **Stakeholder Mapping** — Key roles, what they care about, and how to engage them
- **Adoption Checkpoints** — Metrics and behaviors to track at 30/60/90 days
- **Risk Signals** — Yellow and red flag indicators with response playbooks
- **Expansion Triggers** — Signals the customer is ready for upsell, with timing and framing
- **Recommended Cadence** — Meeting types, frequency, and agenda focus

## Tech Stack

- **Backend:** Node.js + Express
- **AI:** Anthropic Claude API (`claude-opus-4-5`)
- **Frontend:** Vanilla HTML, CSS, JavaScript
- **Storage:** localStorage (plays library persists in your browser)

## Run Locally

### Prerequisites

- Node.js 18+
- A Claude API key — get one at [console.anthropic.com](https://console.anthropic.com)

### Setup

```bash
git clone https://github.com/yourusername/csm-playbook-builder
cd csm-playbook-builder
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000), enter your Claude API key in the top-right, and start building playbooks.

> **No `.env` file needed.** Users supply their own API key directly in the app. Your key is saved to your browser's localStorage and never sent anywhere except directly to the Claude API.

## Deploy to Render (Free)

1. Fork this repo to your GitHub account
2. Go to [render.com](https://render.com) and create a new **Web Service**
3. Connect your forked GitHub repo
4. Set:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Deploy

No environment variables needed. Render auto-deploys on every push to `main`.

## How the Winning Plays Feature Works

The sidebar lets you build a personal library of plays -- situations you've handled well, what you did, and the outcome. When you generate a playbook, all of your plays are sent as context to Claude alongside the customer details. Claude then adapts and references them naturally where they apply.

The app ships with three example plays to get you started. Replace them with your own.

## About

Built by [Star Ringgold](https://linkedin.com/in/starringgold) -- Senior Technical CSM with 8+ years in enterprise SaaS across Chili Piper, Mailchimp, and WeWork. Part of a portfolio of CS tooling and AI automation projects.
