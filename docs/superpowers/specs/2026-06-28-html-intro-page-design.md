# Design Spec — Marketing Landing Page for `vscode-api-ws-tester`

| Field | Value |
| :--- | :--- |
| Date | 2026-06-28 |
| Status | Draft (awaiting user review) |
| Audience | Visitors arriving via Open VSX, GitHub, or word of mouth |

## 1. Goal

Ship a single static HTML page that introduces the **API & WebSocket Tester** VS Code extension, communicates its value in under 30 seconds, and drives installs. The page will be deployable to GitHub Pages; this design covers content, structure, and visual system only — deployment is out of scope.

## 2. Non-Goals

- No build step, no framework, no CDN runtime dependencies for fonts/icons (use system fonts + inline SVG only).
- No JS framework. A tiny vanilla JS snippet is permitted for tab-switching inside the mockup, nothing else.
- No multi-page routing, no documentation system, no blog.
- No backend / analytics / telemetry.
- No localization toggle (English only).

## 3. Page Structure

Single page, scroll-driven, six sections in order:

1. **Hero** — Logo, title, tagline, primary CTA (Install), secondary CTA (View on Open VSX / GitHub).
2. **Three Pillars** — Three feature cards: HTTP, WebSocket, Productivity.
3. **Live Mockup** — CSS-drawn webview frame containing two stacked mockup bodies (HTTP and WebSocket), swapped by a tab toggle so only one is visible at a time.
4. **Keyboard Shortcuts** — Two shortcut chips.
5. **Install** — Terminal-style code block with `code --install-extension ...`.
6. **Footer** — Repo link, license, version, publisher.

## 4. Content

### 4.1 Hero

- Eyebrow text: `VS CODE EXTENSION`
- Title: `API & WebSocket Tester`
- Tagline: `Test HTTP APIs and WebSocket connections right from the sidebar — no Postman, no `websocat`, no context switching.`
- Primary button: `Install` (anchors to `#install`)
- Secondary link: `View on Open VSX →` (opens `https://open-vsx.org/extension/codewithwu-cn/vscode-api-ws-tester`)
- Tertiary link: `GitHub` (opens `https://github.com/codewithwu/vscode-api-ws-tester`)

### 4.2 Three Pillars

Cards, each with a 24×24 inline SVG icon, heading, one-line summary, and 3-bullet feature list.

| Pillar | Icon (concept) | Headline | Summary | Bullets |
| :--- | :--- | :--- | :--- | :--- |
| HTTP | `globe` | HTTP, all the verbs | GET, POST, PUT, DELETE, PATCH with full control over headers, body, and auth. | 5 methods · Headers · JSON / Text / Form body · Bearer & Basic auth |
| WebSocket | `radio-tower` | Real-time, in the editor | Connect to `ws://` and `wss://`, send and receive messages with live timestamps. | Connect / disconnect · Send & receive · Timestamped log · Status indicator |
| Productivity | `bolt` | Built for the flow | Stays out of your way: history, collections, theme-aware UI, keyboard shortcuts. | 50-item history · Saved collections · Dark / light theme · Shortcuts |

### 4.3 Live Mockup

A single centered "window" frame styled like a VS Code sidebar panel (~520px wide, dark chrome `#252526`).

- Top: window chrome bar with traffic-light dots and tab strip `[HTTP] [WebSocket]`.
- A JS tab toggle uses each tab's `aria-controls` attribute to look up the corresponding panel and swaps between two stacked mockup bodies — only one is visible at a time, both are present in the DOM for SEO/print.
- **HTTP mockup body**: method dropdown (`POST`), URL input (`https://api.example.com/users`), `Send` button, Headers sub-tab with two key/value rows, Body sub-tab with a 6-line JSON snippet, Response panel showing `200 OK · 156ms · 2.3KB` and a 4-line JSON body.
- **WebSocket mockup body**: URL input (`wss://echo.websocket.org`), Connect / Disconnect buttons, status dot (`● Connected` in green), four message log rows alternating `→` (sent, blue-tinted) and `←` (received, green-tinted), each with a timestamp and short payload, plus a bottom input + Send.

All elements are pure HTML/CSS — no real data, no images. Subtle CSS-only animation: status dot pulses; message rows fade in once via `@keyframes` triggered by `prefers-reduced-motion: no-preference`.

### 4.4 Keyboard Shortcuts

Two `<kbd>`-style chips side by side:

- `Ctrl + Shift + W` — Open the tester panel
- `Ctrl + Enter` — Send request / message

### 4.5 Install

Heading: `Install in one command`. A terminal-styled block (mac/win/linux-style prompt) with the install command:

```
code --install-extension codewithwu-cn.vscode-api-ws-tester
```

Followed by a small "or download the .vsix" link pointing to `https://github.com/codewithwu/vscode-api-ws-tester/releases/latest`.

### 4.6 Footer

Three columns on desktop, stacked on mobile:

- **Project** — GitHub repo, Issues
- **Links** — Open VSX, PRD (`docs/prd.md` on GitHub). Marketplace link is omitted because the extension is not published there; do not add a dead link.
- **Meta** — v0.1.1 · MIT · by codewithwu

## 5. Visual System

### 5.1 Color Tokens

| Token | Hex | Usage |
| :--- | :--- | :--- |
| `--bg` | `#1e1e1e` | Page background (matches VS Code editor) |
| `--bg-elevated` | `#252526` | Cards, mockup chrome |
| `--bg-elevated-2` | `#2d2d30` | Mockup inner panels, code blocks |
| `--border` | `#3c3c3c` | Hairlines, dividers |
| `--fg` | `#cccccc` | Default text |
| `--fg-muted` | `#858585` | Captions, meta |
| `--fg-strong` | `#ffffff` | Headings |
| `--accent` | `#007ACC` | Primary CTA, links, focus rings (matches galleryBanner) |
| `--accent-hover` | `#1f8ad2` | CTA hover |
| `--success` | `#4ec9b0` | Status "connected", success badges |
| `--danger` | `#f48771` | Error states |
| `--sent` | `#569cd6` | WebSocket "sent" message accent |
| `--received` | `#4ec9b0` | WebSocket "received" message accent |

### 5.2 Typography

- Font stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`
- Monospace: `"JetBrains Mono", "Fira Code", "Cascadia Code", Consolas, monospace`
- Type scale (rem): `0.75 / 0.875 / 1 / 1.125 / 1.5 / 2.25 / 3`
- Line height: `1.6` body, `1.2` headings
- H1 is `clamp(2.25rem, 5vw, 3rem)`, weight 700, letter-spacing `-0.02em`

### 5.3 Spacing & Layout

- Container max-width: `1080px`, centered, `padding-inline: clamp(1rem, 4vw, 2rem)`.
- Vertical rhythm: section padding `clamp(3rem, 8vw, 6rem) 0`.
- Card gap: `1.5rem`.
- Border radius: `6px` for cards/buttons (subtle, matches VS Code), `4px` for code/chips.

### 5.4 Components

- **Buttons** — two variants: primary (filled `--accent`), secondary (outline, transparent fill, `--fg` text, `--border` border). Both have hover state and `:focus-visible` ring (`outline: 2px solid var(--accent); outline-offset: 2px`).
- **Cards** — `--bg-elevated` background, 1px `--border`, 6px radius, `1.5rem` padding, hover lift via `transform: translateY(-2px)` + slightly brighter border.
- **Code/chip** — `--bg-elevated-2`, monospace, 4px radius, smaller padding, optional `[Copy]` button using `navigator.clipboard.writeText` (JS, no library).
- **Mockup window** — chrome bar 32px tall, body padding `0.75rem`, sub-panels stacked with `0.5rem` gap.

### 5.5 Responsive Breakpoints

- `≥960px` — full desktop layout, three-column pillars, side-by-side footer.
- `640–959px` — pillars collapse to single column, mockup stays centered.
- `<640px` — footer stacks, mockup slightly shrinks, padding tightens.

### 5.6 Accessibility

- Color contrast: all text-on-background pairs ≥ WCAG AA (4.5:1 body, 3:1 large).
- All interactive elements are real `<button>` / `<a>` with visible focus ring.
- Decorative SVG icons get `aria-hidden="true"`.
- Tab toggle in mockup uses `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls` for screen readers.
- `prefers-reduced-motion: reduce` disables the message fade-in animation.

## 6. Files & Directory Layout

```
docs/
  intro/
    index.html        ← the page
    style.css         ← all styles
    app.js            ← tab toggle + copy-to-clipboard
    favicon.svg       ← inlined derivative of media/icon.svg
docs/superpowers/specs/
  2026-06-28-html-intro-page-design.md   ← this file
```

The `docs/intro/` path makes GitHub Pages deployment trivial: enable Pages on `main` / `docs/intro` later.

## 7. Out of Scope (Explicit)

- Internationalization (English only this round)
- Analytics, telemetry, cookie banner
- Build tooling, bundlers, preprocessors
- Dark/light mode toggle — the page is dark-only to match VS Code aesthetic; visitors who prefer light themes still get a readable dark page

## 8. Success Criteria

1. Visiting the page, a developer who has never seen the extension can answer within 30 seconds: what it does, why it's different from Postman, how to install.
2. The page renders identically in current Chrome, Firefox, and Safari with no console warnings.
3. Total page weight (HTML + CSS + JS + favicon) is under 50 KB uncompressed, under 15 KB gzipped.
4. Lighthouse score: Performance ≥ 95, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95.
5. The mockup is recognizable as "VS Code sidebar" to a developer without a caption.

## 9. Open Questions

None at draft time. Spec is ready for user review.
