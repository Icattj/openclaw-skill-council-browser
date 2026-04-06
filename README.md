---
name: Council Browser
description: Give Council Room agents a real browser. Navigate pages, extract content, fill forms, and scrape sites that block simple fetch. Built natively on Playwright — no third-party binaries. Use when Gabriel needs to monitor competitors, Metis needs to research, or Raguel needs to find contacts.
---

# Council Browser

Playwright-based headless browser for Council Room agents.
Zero external binaries. Uses the Playwright already available on the VPS.

## Quick Commands (via AgentExec or direct)

```bash
# Navigate and extract text
node ~/.openclaw/workspace/skills/council-browser/scripts/browse.mjs snapshot https://example.com

# Extract structured data (title, headings, links, main text)
node ~/.openclaw/workspace/skills/council-browser/scripts/browse.mjs extract https://ledgerowl.com/pricing

# Screenshot
node ~/.openclaw/workspace/skills/council-browser/scripts/browse.mjs screenshot https://example.com /tmp/snap.png

# Search via DuckDuckGo (no API key needed)
node ~/.openclaw/workspace/skills/council-browser/scripts/browse.mjs search "DataFlow OCR Indonesia competitor"
```

## AgentExec Integration

Agents embed browse commands in [EXEC:] tags:
```
[EXEC: node ~/.openclaw/workspace/skills/council-browser/scripts/browse.mjs extract https://ledgerowl.com/pricing]
```

## Which Agent Uses This

- Gabriel 📣 — competitor monitoring (Mekari, Paper.id, Ledgerowl, Accurate)
- Metis 📚 — research and intelligence gathering
- Raguel 🤝 — find bookkeeper contacts, LinkedIn profiles
- Uriel 🔥 — check DataFlow competitor features

## Setup

```bash
cd ~/.openclaw/workspace/skills/council-browser
npm install playwright
npx playwright install chromium
```
