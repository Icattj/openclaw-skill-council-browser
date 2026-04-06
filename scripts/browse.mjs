#!/usr/bin/env node
/**
 * Council Browser — Native Playwright browser for Council Room agents
 * Built clean, no third-party binaries
 * Usage: browse.mjs <command> <url> [output]
 */

import { chromium } from 'playwright';

const [,, cmd, target, outPath] = process.argv;

if (!cmd || !target) {
  console.error('Usage: browse.mjs <snapshot|extract|screenshot|search> <url|query> [outputPath]');
  process.exit(1);
}

async function withBrowser(fn) {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
    locale: 'id-ID,en-US;q=0.9'
  });
  const page = await ctx.newPage();
  try {
    return await fn(page);
  } finally {
    await browser.close();
  }
}

async function snapshot(url) {
  return withBrowser(async (page) => {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(1500);

    const result = await page.evaluate(() => {
      const title = document.title;
      const url = location.href;
      const h1 = [...document.querySelectorAll('h1')].map(e => e.innerText.trim()).filter(Boolean).slice(0, 5);
      const h2 = [...document.querySelectorAll('h2')].map(e => e.innerText.trim()).filter(Boolean).slice(0, 8);
      const meta = document.querySelector('meta[name="description"]')?.content || '';
      // Main text — grab from article, main, or body
      const mainEl = document.querySelector('article') || document.querySelector('main') || document.body;
      const text = mainEl.innerText.replace(/\s+/g, ' ').trim().slice(0, 3000);
      // Links
      const links = [...document.querySelectorAll('a[href]')]
        .map(a => ({ text: a.innerText.trim().slice(0, 60), href: a.href }))
        .filter(l => l.text && l.href.startsWith('http'))
        .slice(0, 20);
      return { title, url, h1, h2, meta, text, links };
    });

    return JSON.stringify(result, null, 2);
  });
}

async function extract(url) {
  return withBrowser(async (page) => {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 25000 });
    await page.waitForTimeout(2000);

    const result = await page.evaluate(() => {
      // Remove nav, footer, ads, scripts
      ['nav','footer','header','script','style','[class*="ad"]','[class*="cookie"]','[class*="popup"]','[class*="modal"]']
        .forEach(sel => document.querySelectorAll(sel).forEach(el => el.remove()));

      const title = document.title;
      const url = location.href;
      const headings = [...document.querySelectorAll('h1,h2,h3')]
        .map(h => ({ level: h.tagName, text: h.innerText.trim() }))
        .filter(h => h.text)
        .slice(0, 15);
      // Pricing
      const priceEls = [...document.querySelectorAll('[class*="price"],[class*="pricing"],[class*="plan"],[class*="tier"]')];
      const pricing = priceEls.map(el => el.innerText.trim().slice(0, 200)).filter(Boolean).slice(0, 5);
      // Features
      const featureEls = [...document.querySelectorAll('[class*="feature"],[class*="benefit"],[class*="advantage"]')];
      const features = featureEls.map(el => el.innerText.trim().slice(0, 150)).filter(Boolean).slice(0, 8);
      // Main content
      const mainEl = document.querySelector('article,[role="main"],main') || document.body;
      const content = mainEl.innerText.replace(/\s+/g, ' ').trim().slice(0, 4000);

      return { title, url, headings, pricing, features, content };
    });

    return JSON.stringify(result, null, 2);
  });
}

async function screenshot(url, outPath) {
  return withBrowser(async (page) => {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 25000 });
    await page.waitForTimeout(1500);
    const path = outPath || `/tmp/screenshot-${Date.now()}.png`;
    await page.screenshot({ path, fullPage: false });
    return JSON.stringify({ saved: path, url });
  });
}

async function search(query) {
  // Use Bing as fallback (more reliable headless than DDG)
  const searchUrl = 'https://www.bing.com/search?q=' + encodeURIComponent(query);
  return withBrowser(async (page) => {
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(1500);
    const results = await page.evaluate(() => {
      return [...document.querySelectorAll('.b_algo')].slice(0, 8).map(r => {
        const title = r.querySelector('h2')?.innerText?.trim() || '';
        const snippet = r.querySelector('.b_caption p, .b_algoSlug')?.innerText?.trim() || '';
        const link = r.querySelector('a')?.href || '';
        return { title, snippet, link };
      }).filter(r => r.title);
    });
    return JSON.stringify({ query, results }, null, 2);
  });
}

// Main
try {
  let output;
  if (cmd === 'snapshot') output = await snapshot(target);
  else if (cmd === 'extract') output = await extract(target);
  else if (cmd === 'screenshot') output = await screenshot(target, outPath);
  else if (cmd === 'search') output = await search(target);
  else { console.error('Unknown command:', cmd); process.exit(1); }

  console.log(output);
} catch (e) {
  console.error(JSON.stringify({ error: e.message, url: target }));
  process.exit(1);
}
