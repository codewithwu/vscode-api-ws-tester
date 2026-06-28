# HTML Intro Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `docs//index.html` (+ `style.css`, `app.js`, `favicon.svg`) — a single dark-themed static page that introduces the `vscode-api-ws-tester` extension and drives installs.

**Architecture:** Pure static HTML/CSS/vanilla JS. No build step, no framework, no CDN. All visual elements (including the "screenshot" of the webview) are drawn with HTML+CSS. The mockup section contains both the HTTP and WebSocket panels in the DOM, swapped via a small JS tab toggle. Ready for GitHub Pages deployment from `docs//`.

**Tech Stack:** HTML5, CSS3 (custom properties, grid, flexbox, container queries where useful), vanilla JavaScript. No npm dependencies.

**Spec:** `docs/superpowers/specs/2026-06-28-html-intro-page-design.md`

**Implementation skill:** When building the HTML/CSS, invoke the `frontend-design` skill for visual polish and layout craft.

---

## File Structure

| Path | Responsibility |
| :--- | :--- |
| `docs//index.html` | Page markup: 6 semantic sections, all copy from spec §4, ARIA tabs in mockup |
| `docs//style.css` | All styles: design tokens, typography, layout, components, mockup, responsive |
| `docs//app.js` | Tab toggle inside mockup, copy-to-clipboard on install command |
| `docs//favicon.svg` | Browser tab icon (simplified derivative of `media/icon.svg`) |

No build step. No package.json inside `docs//`. Open `index.html` directly in a browser to preview.

---

## Verification Strategy

Because the deliverable is static markup, "tests" are validation scripts rather than unit tests. Each task ends with one of:

- **HTML parse check** — `python3 -c "from html.parser import HTMLParser; ..."` confirms the document parses without exceptions.
- **File-size check** — `wc -c` reports byte weight.
- **Visual check** — engineer opens the page in a browser (described for the human reviewer; agents describe rendered output via reasoning).
- **Accessibility check** — small script asserts presence of required ARIA attributes, focus styles, `<title>`, lang, etc.

---

## Task 1: Bootstrap directory and favicon

**Files:**
- Create: `docs//favicon.svg`

- [ ] **Step 1: Create the directory**

```bash
mkdir -p /home/cooper/githubProjects/vscode-api-ws-tester/docs/
```

- [ ] **Step 2: Write a 24×24 simplified favicon**

The plugin's existing icon (`media/icon.svg`) is a 24×24 SVG with a circle and crosshairs. The favicon is a cleaner derivative optimized for small sizes (no thin strokes that disappear at 16×16). Create `docs//favicon.svg`:

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#007ACC" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="9"/>
  <path d="M4 12h16"/>
  <path d="M12 4v16"/>
</svg>
```

- [ ] **Step 3: Verify the file**

```bash
ls -la /home/cooper/githubProjects/vscode-api-ws-tester/docs//favicon.svg
```

Expected: file exists, ~250 bytes.

- [ ] **Step 4: Commit**

```bash
cd /home/cooper/githubProjects/vscode-api-ws-tester
git add docs//favicon.svg
git commit -m "feat(intro): add favicon for landing page"
```

---

## Task 2: HTML skeleton

**Files:**
- Create: `docs//index.html`

- [ ] **Step 1: Write the full HTML skeleton**

All copy is taken verbatim from spec §4. Sections are real `<section>` elements. The mockup uses proper ARIA tabs per spec §5.6.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API & WebSocket Tester — VS Code Extension</title>
  <meta name="description" content="Test HTTP APIs and WebSocket connections right from the VS Code sidebar. No Postman, no websocat, no context switching.">
  <meta name="theme-color" content="#1e1e1e">
  <link rel="icon" type="image/svg+xml" href="favicon.svg">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <header class="hero">
    <div class="container">
      <p class="eyebrow">VS CODE EXTENSION</p>
      <h1>API &amp; WebSocket Tester</h1>
      <p class="tagline">Test HTTP APIs and WebSocket connections right from the sidebar &mdash; no Postman, no <code>websocat</code>, no context switching.</p>
      <div class="hero-actions">
        <a class="btn btn-primary" href="#install">Install</a>
        <a class="btn btn-ghost" href="https://open-vsx.org/extension/codewithwu-cn/vscode-api-ws-tester" rel="noopener" target="_blank">View on Open VSX &rarr;</a>
        <a class="btn btn-ghost" href="https://github.com/codewithwu/vscode-api-ws-tester" rel="noopener" target="_blank">GitHub</a>
      </div>
    </div>
  </header>

  <section class="pillars">
    <div class="container">
      <div class="pillar-grid">
        <article class="pillar">
          <div class="pillar-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M2 12h20"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
          </div>
          <h2>HTTP, all the verbs</h2>
          <p class="pillar-summary">GET, POST, PUT, DELETE, PATCH with full control over headers, body, and auth.</p>
          <ul class="pillar-bullets">
            <li>5 methods</li>
            <li>Headers</li>
            <li>JSON / Text / Form body</li>
            <li>Bearer &amp; Basic auth</li>
          </ul>
        </article>

        <article class="pillar">
          <div class="pillar-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2 12h6l2-3 4 6 2-3h6"/>
              <path d="M5 4h2"/>
              <path d="M17 20h2"/>
              <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
            </svg>
          </div>
          <h2>Real-time, in the editor</h2>
          <p class="pillar-summary">Connect to <code>ws://</code> and <code>wss://</code>, send and receive messages with live timestamps.</p>
          <ul class="pillar-bullets">
            <li>Connect / disconnect</li>
            <li>Send &amp; receive</li>
            <li>Timestamped log</li>
            <li>Status indicator</li>
          </ul>
        </article>

        <article class="pillar">
          <div class="pillar-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          </div>
          <h2>Built for the flow</h2>
          <p class="pillar-summary">Stays out of your way: history, collections, theme-aware UI, keyboard shortcuts.</p>
          <ul class="pillar-bullets">
            <li>50-item history</li>
            <li>Saved collections</li>
            <li>Dark / light theme</li>
            <li>Shortcuts</li>
          </ul>
        </article>
      </div>
    </div>
  </section>

  <section class="mockup-section">
    <div class="container">
      <h2 class="section-title">See it in action</h2>
      <div class="mockup-window" role="region" aria-label="API Tester interface preview">
        <div class="mockup-chrome">
          <span class="mockup-dot" aria-hidden="true"></span>
          <span class="mockup-dot" aria-hidden="true"></span>
          <span class="mockup-dot" aria-hidden="true"></span>
          <div class="mockup-tabs" role="tablist" aria-label="Protocol">
            <button role="tab" id="tab-http" aria-selected="true" aria-controls="panel-http">HTTP</button>
            <button role="tab" id="tab-ws" aria-selected="false" aria-controls="panel-ws" tabindex="-1">WebSocket</button>
          </div>
        </div>

        <div class="mockup-body">
          <!-- HTTP panel -->
          <div role="tabpanel" id="panel-http" aria-labelledby="tab-http" class="mockup-panel">
            <div class="request-line">
              <span class="method">POST</span>
              <input class="url" type="text" value="https://api.example.com/users" readonly aria-label="Request URL">
              <button class="mockup-btn primary" type="button">Send</button>
            </div>
            <div class="subtabs">
              <button class="subtab active" type="button">Headers</button>
              <button class="subtab" type="button">Body</button>
              <button class="subtab" type="button">Auth</button>
            </div>
            <div class="kv-list">
              <div class="kv-row"><span class="kv-key">Content-Type</span><span class="kv-val">application/json</span></div>
              <div class="kv-row"><span class="kv-key">Authorization</span><span class="kv-val">Bearer &middot;&middot;&middot;</span></div>
            </div>
            <div class="response">
              <div class="response-meta">
                <span class="status status-ok">200 OK</span>
                <span class="meta-sep">&middot;</span>
                <span class="meta-time">156ms</span>
                <span class="meta-sep">&middot;</span>
                <span class="meta-size">2.3KB</span>
              </div>
              <pre class="response-body"><code><span class="j-key">"id"</span>: <span class="j-num">42</span>,
<span class="j-key">"name"</span>: <span class="j-str">"Ada"</span>,
<span class="j-key">"created"</span>: <span class="j-str">"2026-06-28"</span>,</code></pre>
            </div>
          </div>

          <!-- WebSocket panel -->
          <div role="tabpanel" id="panel-ws" aria-labelledby="tab-ws" class="mockup-panel" hidden>
            <div class="request-line">
              <input class="url" type="text" value="wss://echo.websocket.org" readonly aria-label="WebSocket URL">
              <button class="mockup-btn" type="button">Disconnect</button>
            </div>
            <div class="ws-status">
              <span class="status-dot status-dot-connected" aria-hidden="true"></span>
              <span>Connected</span>
            </div>
            <div class="ws-log">
              <div class="ws-msg ws-sent"><span class="ws-arrow">&rarr;</span><span class="ws-time">10:00:01</span><span class="ws-text">Hello Server</span></div>
              <div class="ws-msg ws-received"><span class="ws-arrow">&larr;</span><span class="ws-time">10:00:02</span><span class="ws-text">Server received</span></div>
              <div class="ws-msg ws-sent"><span class="ws-arrow">&rarr;</span><span class="ws-time">10:00:05</span><span class="ws-text">{"type":"ping"}</span></div>
              <div class="ws-msg ws-received"><span class="ws-arrow">&larr;</span><span class="ws-time">10:00:05</span><span class="ws-text">{"type":"pong"}</span></div>
            </div>
            <div class="ws-input-row">
              <input class="url" type="text" value="Type a message&hellip;" readonly aria-label="Message">
              <button class="mockup-btn primary" type="button">Send</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="shortcuts">
    <div class="container">
      <h2 class="section-title">Keyboard shortcuts</h2>
      <div class="shortcut-grid">
        <div class="shortcut">
          <div class="shortcut-keys"><kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>W</kbd></div>
          <p>Open the tester panel</p>
        </div>
        <div class="shortcut">
          <div class="shortcut-keys"><kbd>Ctrl</kbd> + <kbd>Enter</kbd></div>
          <p>Send request / message</p>
        </div>
      </div>
    </div>
  </section>

  <section class="install" id="install">
    <div class="container">
      <h2 class="section-title">Install in one command</h2>
      <div class="install-block">
        <div class="terminal">
          <span class="terminal-prompt" aria-hidden="true">$</span>
          <code class="install-cmd">code --install-extension codewithwu-cn.vscode-api-ws-tester</code>
          <button class="copy-btn" type="button" data-copy="code --install-extension codewithwu-cn.vscode-api-ws-tester" aria-label="Copy install command">Copy</button>
        </div>
        <p class="install-alt">or <a href="https://github.com/codewithwu/vscode-api-ws-tester/releases/latest" rel="noopener" target="_blank">download the .vsix</a></p>
      </div>
    </div>
  </section>

  <footer class="site-footer">
    <div class="container footer-grid">
      <div>
        <h3>Project</h3>
        <ul>
          <li><a href="https://github.com/codewithwu/vscode-api-ws-tester" rel="noopener" target="_blank">GitHub repo</a></li>
          <li><a href="https://github.com/codewithwu/vscode-api-ws-tester/issues" rel="noopener" target="_blank">Issues</a></li>
        </ul>
      </div>
      <div>
        <h3>Links</h3>
        <ul>
          <li><a href="https://open-vsx.org/extension/codewithwu-cn/vscode-api-ws-tester" rel="noopener" target="_blank">Open VSX</a></li>
          <li><a href="https://github.com/codewithwu/vscode-api-ws-tester/blob/main/prd.md" rel="noopener" target="_blank">PRD</a></li>
        </ul>
      </div>
      <div>
        <h3>Meta</h3>
        <p>v0.1.1 &middot; MIT &middot; by <a href="https://github.com/codewithwu" rel="noopener" target="_blank">codewithwu</a></p>
      </div>
    </div>
  </footer>

  <script src="app.js" defer></script>
</body>
</html>
```

- [ ] **Step 2: Verify the HTML parses**

```bash
python3 - <<'PY'
from html.parser import HTMLParser
class V(HTMLParser):
    def error(self, msg): raise SystemExit(f"Parse error: {msg}")
V().feed(open('/home/cooper/githubProjects/vscode-api-ws-tester/docs//index.html').read())
print("OK")
PY
```

Expected: prints `OK`.

- [ ] **Step 3: Verify required elements are present**

```bash
grep -c '<section' /home/cooper/githubProjects/vscode-api-ws-tester/docs//index.html
grep -c 'role="tab"' /home/cooper/githubProjects/vscode-api-ws-tester/docs//index.html
grep -q '<title>API & WebSocket Tester' /home/cooper/githubProjects/vscode-api-ws-tester/docs//index.html && echo "title OK"
```

Expected: `6`, `2`, `title OK`.

- [ ] **Step 4: Commit**

```bash
cd /home/cooper/githubProjects/vscode-api-ws-tester
git add docs//index.html
git commit -m "feat(intro): add HTML skeleton with all 6 sections"
```

---

## Task 3: CSS foundation (tokens, reset, typography, layout)

**Files:**
- Create: `docs//style.css`

- [ ] **Step 1: Write the foundation styles**

Tokens and base styles only. Component-specific styles arrive in later tasks.

```css
/* ===== Design Tokens (spec §5.1) ===== */
:root {
  --bg: #1e1e1e;
  --bg-elevated: #252526;
  --bg-elevated-2: #2d2d30;
  --border: #3c3c3c;
  --fg: #cccccc;
  --fg-muted: #858585;
  --fg-strong: #ffffff;
  --accent: #007ACC;
  --accent-hover: #1f8ad2;
  --success: #4ec9b0;
  --danger: #f48771;
  --sent: #569cd6;
  --received: #4ec9b0;

  /* Typography (spec §5.2) */
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  --font-mono: "JetBrains Mono", "Fira Code", "Cascadia Code", Consolas, monospace;

  /* Layout (spec §5.3) */
  --container: 1080px;
  --radius: 6px;
  --radius-sm: 4px;
}

/* ===== Reset ===== */
*, *::before, *::after { box-sizing: border-box; }
* { margin: 0; }
html { -webkit-text-size-adjust: 100%; }
body {
  background: var(--bg);
  color: var(--fg);
  font-family: var(--font-sans);
  font-size: 1rem;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
img, svg { display: block; max-width: 100%; }
a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }
button { font: inherit; cursor: pointer; }
input { font: inherit; }
h1, h2, h3 { color: var(--fg-strong); line-height: 1.2; letter-spacing: -0.02em; }
code, kbd { font-family: var(--font-mono); }

/* ===== Layout primitives (spec §5.3) ===== */
.container {
  max-width: var(--container);
  margin-inline: auto;
  padding-inline: clamp(1rem, 4vw, 2rem);
}
.section-title {
  font-size: clamp(1.5rem, 3vw, 2.25rem);
  margin-bottom: 1.5rem;
  text-align: center;
}

/* ===== Accessibility baseline (spec §5.6) ===== */
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  border-radius: 2px;
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    transition-duration: 0.001ms !important;
  }
}
```

- [ ] **Step 2: Verify the file loads**

Open `docs//index.html` in a browser (or run a quick smoke check):

```bash
wc -c /home/cooper/githubProjects/vscode-api-ws-tester/docs//style.css
```

Expected: ~2 KB, browser shows dark background with default white-ish text.

- [ ] **Step 3: Commit**

```bash
cd /home/cooper/githubProjects/vscode-api-ws-tester
git add docs//style.css
git commit -m "feat(intro): add CSS foundation (tokens, reset, layout)"
```

---

## Task 4: Style the Hero section

**Files:**
- Modify: `docs//style.css` (append)

- [ ] **Step 1: Append hero styles**

```css
/* ===== Hero (spec §4.1) ===== */
.hero {
  padding: clamp(4rem, 10vw, 8rem) 0 clamp(3rem, 8vw, 6rem);
  text-align: center;
}
.hero .eyebrow {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  color: var(--accent);
  text-transform: uppercase;
  margin-bottom: 1rem;
}
.hero h1 {
  font-size: clamp(2.25rem, 5vw, 3rem);
  font-weight: 700;
  margin-bottom: 1rem;
}
.hero .tagline {
  font-size: 1.125rem;
  color: var(--fg-muted);
  max-width: 36rem;
  margin: 0 auto 2rem;
}
.hero .tagline code {
  background: var(--bg-elevated-2);
  color: var(--fg);
  padding: 0.125em 0.4em;
  border-radius: var(--radius-sm);
  font-size: 0.9em;
}
.hero-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
}

/* Buttons (spec §5.4) */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.625rem 1.25rem;
  border-radius: var(--radius);
  font-weight: 600;
  font-size: 0.9375rem;
  border: 1px solid transparent;
  text-decoration: none;
  transition: background 120ms ease, border-color 120ms ease, transform 120ms ease;
}
.btn:hover { text-decoration: none; }
.btn-primary {
  background: var(--accent);
  color: #fff;
}
.btn-primary:hover { background: var(--accent-hover); }
.btn-ghost {
  background: transparent;
  color: var(--fg);
  border-color: var(--border);
}
.btn-ghost:hover { border-color: var(--accent); color: var(--fg-strong); }
```

- [ ] **Step 2: Visual check**

Open `docs//index.html` in a browser. Hero should show:
- Blue uppercase eyebrow text
- Large white title
- Muted gray tagline with monospace `websocat`
- Three buttons in a row: filled blue "Install", two ghost-style links

If any visual mismatch, adjust colors/spacing in this section's CSS.

- [ ] **Step 3: Commit**

```bash
cd /home/cooper/githubProjects/vscode-api-ws-tester
git add docs//style.css
git commit -m "feat(intro): style hero section"
```

---

## Task 5: Style the Three Pillars section

**Files:**
- Modify: `docs//style.css` (append)

- [ ] **Step 1: Append pillar styles**

```css
/* ===== Pillars (spec §4.2) ===== */
.pillars {
  padding: clamp(3rem, 8vw, 6rem) 0;
}
.pillar-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}
.pillar {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.5rem;
  transition: transform 160ms ease, border-color 160ms ease;
}
.pillar:hover {
  transform: translateY(-2px);
  border-color: #4d4d4d;
}
.pillar-icon {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  background: var(--bg-elevated-2);
  border-radius: var(--radius-sm);
  color: var(--accent);
  margin-bottom: 1rem;
}
.pillar-icon svg { width: 24px; height: 24px; }
.pillar h2 {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
}
.pillar-summary {
  color: var(--fg-muted);
  font-size: 0.9375rem;
  margin-bottom: 1rem;
}
.pillar-bullets {
  list-style: none;
  padding: 0;
  font-size: 0.875rem;
  color: var(--fg);
}
.pillar-bullets li {
  padding: 0.25rem 0;
  border-top: 1px solid var(--border);
}
.pillar-bullets li:first-child { border-top: none; }
```

- [ ] **Step 2: Visual check**

Open in browser. Three cards should sit side by side on desktop, each with:
- 40×40 blue-icon container
- Heading, muted summary, four bullets separated by hairline dividers
- Slight lift on hover

If grid is wrong, verify `repeat(3, 1fr)` and that the parent has no conflicting display.

- [ ] **Step 3: Commit**

```bash
cd /home/cooper/githubProjects/vscode-api-ws-tester
git add docs//style.css
git commit -m "feat(intro): style three pillars grid"
```

---

## Task 6: Style the Mockup frame + tab strip

**Files:**
- Modify: `docs//style.css` (append)

- [ ] **Step 1: Append mockup frame styles**

```css
/* ===== Mockup window (spec §4.3) ===== */
.mockup-section {
  padding: clamp(3rem, 8vw, 6rem) 0;
}
.mockup-window {
  max-width: 540px;
  margin: 0 auto;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: 0 30px 60px -20px rgba(0,0,0,0.5);
}
.mockup-chrome {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.75rem;
  background: var(--bg-elevated-2);
  border-bottom: 1px solid var(--border);
}
.mockup-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #4d4d4d;
}
.mockup-tabs {
  display: flex;
  gap: 0.25rem;
  margin-left: auto;
}
.mockup-tabs button {
  background: transparent;
  color: var(--fg-muted);
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  padding: 0.25rem 0.75rem;
  font-size: 0.8125rem;
}
.mockup-tabs button[aria-selected="true"] {
  background: var(--bg-elevated);
  color: var(--fg-strong);
  border-color: var(--border);
}
.mockup-body {
  padding: 0.75rem;
  min-height: 380px;
}
.mockup-panel { display: flex; flex-direction: column; gap: 0.5rem; }
.mockup-panel[hidden] { display: none; }
```

- [ ] **Step 2: Visual check**

Open in browser. You should see a dark "window" with three gray dots, and two tabs on the right with HTTP selected. Both panels render stacked inside (we'll style them next).

- [ ] **Step 3: Commit**

```bash
cd /home/cooper/githubProjects/vscode-api-ws-tester
git add docs//style.css
git commit -m "feat(intro): style mockup frame and tab strip"
```

---

## Task 7: Style the HTTP mockup body

**Files:**
- Modify: `docs//style.css` (append)

- [ ] **Step 1: Append HTTP panel styles**

```css
/* ===== Mockup: HTTP panel (spec §4.3) ===== */
.request-line {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
.method {
  background: var(--accent);
  color: #fff;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.375rem 0.625rem;
  border-radius: var(--radius-sm);
  letter-spacing: 0.05em;
}
.url {
  flex: 1;
  background: var(--bg);
  color: var(--fg);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 0.375rem 0.625rem;
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  min-width: 0;
}
.mockup-btn {
  background: var(--bg-elevated-2);
  color: var(--fg);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 0.375rem 0.875rem;
  font-size: 0.8125rem;
  font-weight: 600;
}
.mockup-btn.primary {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}
.subtabs {
  display: flex;
  gap: 0.25rem;
  border-bottom: 1px solid var(--border);
  padding-bottom: 0.25rem;
}
.subtab {
  background: transparent;
  color: var(--fg-muted);
  border: none;
  padding: 0.25rem 0.5rem;
  font-size: 0.8125rem;
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
}
.subtab.active { color: var(--fg-strong); border-bottom: 2px solid var(--accent); }
.kv-list { display: flex; flex-direction: column; gap: 0.25rem; }
.kv-row {
  display: flex;
  gap: 0.5rem;
  font-family: var(--font-mono);
  font-size: 0.8125rem;
}
.kv-key { color: var(--accent); min-width: 7rem; }
.kv-val { color: var(--fg); }
.response {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 0.625rem;
  margin-top: 0.25rem;
}
.response-meta {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  font-size: 0.75rem;
  margin-bottom: 0.5rem;
}
.status { font-weight: 700; font-family: var(--font-mono); }
.status-ok { color: var(--success); }
.meta-sep { color: var(--fg-muted); }
.meta-time, .meta-size { color: var(--fg-muted); }
.response-body {
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  color: var(--fg);
  white-space: pre;
  overflow-x: auto;
  margin: 0;
}
.j-key { color: var(--accent); }
.j-str { color: var(--success); }
.j-num { color: #b5cea8; }
```

- [ ] **Step 2: Visual check**

HTTP panel should show:
- Blue `POST` chip, URL field, blue `Send` button
- Headers/Body/Auth sub-tab row
- Two key/value rows (blue keys, gray values)
- Response panel with green `200 OK`, JSON with colored tokens

- [ ] **Step 3: Commit**

```bash
cd /home/cooper/githubProjects/vscode-api-ws-tester
git add docs//style.css
git commit -m "feat(intro): style HTTP mockup body"
```

---

## Task 8: Style the WebSocket mockup body

**Files:**
- Modify: `docs//style.css` (append)

- [ ] **Step 1: Append WebSocket panel styles**

```css
/* ===== Mockup: WebSocket panel (spec §4.3) ===== */
.ws-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: var(--fg);
}
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}
.status-dot-connected {
  background: var(--success);
  box-shadow: 0 0 0 0 var(--success);
  animation: pulse 1.8s ease-out infinite;
}
@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(78,201,176,0.6); }
  70% { box-shadow: 0 0 0 8px rgba(78,201,176,0); }
  100% { box-shadow: 0 0 0 0 rgba(78,201,176,0); }
}
.ws-log {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  flex: 1;
}
.ws-msg {
  display: grid;
  grid-template-columns: 16px 56px 1fr;
  gap: 0.5rem;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  padding: 0.25rem 0.375rem;
  border-radius: var(--radius-sm);
}
.ws-sent { color: var(--sent); background: rgba(86,156,214,0.08); }
.ws-received { color: var(--received); background: rgba(78,201,176,0.08); }
.ws-arrow { font-weight: 700; }
.ws-time { color: var(--fg-muted); }
.ws-text { color: var(--fg); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ws-input-row { display: flex; gap: 0.5rem; }
.ws-input-row .url { flex: 1; }
```

- [ ] **Step 2: Visual check**

WebSocket panel should show:
- URL input + Disconnect button
- Pulsing green status dot + "Connected" text
- Four message log rows alternating blue/green tinted, with arrow + time + payload
- Bottom input + Send button

(You can temporarily toggle visibility to inspect this panel: in DevTools remove the `hidden` attribute from `#panel-ws` and add `hidden` to `#panel-http`.)

- [ ] **Step 3: Commit**

```bash
cd /home/cooper/githubProjects/vscode-api-ws-tester
git add docs//style.css
git commit -m "feat(intro): style WebSocket mockup body"
```

---

## Task 9: Style Shortcuts, Install, and Footer sections

**Files:**
- Modify: `docs//style.css` (append)

- [ ] **Step 1: Append remaining section styles**

```css
/* ===== Shortcuts (spec §4.4) ===== */
.shortcuts {
  padding: clamp(3rem, 8vw, 6rem) 0;
}
.shortcut-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  max-width: 640px;
  margin: 0 auto;
}
.shortcut {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.5rem;
  text-align: center;
}
.shortcut-keys {
  display: flex;
  gap: 0.375rem;
  justify-content: center;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}
kbd {
  background: var(--bg-elevated-2);
  color: var(--fg-strong);
  border: 1px solid var(--border);
  border-bottom-width: 2px;
  border-radius: var(--radius-sm);
  padding: 0.25rem 0.5rem;
  font-size: 0.8125rem;
  font-family: var(--font-mono);
}
.shortcut p { color: var(--fg-muted); font-size: 0.9375rem; }

/* ===== Install (spec §4.5) ===== */
.install {
  padding: clamp(3rem, 8vw, 6rem) 0;
}
.install-block {
  max-width: 640px;
  margin: 0 auto;
}
.terminal {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #0e0e0e;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 0.875rem 1rem;
}
.terminal-prompt {
  color: var(--success);
  font-family: var(--font-mono);
  font-weight: 700;
}
.install-cmd {
  flex: 1;
  font-family: var(--font-mono);
  font-size: 0.9375rem;
  color: var(--fg);
  background: transparent;
  white-space: nowrap;
  overflow-x: auto;
}
.copy-btn {
  background: var(--bg-elevated-2);
  color: var(--fg);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
}
.copy-btn:hover { border-color: var(--accent); color: var(--fg-strong); }
.copy-btn.copied { color: var(--success); border-color: var(--success); }
.install-alt {
  margin-top: 1rem;
  font-size: 0.875rem;
  color: var(--fg-muted);
  text-align: center;
}

/* ===== Footer (spec §4.6) ===== */
.site-footer {
  border-top: 1px solid var(--border);
  padding: clamp(2rem, 5vw, 3rem) 0;
  margin-top: clamp(2rem, 5vw, 4rem);
}
.footer-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
}
.site-footer h3 {
  font-size: 0.75rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--fg-muted);
  margin-bottom: 0.75rem;
}
.site-footer ul { list-style: none; padding: 0; }
.site-footer li { margin-bottom: 0.5rem; font-size: 0.875rem; }
.site-footer p { font-size: 0.875rem; color: var(--fg-muted); }
```

- [ ] **Step 2: Visual check**

Three remaining sections render correctly: shortcut chips side-by-side, dark terminal block with green `$` prompt, three-column footer.

- [ ] **Step 3: Commit**

```bash
cd /home/cooper/githubProjects/vscode-api-ws-tester
git add docs//style.css
git commit -m "feat(intro): style shortcuts, install, and footer"
```

---

## Task 10: JavaScript (tab toggle + copy to clipboard)

**Files:**
- Create: `docs//app.js`

- [ ] **Step 1: Write app.js with tab toggle and copy logic**

```javascript
(function () {
  'use strict';

  // --- Tab toggle inside the mockup (spec §4.3, §5.6) ---
  const tablist = document.querySelector('[role="tablist"]');
  if (tablist) {
    const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
    const panels = tabs.map(t => document.getElementById(t.getAttribute('aria-controls')));

    function activate(tab) {
      tabs.forEach((t, i) => {
        const selected = t === tab;
        t.setAttribute('aria-selected', String(selected));
        t.setAttribute('tabindex', selected ? '0' : '-1');
        if (panels[i]) {
          if (selected) {
            panels[i].removeAttribute('hidden');
          } else {
            panels[i].setAttribute('hidden', '');
          }
        }
      });
    }

    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => activate(tab));
      tab.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          const dir = e.key === 'ArrowRight' ? 1 : -1;
          const next = tabs[(i + dir + tabs.length) % tabs.length];
          activate(next);
          next.focus();
        }
      });
    });
  }

  // --- Copy to clipboard on the install command (spec §5.4) ---
  document.querySelectorAll('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const text = btn.getAttribute('data-copy') || '';
      try {
        await navigator.clipboard.writeText(text);
        const original = btn.textContent;
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = original;
          btn.classList.remove('copied');
        }, 1500);
      } catch (err) {
        // Fallback for older browsers / non-secure contexts
        btn.textContent = 'Press Ctrl+C';
        setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
      }
    });
  });
})();
```

- [ ] **Step 2: Verify syntax**

```bash
node --check /home/cooper/githubProjects/vscode-api-ws-tester/docs//app.js && echo OK
```

Expected: prints `OK`.

- [ ] **Step 3: Manual interaction check**

Open in browser:
- Click the **WebSocket** tab inside the mockup: HTTP panel hides, WebSocket panel shows, focus moves correctly. Press `←` / `→`: tabs cycle.
- Click **Copy** on the install command: button briefly says `Copied!` and pasting in another window shows the install command.

- [ ] **Step 4: Commit**

```bash
cd /home/cooper/githubProjects/vscode-api-ws-tester
git add docs//app.js
git commit -m "feat(intro): add tab toggle and copy-to-clipboard"
```

---

## Task 11: Responsive breakpoints

**Files:**
- Modify: `docs//style.css` (append)

- [ ] **Step 1: Append media queries**

```css
/* ===== Responsive (spec §5.5) ===== */
@media (max-width: 959px) {
  .pillar-grid { grid-template-columns: 1fr; }
  .footer-grid { grid-template-columns: 1fr; gap: 1.5rem; }
}
@media (max-width: 639px) {
  .mockup-window { max-width: 100%; }
  .shortcut-grid { grid-template-columns: 1fr; }
  .hero-actions { flex-direction: column; align-items: stretch; }
  .hero-actions .btn { width: 100%; }
  .terminal { flex-wrap: wrap; }
  .install-cmd { font-size: 0.8125rem; }
}
```

- [ ] **Step 2: Visual check at three widths**

Resize the browser (or use DevTools responsive mode) and verify:
- ≥ 960px: full desktop layout
- 640–959px: pillars stack, footer stacks, mockup stays centered
- < 640px: shortcuts stack, hero buttons stretch full-width, mockup fills width

- [ ] **Step 3: Commit**

```bash
cd /home/cooper/githubProjects/vscode-api-ws-tester
git add docs//style.css
git commit -m "feat(intro): add responsive breakpoints"
```

---

## Task 12: Accessibility & SEO polish

**Files:**
- Modify: `docs//index.html`

- [ ] **Step 1: Add Open Graph and Twitter meta tags**

Insert immediately after the existing `<title>` block in `<head>` (before `<link rel="icon">`):

```html
    <meta property="og:type" content="website">
    <meta property="og:title" content="API & WebSocket Tester — VS Code Extension">
    <meta property="og:description" content="Test HTTP APIs and WebSocket connections right from the VS Code sidebar.">
    <meta property="og:image" content="favicon.svg">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="API & WebSocket Tester — VS Code Extension">
    <meta name="twitter:description" content="Test HTTP APIs and WebSocket connections right from the VS Code sidebar.">
```

- [ ] **Step 2: Add a skip link for keyboard users**

Insert immediately after `<body>`:

```html
  <a class="skip-link" href="#install">Skip to install</a>
```

- [ ] **Step 3: Add skip-link and visibility-only utility styles**

Append to `docs//style.css`:

```css
/* ===== Skip link (a11y) ===== */
.skip-link {
  position: absolute;
  top: -40px;
  left: 1rem;
  background: var(--accent);
  color: #fff;
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-sm);
  z-index: 100;
  text-decoration: none;
}
.skip-link:focus { top: 1rem; }
```

- [ ] **Step 4: Verify a11y basics**

```bash
cd /home/cooper/githubProjects/vscode-api-ws-tester
grep -q 'lang="en"' docs//index.html && echo "lang OK"
grep -q 'aria-hidden="true"' docs//index.html && echo "aria-hidden OK"
grep -q 'role="tab"' docs//index.html && echo "tabs OK"
grep -q ':focus-visible' docs//style.css && echo "focus-visible OK"
grep -q 'prefers-reduced-motion' docs//style.css && echo "reduced-motion OK"
```

Expected: all five `OK`.

- [ ] **Step 5: Commit**

```bash
cd /home/cooper/githubProjects/vscode-api-ws-tester
git add docs//index.html docs//style.css
git commit -m "feat(intro): add OG meta, skip link, a11y polish"
```

---

## Task 13: Final verification and weight check

**Files:**
- Modify: `.gitignore` (only if needed for `docs//` build artifacts — likely no change)

- [ ] **Step 1: Page weight check**

```bash
cd /home/cooper/githubProjects/vscode-api-ws-tester/docs/
wc -c index.html style.css app.js favicon.svg
```

Expected: total < 50 KB uncompressed (spec §8.3). If over, audit the largest file for unused selectors / oversized SVGs.

- [ ] **Step 2: Gzipped size check (proxy for transfer size)**

```bash
cd /home/cooper/githubProjects/vscode-api-ws-tester/docs/
gzip -c index.html | wc -c
gzip -c style.css | wc -c
gzip -c app.js | wc -c
```

Sum and confirm < 15 KB gzipped (spec §8.3).

- [ ] **Step 3: HTML parse check (final)**

```bash
python3 - <<'PY'
from html.parser import HTMLParser
class V(HTMLParser):
    def error(self, msg): raise SystemExit(f"Parse error: {msg}")
V().feed(open('/home/cooper/githubProjects/vscode-api-ws-tester/docs//index.html').read())
print("OK")
PY
```

Expected: `OK`.

- [ ] **Step 4: Full-page visual review**

Open the page in a browser. Walk through the success criteria from spec §8:

1. Within 30 seconds: read what it does, why it's different from Postman, how to install. ✅
2. Renders without console warnings. ✅ (check DevTools)
3. Pillars and mockup are recognizable. ✅
4. Tab toggle and Copy button work. ✅
5. Page reads correctly at three widths. ✅

If any criterion fails, fix the relevant section and amend the previous commit (or add a follow-up commit).

- [ ] **Step 5: Commit any final adjustments**

If adjustments were needed:

```bash
cd /home/cooper/githubProjects/vscode-api-ws-tester
git add docs//
git commit -m "polish(intro): final visual adjustments"
```

If no adjustments, skip this step.

---

## Done

`docs//` now contains a self-contained, dependency-free static page that meets the spec. To deploy later: enable GitHub Pages on `main` / `docs/` (or move the contents to a `gh-pages` branch — out of scope for this plan).
