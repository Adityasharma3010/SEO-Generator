# SEO Toolkit

A single-page, browser-only tool that generates meta tags and audits a page's on-page SEO — just by pasting in its HTML source. No backend, no build step, no external API calls.

**Live:** https://seo-generator-one.vercel.app/

## What it does

Paste a page's raw HTML source into the tool and it will:

- Pull a suggested **title tag**, **meta description**, and **focus keyword** straight from the page's own `<h1>` / `<title>` content
- Run a full on-page SEO checklist and flag each item as pass / warning / fail:
  - Title tag length (50–60 chars)
  - Meta description presence and length (150–160 chars)
  - Canonical tag (self-referencing check)
  - Meta robots / accidental `noindex`
  - Exactly one `<h1>` per page, logical heading order
  - Broken or placeholder links (`#`, empty `href`)
  - Self-referencing links with no SEO value
  - Image `alt` text presence
  - Image `width`/`height` attributes (layout shift risk)
  - Lazy-loading usage
  - JSON-LD structured data presence
  - Mixed content (`http://` resources on an `https` page)
  - Mobile viewport tag
  - Accidental external links (e.g. stray auto-links to Wikipedia/unrelated domains)
  - Responsible-gambling / age-gate text visible in raw HTML (for gambling-niche sites)

Everything runs client-side in the browser. Nothing is sent to a server — pasted HTML never leaves your machine.

## Why paste HTML instead of just pasting a link?

Browsers block a webpage's JavaScript from fetching another website's content directly (CORS). A tool that "just takes a link" would need a backend server to fetch the page on your behalf. This version avoids that entirely — copy the page's **View Source** and paste it in, and everything runs instantly and for free, for any site.

## How to use

1. Open the live page (or `index.html` locally)
2. On the target page, right-click → **View Page Source** (or `Ctrl+U`)
3. Select all (`Ctrl+A`), copy (`Ctrl+C`)
4. Paste into the tool's textarea
5. (Optional) paste the page's URL too — used to verify canonical tags and catch self-referencing links
6. Click **Analyze Page**

## Files

| File | Purpose |
|---|---|
| `index.html` | Page structure/markup only |
| `seo-toolkit.css` | All styling — dark/light theme, layout, responsive breakpoints |
| `seo-toolkit.js` | All logic — HTML parsing, checklist rules, meta suggestion extraction, theme toggle, custom cursor |

All three files must stay in the same folder — `index.html` links to the other two by relative filename.

## Features

- 🌗 **Dark / light mode** toggle, remembered across visits
- 📱 **Responsive** — usable layout down to small phone widths
- 🖱️ Custom cursor with hover and click feedback
- 🔒 Fully static — deployable anywhere that serves plain HTML/CSS/JS (Vercel, Netlify, GitHub Pages, etc.)

## Deployment

This is a static site — any static host works. Currently deployed on [Vercel](https://vercel.com), auto-redeploying on every push to `main`.

## Limitations

- Cannot fetch a URL's HTML automatically (see "Why paste HTML" above) — pasting source is required
- Does not measure real performance/Core Web Vitals — use [PageSpeed Insights](https://pagespeed.web.dev) for that
- Does not verify actual image file format (WebP/AVIF) beyond what's visible in the markup
- Suggested focus keyword is a simple heuristic (stopword-stripped H1/title) — review before publishing
