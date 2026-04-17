# AI PM Toolkit

A web app with three focused tools for product managers, powered by the [Claude API](https://anthropic.com).

**Live demo:** _[add your Vercel URL here]_

---

## What problem does this solve?

PMs spend significant time on repetitive high-structure documents — PRDs, prioritization matrices, research synthesis. These tasks have known formats and clear success criteria, which makes them well-suited for AI assistance. This toolkit provides purpose-built tools for each, rather than asking a general chatbot to "write a PRD for me."

## Target users

Product managers who want to move faster on documentation and discovery tasks without sacrificing structure or quality.

## The three tools

| Tool | When to use it |
|---|---|
| **PRD Generator** | You have a feature idea and need to turn it into a shareable spec |
| **Feature Prioritization** | You have a backlog and need to make a defensible call on what to build next |
| **Research Synthesizer** | You have raw interview notes and need to extract patterns before a readout |

These three tools cover the full PM loop: **discovery → prioritization → specification**.

## Why these three tools, and not others?

I prioritized based on frequency and leverage:
- PRDs are the most universal PM artifact — every PM writes them
- Prioritization is the highest-stakes decision PMs make repeatedly
- Research synthesis is the most time-consuming discovery task

I deliberately excluded: roadmap visualization (requires persistent state), stakeholder communication drafts (too context-dependent), and competitive analysis (requires live web access). These are v2 candidates.

## Tech decisions

- **Vanilla HTML/CSS/JS, no framework** — the app has three pages and no shared state. React would add build tooling and complexity with no benefit.
- **Direct Claude API calls from the browser** — acceptable for a portfolio project with a spend-limited key. A production version would proxy through a serverless function to protect the key.
- **Structured system prompts** — each tool constrains Claude's output to a specific format, making the output immediately usable rather than requiring reformatting.

## Known limitations and proposed solutions

| Limitation | Proposed solution |
|---|---|
| API key exposed in client-side config | Add a Vercel Edge Function as a lightweight proxy |
| No output history | Add localStorage to persist the last 5 outputs per tool |
| Claude output quality varies with vague inputs | Add example inputs and input validation with guidance |

## Setup

1. Clone this repo
2. Copy `config.example.js` to `config.js`
3. Add your [Anthropic API key](https://console.anthropic.com/) to `config.js`
4. Open `index.html` in a browser (or use a local server like `npx serve`)

> **Note:** `config.js` is gitignored. Never commit your API key.

## Deployment

Deployed via [Vercel](https://vercel.com) — connect your GitHub repo and it deploys automatically on every push. Since this is a static site, no build step is needed.

## What I'd build next

1. **Output history** — save and revisit past outputs per tool (localStorage, no backend needed)
2. **Custom prompt editor** — let advanced users modify the system prompts to match their team's style
3. **API proxy** — Vercel Edge Function to keep the API key server-side
4. **Export to Notion/Confluence** — one-click export of generated PRDs to a user's workspace

---

Built by Matthew Whyte · Powered by [Anthropic's Claude API](https://anthropic.com)
