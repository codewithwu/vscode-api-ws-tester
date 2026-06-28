# VS Code API & WebSocket Tester Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete VS Code extension that lets developers test HTTP APIs and WebSocket connections from the sidebar, with full MVP v1.0 scope from `prd.md`.

**Architecture:** Extension-side business logic (HttpService, WsService, HistoryService, CollectionService) written in TypeScript with TDD; sidebar Webview rendered as native HTML/CSS using VS Code theme variables, communicating with the extension via postMessage.

**Tech Stack:** TypeScript, VS Code Extension API (^1.74.0), Node.js `http`/`https` (native), `ws@8` for WebSocket, `@vscode/test-electron` + Mocha for tests, `vsce` for packaging.

**Spec:** `docs/superpowers/specs/2026-06-28-vscode-api-ws-tester-design.md`

---

## File Structure

```
vscode-api-ws-tester/
├── package.json                 ← Extension manifest (commands, views, keybindings, deps)
├── tsconfig.json                ← TS config: outDir=dist, rootDir=src, target=ES2020
├── .eslintrc.json               ← ESLint config
├── .gitignore                   ← Node/VS Code standard ignores
├── .vscodeignore                ← What to exclude from .vsix
├── README.md                    ← User-facing docs
├── src/
│   ├── extension.ts             ← activate(): register provider + commands
│   ├── services/
│   │   ├── HttpService.ts       ← Send HTTP requests, parse responses
│   │   ├── WsService.ts         ← Manage single WS connection + message buffer
│   │   ├── HistoryService.ts    ← Persist last 50 requests in globalState
│   │   └── CollectionService.ts ← CRUD saved requests in globalState
│   ├── webview/
│   │   └── ApiTesterViewProvider.ts ← Webview lifecycle + message routing
│   ├── commands/
│   │   └── index.ts             ← Command implementations (send, connect, disconnect)
│   ├── utils/
│   │   ├── format.ts            ← JSON formatter, byte size formatter
│   │   └── id.ts                ← uuid v4 generator
│   └── types.ts                 ← Shared interfaces (HistoryItem, CollectionItem, WsMessage)
├── media/
│   ├── icon.svg                 ← Sidebar activity bar icon
│   ├── index.html               ← Webview HTML skeleton with CSP
│   ├── main.js                  ← Webview UI logic (HTTP + WS tabs)
│   └── style.css                ← Theme-aware styles using --vscode-* variables
└── test/
    ├── runTest.ts               ← VS Code test runner entry
    ├── suite/
    │   ├── index.ts             ← Mocha bootstrap
    │   ├── HttpService.test.ts  ← HTTP request tests (mock)
    │   ├── WsService.test.ts    ← WS tests (mock)
    │   ├── HistoryService.test.ts
    │   ├── CollectionService.test.ts
    │   └── format.test.ts
```

---

## Phase 1 — Project Initialization

### Task 1: Create package.json

**Files:**
- Create: `package.json`

- [ ] **Step 1: Write package.json**

```json
{
  "name": "vscode-api-ws-tester",
  "displayName": "API & WebSocket Tester",
  "description": "Test HTTP APIs and WebSocket connections directly in VS Code",
  "version": "0.1.0",
  "publisher": "local",
  "engines": {
    "vscode": "^1.74.0",
    "node": ">=16"
  },
  "categories": ["Other"],
  "activationEvents": [
    "onView:apiTester.view"
  ],
  "main": "./dist/src/extension.js",
  "contributes": {
    "viewsContainers": {
      "activitybar": [
        {
          "id": "apiTester.container",
          "title": "API Tester",
          "icon": "media/icon.svg"
        }
      ]
    },
    "views": {
      "apiTester.container": [
        {
          "type": "webview",
          "id": "apiTester.view",
          "name": "API & WebSocket Tester"
        }
      ]
    },
    "commands": [
      {
        "command": "api-tester.openView",
        "title": "Open API & WebSocket Tester",
        "category": "API Tester"
      },
      {
        "command": "api-tester.sendRequest",
        "title": "Send Request",
        "category": "API Tester"
      },
      {
        "command": "api-tester.connectWs",
        "title": "Connect WebSocket",
        "category": "API Tester"
      },
      {
        "command": "api-tester.disconnectWs",
        "title": "Disconnect WebSocket",
        "category": "API Tester"
      }
    ],
    "keybindings": [
      {
        "command": "api-tester.sendRequest",
        "key": "ctrl+enter",
        "when": "webviewId == 'apiTester.view'"
      },
      {
        "command": "api-tester.openView",
        "key": "ctrl+shift+w"
      }
    ],
    "menus": {
      "editor/context/contextCopy": [],
      "webview/context": [
        {
          "command": "api-tester.copy",
          "group": "1_copy"
        }
      ]
    }
  },
  "scripts": {
    "build": "tsc -p ./",
    "watch": "tsc -watch -p ./",
    "test": "node ./dist/test/runTest.js",
    "lint": "eslint src --ext ts",
    "package": "vsce package"
  },
  "devDependencies": {
    "@types/mocha": "^10.0.6",
    "@types/node": "^18.19.0",
    "@types/vscode": "^1.74.0",
    "@types/ws": "^8.5.10",
    "@vscode/test-electron": "^2.3.8",
    "eslint": "^8.56.0",
    "typescript": "^5.3.3",
    "vsce": "^2.22.0"
  },
  "dependencies": {
    "ws": "^8.16.0"
  }
}
```

- [ ] **Step 2: Verify JSON is valid**

Run: `node -e "JSON.parse(require('fs').readFileSync('package.json','utf8'));console.log('OK')"`
Expected: `OK`

- [ ] **Step 3: Install dependencies**

Run: `npm install`
Expected: `node_modules/` created, no errors

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: add package.json with manifest, commands, and dependencies"
```

---

### Task 2: Add TypeScript, ESLint, and ignore files

**Files:**
- Create: `tsconfig.json`
- Create: `.eslintrc.json`
- Create: `.gitignore`
- Create: `.vscodeignore`

- [ ] **Step 1: Write tsconfig.json**

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2020",
    "outDir": "dist",
    "rootDir": ".",
    "lib": ["ES2020", "DOM"],
    "sourceMap": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "declaration": false
  },
  "include": ["src/**/*", "test/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 2: Write .eslintrc.json**

```json
{
  "root": true,
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2020,
    "sourceType": "module"
  },
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "warn",
    "@typescript-eslint/explicit-function-return-type": "off",
    "no-console": "off"
  },
  "env": {
    "node": true,
    "es2020": true,
    "mocha": true
  }
}
```

Note: ESLint will warn about missing `@typescript-eslint/parser` until we add it in step 4.

- [ ] **Step 3: Write .gitignore**

```
node_modules/
dist/
out/
*.vsix
.vscode-test/
.DS_Store
*.log
coverage/
```

- [ ] **Step 4: Write .vscodeignore**

```
node_modules/**
src/**
test/**
.vscode-test/**
.eslintrc.json
tsconfig.json
.gitignore
*.log
```

- [ ] **Step 5: Add ESLint TypeScript parser**

Run: `npm install --save-dev @typescript-eslint/parser @typescript-eslint/eslint-plugin`
Expected: devDependencies added, no errors

- [ ] **Step 6: Verify build target compiles (empty src)**

Run: `npx tsc --noEmit`
Expected: exits 0 (no source files yet is OK)

- [ ] **Step 7: Commit**

```bash
git add tsconfig.json .eslintrc.json .gitignore .vscodeignore package.json package-lock.json
git commit -m "chore: add tsconfig, eslint, and ignore files"
```

---

### Task 3: Write shared types

**Files:**
- Create: `src/types.ts`

- [ ] **Step 1: Write src/types.ts**

```typescript
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
export type BodyType = 'none' | 'json' | 'text' | 'form';
export type AuthType = 'none' | 'bearer' | 'basic';
export type WsState = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

export interface HttpRequestSpec {
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  body?: string;
  bodyType: BodyType;
  auth: {
    type: AuthType;
    token?: string;
    username?: string;
    password?: string;
  };
}

export interface HttpResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  time: number; // ms
  size: number; // bytes
  error?: string;
}

export interface WsMessage {
  id: string;
  dir: 'send' | 'recv';
  data: string;
  ts: number;
}

export interface HistoryItem {
  id: string;
  kind: 'http';
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  body?: string;
  bodyType: BodyType;
  ts: number;
  status?: number;
  time?: number;
}

export interface CollectionItem {
  id: string;
  name: string;
  method?: HttpMethod;
  url?: string;
  headers?: Record<string, string>;
  body?: string;
  bodyType?: BodyType;
  wsUrl?: string;
  ts: number;
}

// Webview ↔ Extension message contract
export type ExtMessage =
  | { type: 'http.response'; payload: HttpResponse }
  | { type: 'ws.status'; payload: { state: WsState; error?: string } }
  | { type: 'ws.message'; payload: WsMessage }
  | { type: 'history.list'; payload: { items: HistoryItem[] } }
  | { type: 'collection.list'; payload: { items: CollectionItem[] } }
  | { type: 'collection.saved'; payload: { item: CollectionItem } }
  | { type: 'collection.deleted'; payload: { id: string } }
  | { type: 'error'; payload: { message: string } };

export type WebviewMessage =
  | { type: 'http.send'; payload: HttpRequestSpec }
  | { type: 'ws.connect'; payload: { url: string } }
  | { type: 'ws.disconnect'; payload: Record<string, never> }
  | { type: 'ws.send'; payload: { data: string } }
  | { type: 'history.list'; payload: Record<string, never> }
  | { type: 'history.save'; payload: { item: HistoryItem } }
  | { type: 'collection.list'; payload: Record<string, never> }
  | { type: 'collection.save'; payload: { item: Omit<CollectionItem, 'id' | 'ts'> } }
  | { type: 'collection.delete'; payload: { id: string } }
  | { type: 'request.execute'; payload: { id: string; source: 'history' | 'collection' } };
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: exits 0

- [ ] **Step 3: Commit**

```bash
git add src/types.ts
git commit -m "feat: add shared TypeScript types"
```

---

### Task 4: Hello World extension entry and view provider

**Files:**
- Create: `src/extension.ts`
- Create: `src/webview/ApiTesterViewProvider.ts`

- [ ] **Step 1: Write src/webview/ApiTesterViewProvider.ts**

```typescript
import * as vscode from 'vscode';

export class ApiTesterViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'apiTester.view';

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };

    webviewView.webview.html = this._getHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((msg) => {
      console.log('Message from webview:', msg);
    });
  }

  private _getHtml(webview: vscode.Webview): string {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
  <title>API Tester</title>
</head>
<body>
  <h1>🔌 API & WebSocket Tester</h1>
  <p>Hello! The extension is loaded.</p>
</body>
</html>`;
  }
}
```

- [ ] **Step 2: Write src/extension.ts**

```typescript
import * as vscode from 'vscode';
import { ApiTesterViewProvider } from './webview/ApiTesterViewProvider';

export function activate(context: vscode.ExtensionContext) {
  console.log('API & WebSocket Tester is now active');

  const provider = new ApiTesterViewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(ApiTesterViewProvider.viewType, provider)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('api-tester.openView', () => {
      vscode.commands.executeCommand('workbench.view.extension.apiTester.container');
    })
  );
}

export function deactivate() {}
```

- [ ] **Step 3: Build the extension**

Run: `npm run build`
Expected: `dist/extension.js` exists

- [ ] **Step 4: Manual verification**

Open VS Code in this folder, press F5 to launch Extension Development Host. In the new window:
- Click the API Tester icon in the activity bar (left side)
- Sidebar should open showing "🔌 API & WebSocket Tester" and "Hello!" message

- [ ] **Step 5: Commit**

```bash
git add src/extension.ts src/webview/ApiTesterViewProvider.ts
git commit -m "feat: hello-world extension with sidebar webview"
```

---

### Task 5: Sidebar icon SVG

**Files:**
- Create: `media/icon.svg`

- [ ] **Step 1: Write media/icon.svg**

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M4 12h16"/>
  <path d="M12 4v16"/>
  <circle cx="12" cy="12" r="9"/>
  <circle cx="12" cy="12" r="3" fill="currentColor"/>
</svg>
```

- [ ] **Step 2: Verify it appears in extension**

Re-run F5 in Extension Development Host. The sidebar activity bar should show the icon (a circle with cross).

- [ ] **Step 3: Commit**

```bash
git add media/icon.svg
git commit -m "feat: add sidebar icon"
```

---

## Phase 2 — HTTP Core

### Task 6: Format utility (TDD)

**Files:**
- Create: `src/utils/format.ts`
- Create: `test/suite/format.test.ts`
- Create: `test/suite/index.ts`
- Create: `test/runTest.ts`

- [ ] **Step 1: Write the failing test `test/suite/format.test.ts`**

```typescript
import * as assert from 'assert';
import { formatJson, formatBytes } from '../../src/utils/format';

suite('format utils', () => {
  test('formatJson pretty-prints valid JSON', () => {
    const input = '{"a":1,"b":2}';
    const out = formatJson(input);
    assert.strictEqual(out, '{\n  "a": 1,\n  "b": 2\n}');
  });

  test('formatJson returns original string on invalid JSON', () => {
    const input = 'not json';
    assert.strictEqual(formatJson(input), input);
  });

  test('formatBytes formats bytes/KB/MB', () => {
    assert.strictEqual(formatBytes(512), '512 B');
    assert.strictEqual(formatBytes(1024), '1.0 KB');
    assert.strictEqual(formatBytes(1536), '1.5 KB');
    assert.strictEqual(formatBytes(1024 * 1024), '1.0 MB');
    assert.strictEqual(formatBytes(0), '0 B');
  });
});
```

- [ ] **Step 2: Write the failing test runner `test/suite/index.ts`**

```typescript
import * as path from 'path';
import Mocha from 'mocha';
import { globSync } from 'glob';

export function run(): Promise<void> {
  const mocha = new Mocha({ ui: 'tdd', color: true });
  const testsRoot = __dirname;

  const files = globSync('**/*.test.js', { cwd: testsRoot });
  files.forEach((f) => mocha.addFile(path.resolve(testsRoot, f)));

  return new Promise((resolve, reject) => {
    try {
      mocha.run((failures) => {
        if (failures > 0) {
          reject(new Error(`${failures} tests failed.`));
        } else {
          resolve();
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}
```

- [ ] **Step 3: Write the test runner entry `test/runTest.ts`**

```typescript
import * as path from 'path';
import { runTests } from '@vscode/test-electron';

async function main() {
  try {
    const extensionDevelopmentPath = path.resolve(__dirname, '../');
    const extensionTestsPath = path.resolve(__dirname, './suite/index');

    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: ['--disable-extensions']
    });
  } catch (err) {
    console.error('Failed to run tests', err);
    process.exit(1);
  }
}

main();
```

- [ ] **Step 4: Add glob dependency**

Run: `npm install --save-dev glob @types/glob`
Expected: glob installed

- [ ] **Step 5: Update tsconfig include to include test folder**

Verify `tsconfig.json` includes `"test/**/*"` (already set in Task 2).

- [ ] **Step 6: Write the failing implementation stub `src/utils/format.ts`**

```typescript
export function formatJson(text: string): string {
  throw new Error('not implemented');
}

export function formatBytes(n: number): string {
  throw new Error('not implemented');
}
```

- [ ] **Step 7: Build and run tests (expect failure)**

Run:
```bash
npm run build
npm test
```
Expected: 3 tests fail (Error: not implemented)

- [ ] **Step 8: Implement format.ts**

```typescript
export function formatJson(text: string): string {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
```

- [ ] **Step 9: Build and run tests (expect pass)**

Run: `npm run build && npm test`
Expected: all 3 tests pass

- [ ] **Step 10: Commit**

```bash
git add src/utils/format.ts test/
git commit -m "feat: add format utility with tests"
```

---

### Task 7: HttpService (TDD)

**Files:**
- Create: `src/utils/id.ts`
- Create: `src/services/HttpService.ts`
- Create: `test/suite/HttpService.test.ts`

- [ ] **Step 1: Write src/utils/id.ts**

```typescript
export function uuid(): string {
  // RFC4122 version 4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
```

- [ ] **Step 2: Write the failing test `test/suite/HttpService.test.ts`**

```typescript
import * as assert from 'assert';
import * as http from 'http';
import { HttpService } from '../../src/services/HttpService';
import { HttpRequestSpec } from '../../src/types';

suite('HttpService', () => {
  let server: http.Server;
  let serverPort = 0;

  setup((done) => {
    server = http.createServer((req, res) => {
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', () => {
        if (req.url === '/echo' && req.method === 'POST') {
          res.writeHead(200, { 'Content-Type': 'application/json', 'X-Echo': body });
          res.end(JSON.stringify({ received: body, method: req.method }));
        } else if (req.url === '/headers') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ token: req.headers['x-token'] || null }));
        } else {
          res.writeHead(404);
          res.end('not found');
        }
      });
    });
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') {
        serverPort = addr.port;
        done();
      }
    });
  });

  teardown((done) => {
    server.close(done);
  });

  test('sends GET and parses response', async () => {
    const svc = new HttpService();
    const spec: HttpRequestSpec = {
      method: 'GET',
      url: `http://127.0.0.1:${serverPort}/headers`,
      headers: { 'X-Token': 'abc' },
      bodyType: 'none',
      auth: { type: 'none' }
    };
    const res = await svc.send(spec);
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.includes('"token":"abc"'));
    assert.ok(res.time >= 0);
    assert.ok(res.size > 0);
  });

  test('sends POST with JSON body', async () => {
    const svc = new HttpService();
    const spec: HttpRequestSpec = {
      method: 'POST',
      url: `http://127.0.0.1:${serverPort}/echo`,
      headers: { 'Content-Type': 'application/json' },
      body: '{"hello":"world"}',
      bodyType: 'json',
      auth: { type: 'none' }
    };
    const res = await svc.send(spec);
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.includes('"received":"{\\"hello\\":\\"world\\"}"'));
  });

  test('handles network error gracefully', async () => {
    const svc = new HttpService();
    const spec: HttpRequestSpec = {
      method: 'GET',
      url: 'http://127.0.0.1:1/nope',
      headers: {},
      bodyType: 'none',
      auth: { type: 'none' }
    };
    const res = await svc.send(spec);
    assert.ok(res.error, 'expected error message');
    assert.strictEqual(res.status, 0);
  });
});
```

- [ ] **Step 3: Write the stub `src/services/HttpService.ts`**

```typescript
import { HttpRequestSpec, HttpResponse } from '../types';

export class HttpService {
  async send(_spec: HttpRequestSpec): Promise<HttpResponse> {
    throw new Error('not implemented');
  }
}
```

- [ ] **Step 4: Build and run tests (expect failure)**

Run: `npm run build && npm test`
Expected: HttpService tests fail (Error: not implemented)

- [ ] **Step 5: Implement HttpService**

```typescript
import * as http from 'http';
import * as https from 'https';
import { URL } from 'url';
import { HttpRequestSpec, HttpResponse } from '../types';

export class HttpService {
  private static TIMEOUT_MS = 30_000;

  send(spec: HttpRequestSpec): Promise<HttpResponse> {
    return new Promise((resolve) => {
      let parsed: URL;
      try {
        parsed = new URL(spec.url);
      } catch (e) {
        resolve({
          status: 0,
          statusText: '',
          headers: {},
          body: '',
          time: 0,
          size: 0,
          error: `Invalid URL: ${(e as Error).message}`
        });
        return;
      }

      const isHttps = parsed.protocol === 'https:';
      const lib = isHttps ? https : http;

      const headers: Record<string, string> = { ...spec.headers };

      // Inject auth header
      if (spec.auth.type === 'bearer' && spec.auth.token) {
        headers['Authorization'] = `Bearer ${spec.auth.token}`;
      } else if (spec.auth.type === 'basic' && spec.auth.username) {
        const encoded = Buffer.from(
          `${spec.auth.username}:${spec.auth.password ?? ''}`
        ).toString('base64');
        headers['Authorization'] = `Basic ${encoded}`;
      }

      // Default content-type for json body
      if (spec.bodyType === 'json' && spec.body && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }

      const options: http.RequestOptions = {
        method: spec.method,
        hostname: parsed.hostname,
        port: parsed.port || (isHttps ? 443 : 80),
        path: parsed.pathname + parsed.search,
        headers
      };

      const start = Date.now();
      const req = lib.request(options, (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () => {
          const buf = Buffer.concat(chunks);
          const responseHeaders: Record<string, string> = {};
          for (const [k, v] of Object.entries(res.headers)) {
            if (typeof v === 'string') responseHeaders[k] = v;
            else if (Array.isArray(v)) responseHeaders[k] = v.join(', ');
          }
          resolve({
            status: res.statusCode ?? 0,
            statusText: res.statusMessage ?? '',
            headers: responseHeaders,
            body: buf.toString('utf8'),
            time: Date.now() - start,
            size: buf.length
          });
        });
      });

      req.on('error', (e) => {
        resolve({
          status: 0,
          statusText: '',
          headers: {},
          body: '',
          time: Date.now() - start,
          size: 0,
          error: e.message
        });
      });

      req.setTimeout(HttpService.TIMEOUT_MS, () => {
        req.destroy(new Error(`Timeout after ${HttpService.TIMEOUT_MS}ms`));
      });

      if (spec.body && spec.method !== 'GET' && spec.method !== 'DELETE') {
        req.write(spec.body);
      }
      req.end();
    });
  }
}
```

- [ ] **Step 6: Build and run tests (expect pass)**

Run: `npm run build && npm test`
Expected: all format + HttpService tests pass

- [ ] **Step 7: Commit**

```bash
git add src/utils/id.ts src/services/HttpService.ts test/suite/HttpService.test.ts
git commit -m "feat: implement HttpService with tests"
```

---

### Task 8: Integrate HttpService into ViewProvider

**Files:**
- Modify: `src/webview/ApiTesterViewProvider.ts`

- [ ] **Step 1: Replace `src/webview/ApiTesterViewProvider.ts`**

```typescript
import * as vscode from 'vscode';
import { HttpService } from '../services/HttpService';
import { WebviewMessage, ExtMessage } from '../types';

export class ApiTesterViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'apiTester.view';
  private _view?: vscode.WebviewView;
  private _http = new HttpService();

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };
    webviewView.webview.html = this._getHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((msg: WebviewMessage) => {
      this._handleMessage(msg);
    });
  }

  private async _handleMessage(msg: WebviewMessage): Promise<void> {
    switch (msg.type) {
      case 'http.send': {
        const res = await this._http.send(msg.payload);
        this._post({ type: 'http.response', payload: res });
        break;
      }
    }
  }

  private _post(msg: ExtMessage): void {
    this._view?.webview.postMessage(msg);
  }

  private _getHtml(_webview: vscode.Webview): string {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
  <title>API Tester</title>
</head>
<body>
  <h1>🔌 API & WebSocket Tester</h1>
  <p>Hello! The extension is loaded.</p>
</body>
</html>`;
  }
}
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: compiles cleanly

- [ ] **Step 3: Commit**

```bash
git add src/webview/ApiTesterViewProvider.ts
git commit -m "feat: wire HttpService into webview message handler"
```

---

### Task 9: Webview HTML skeleton with HTTP tab + WS tab placeholders

**Files:**
- Modify: `media/index.html` (replace inline html with file reference)
- Create: `media/index.html`
- Create: `media/main.js`
- Create: `media/style.css`

Note: this moves the HTML into a real file. The provider needs to read it from disk.

- [ ] **Step 1: Update ApiTesterViewProvider to read media files**

Modify `src/webview/ApiTesterViewProvider.ts`. Replace the `_getHtml` method with:

```typescript
private _getHtml(webview: vscode.Webview): string {
  const htmlPath = vscode.Uri.joinPath(this._extensionUri, 'media', 'index.html');
  // We use a simple replacement approach: read disk and rewrite asset paths.
  // For MVP, use a basic <script src> + <link href> scheme via webview.asWebviewUri.
  const scriptUri = webview.asWebviewUri(
    vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js')
  );
  const styleUri = webview.asWebviewUri(
    vscode.Uri.joinPath(this._extensionUri, 'media', 'style.css')
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource};">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Tester</title>
  <link rel="stylesheet" href="${styleUri}">
</head>
<body>
  <header class="title-bar">
    <span class="title">🔌 API & WebSocket Tester</span>
    <span class="settings-icon" title="Settings">⚙</span>
  </header>

  <nav class="tabs">
    <button class="tab active" data-tab="http">HTTP</button>
    <button class="tab" data-tab="ws">WebSocket</button>
  </nav>

  <main id="http-panel" class="panel active">
    <div class="request-line">
      <select id="http-method">
        <option value="GET">GET</option>
        <option value="POST">POST</option>
        <option value="PUT">PUT</option>
        <option value="DELETE">DELETE</option>
        <option value="PATCH">PATCH</option>
      </select>
      <input type="text" id="http-url" placeholder="https://api.example.com/endpoint" />
      <button id="http-send" class="btn-primary">Send</button>
      <button id="http-save" class="btn-secondary">Save</button>
    </div>

    <nav class="subtabs">
      <button class="subtab active" data-subtab="headers">Headers</button>
      <button class="subtab" data-subtab="body">Body</button>
      <button class="subtab" data-subtab="auth">Auth</button>
    </nav>

    <section id="sub-headers" class="subpanel active">
      <div id="headers-list"></div>
      <button id="header-add" class="btn-secondary">+ Add Header</button>
    </section>

    <section id="sub-body" class="subpanel">
      <div class="body-type">
        <label><input type="radio" name="body-type" value="none" checked> None</label>
        <label><input type="radio" name="body-type" value="json"> JSON</label>
        <label><input type="radio" name="body-type" value="text"> Text</label>
        <label><input type="radio" name="body-type" value="form"> Form</label>
      </div>
      <textarea id="body-input" placeholder='{"key":"value"}' spellcheck="false"></textarea>
    </section>

    <section id="sub-auth" class="subpanel">
      <label>Type:
        <select id="auth-type">
          <option value="none">None</option>
          <option value="bearer">Bearer Token</option>
          <option value="basic">Basic Auth</option>
        </select>
      </label>
      <div id="auth-bearer" class="auth-fields" hidden>
        <label>Token: <input type="text" id="auth-token" placeholder="ey..."></label>
      </div>
      <div id="auth-basic" class="auth-fields" hidden>
        <label>Username: <input type="text" id="auth-user"></label>
        <label>Password: <input type="password" id="auth-pass"></label>
      </div>
    </section>

    <section class="response-section">
      <div class="response-header">
        <span class="response-label">↓ Response</span>
        <span id="response-status" class="response-status"></span>
      </div>
      <pre id="response-body" class="response-body" spellcheck="false"></pre>
      <div class="response-meta">
        <span id="response-time"></span>
        <span id="response-size"></span>
      </div>
    </section>
  </main>

  <main id="ws-panel" class="panel">
    <p>WebSocket panel — Phase 3</p>
  </main>

  <script src="${scriptUri}"></script>
</body>
</html>`;
}
```

- [ ] **Step 2: Create `media/style.css`**

```css
:root {
  --bg: var(--vscode-editor-background);
  --fg: var(--vscode-editor-foreground);
  --border: var(--vscode-input-border);
  --input-bg: var(--vscode-input-background);
  --btn-bg: var(--vscode-button-background);
  --btn-fg: var(--vscode-button-foreground);
  --btn-hover: var(--vscode-button-hoverBackground);
  --error: var(--vscode-errorForeground);
  --success: var(--vscode-testing-iconPassed, #4caf50);
  --warn: var(--vscode-editorWarning-foreground, #d7ba7d);
  --code-font: var(--vscode-editor-font-family, monospace);
}

* { box-sizing: border-box; }

body {
  margin: 0;
  padding: 8px;
  font-family: var(--vscode-font-family);
  font-size: var(--vscode-font-size);
  color: var(--fg);
  background: var(--bg);
}

.title-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px;
  border-bottom: 1px solid var(--border);
  margin: -8px -8px 8px;
}

.title { font-weight: 600; }

.tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
  border-bottom: 1px solid var(--border);
}

.tab {
  background: transparent;
  border: none;
  color: var(--fg);
  padding: 6px 12px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
}

.tab.active { border-bottom-color: var(--btn-bg); font-weight: 600; }

.panel { display: none; }
.panel.active { display: block; }

.request-line {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
}

.request-line select,
.request-line input {
  background: var(--input-bg);
  color: var(--fg);
  border: 1px solid var(--border);
  padding: 4px 6px;
  font-family: var(--code-font);
}

#http-url { flex: 1; }

.btn-primary {
  background: var(--btn-bg);
  color: var(--btn-fg);
  border: none;
  padding: 4px 12px;
  cursor: pointer;
}

.btn-primary:hover { background: var(--btn-hover); }

.btn-secondary {
  background: transparent;
  color: var(--fg);
  border: 1px solid var(--border);
  padding: 4px 12px;
  cursor: pointer;
}

.btn-secondary:hover { background: var(--btn-hover); }

.subtabs {
  display: flex;
  gap: 2px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 8px;
}

.subtab {
  background: transparent;
  border: none;
  color: var(--fg);
  padding: 4px 8px;
  cursor: pointer;
}

.subtab.active {
  border-bottom: 2px solid var(--btn-bg);
  font-weight: 600;
}

.subpanel { display: none; padding: 4px 0; }
.subpanel.active { display: block; }

.header-row {
  display: flex;
  gap: 4px;
  margin-bottom: 4px;
}

.header-row input {
  flex: 1;
  background: var(--input-bg);
  color: var(--fg);
  border: 1px solid var(--border);
  padding: 3px 6px;
  font-family: var(--code-font);
}

.header-row .header-remove {
  background: transparent;
  color: var(--error);
  border: 1px solid var(--border);
  cursor: pointer;
}

.body-type {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
  font-size: 12px;
}

.body-type label { display: flex; align-items: center; gap: 2px; }

#body-input {
  width: 100%;
  min-height: 100px;
  background: var(--input-bg);
  color: var(--fg);
  border: 1px solid var(--border);
  padding: 4px;
  font-family: var(--code-font);
  resize: vertical;
}

.auth-fields {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 8px;
}

.auth-fields label {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
}

.auth-fields input {
  background: var(--input-bg);
  color: var(--fg);
  border: 1px solid var(--border);
  padding: 3px 6px;
  font-family: var(--code-font);
}

.response-section {
  margin-top: 12px;
  border-top: 1px solid var(--border);
  padding-top: 8px;
}

.response-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  font-weight: 600;
}

.response-status.status-2xx { color: var(--success); }
.response-status.status-4xx { color: var(--warn); }
.response-status.status-5xx { color: var(--error); }
.response-status.status-0 { color: var(--error); }

.response-body {
  background: var(--input-bg);
  border: 1px solid var(--border);
  padding: 6px;
  margin: 0;
  max-height: 300px;
  overflow: auto;
  font-family: var(--code-font);
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
}

.response-meta {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: var(--vscode-descriptionForeground);
  margin-top: 4px;
}
```

- [ ] **Step 3: Create `media/main.js` (initial HTTP form logic only)**

```javascript
(function () {
  const vscode = acquireVsCodeApi();

  // --- Tab switching ---
  document.querySelectorAll('.tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('active', b === btn));
      document.querySelectorAll('.panel').forEach((p) => {
        p.classList.toggle('active', p.id === target + '-panel');
      });
    });
  });

  // --- Sub-tab switching ---
  document.querySelectorAll('.subtab').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.subtab;
      document.querySelectorAll('.subtab').forEach((b) => b.classList.toggle('active', b === btn));
      document.querySelectorAll('.subpanel').forEach((p) => {
        p.classList.toggle('active', p.id === 'sub-' + target);
      });
    });
  });

  // --- Headers ---
  function addHeaderRow(key = '', value = '') {
    const list = document.getElementById('headers-list');
    const row = document.createElement('div');
    row.className = 'header-row';
    row.innerHTML = `
      <input class="header-key" placeholder="Header" value="${escapeAttr(key)}">
      <input class="header-value" placeholder="Value" value="${escapeAttr(value)}">
      <button class="header-remove" title="Remove">×</button>
    `;
    row.querySelector('.header-remove').addEventListener('click', () => row.remove());
    list.appendChild(row);
  }

  function collectHeaders() {
    const headers = {};
    document.querySelectorAll('#headers-list .header-row').forEach((row) => {
      const k = row.querySelector('.header-key').value.trim();
      const v = row.querySelector('.header-value').value;
      if (k) headers[k] = v;
    });
    return headers;
  }

  document.getElementById('header-add').addEventListener('click', () => addHeaderRow());
  addHeaderRow('Content-Type', 'application/json');

  // --- Auth ---
  const authType = document.getElementById('auth-type');
  const authBearer = document.getElementById('auth-bearer');
  const authBasic = document.getElementById('auth-basic');
  authType.addEventListener('change', () => {
    authBearer.hidden = authType.value !== 'bearer';
    authBasic.hidden = authType.value !== 'basic';
  });

  function collectAuth() {
    const auth = { type: authType.value };
    if (auth.type === 'bearer') {
      auth.token = document.getElementById('auth-token').value;
    } else if (auth.type === 'basic') {
      auth.username = document.getElementById('auth-user').value;
      auth.password = document.getElementById('auth-pass').value;
    }
    return auth;
  }

  // --- Send ---
  document.getElementById('http-send').addEventListener('click', sendHttp);

  function sendHttp() {
    const method = document.getElementById('http-method').value;
    const url = document.getElementById('http-url').value.trim();
    if (!url) {
      showError('URL is required');
      return;
    }
    const bodyType = document.querySelector('input[name="body-type"]:checked').value;
    const body = bodyType === 'none' ? undefined : document.getElementById('body-input').value;
    const spec = {
      method,
      url,
      headers: collectHeaders(),
      body,
      bodyType,
      auth: collectAuth()
    };
    vscode.postMessage({ type: 'http.send', payload: spec });
    setStatus('Sending...', '0');
  }

  // --- Response ---
  window.addEventListener('message', (event) => {
    const msg = event.data;
    if (msg.type === 'http.response') {
      renderResponse(msg.payload);
    } else if (msg.type === 'error') {
      showError(msg.payload.message);
    }
  });

  function renderResponse(res) {
    const statusEl = document.getElementById('response-status');
    const bodyEl = document.getElementById('response-body');
    const timeEl = document.getElementById('response-time');
    const sizeEl = document.getElementById('response-size');

    if (res.error) {
      statusEl.textContent = 'Error';
      statusEl.className = 'response-status status-0';
      bodyEl.textContent = res.error;
      timeEl.textContent = `Time: ${res.time}ms`;
      sizeEl.textContent = `Size: 0 B`;
      return;
    }

    setStatus(`${res.status} ${res.statusText}`, String(res.status));
    bodyEl.textContent = tryFormatJson(res.body);
    timeEl.textContent = `Time: ${res.time}ms`;
    sizeEl.textContent = `Size: ${formatBytes(res.size)}`;
  }

  function setStatus(text, code) {
    const statusEl = document.getElementById('response-status');
    statusEl.textContent = text;
    const cls = code.charAt(0);
    statusEl.className = 'response-status status-' + (cls === '0' ? '0' : cls + 'xx');
  }

  function showError(msg) {
    setStatus('Error', '0');
    document.getElementById('response-body').textContent = msg;
  }

  function tryFormatJson(text) {
    try {
      return JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      return text;
    }
  }

  function formatBytes(n) {
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    return (n / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function escapeAttr(s) {
    return String(s).replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }
})();
```

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: compiles cleanly

- [ ] **Step 5: Manual test**

F5 in VS Code. Click the API Tester sidebar icon. Fill in:
- Method: GET
- URL: `https://jsonplaceholder.typicode.com/todos/1`
- Click Send

Expected: status `200 OK`, body shows JSON pretty-printed, time/size shown.

- [ ] **Step 6: Commit**

```bash
git add media/ src/webview/ApiTesterViewProvider.ts
git commit -m "feat: HTTP form UI with send, response display, and theme"
```

---

## Phase 3 — WebSocket Core

### Task 10: WsService (TDD)

**Files:**
- Create: `src/services/WsService.ts`
- Create: `test/suite/WsService.test.ts`

- [ ] **Step 1: Write the failing test `test/suite/WsService.test.ts`**

Use the real `ws` library against a local server (more reliable than mocking).

```typescript
import * as assert from 'assert';
import * as http from 'http';
import { WebSocketServer } from 'ws';
import { WsService } from '../../src/services/WsService';

suite('WsService', () => {
  let server: http.Server;
  let wss: WebSocketServer;
  let port = 0;

  setup((done) => {
    server = http.createServer();
    wss = new WebSocketServer({ server });
    wss.on('connection', (ws) => {
      ws.on('message', (data) => {
        // echo
        ws.send('echo:' + data.toString());
      });
    });
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') {
        port = addr.port;
        done();
      }
    });
  });

  teardown((done) => {
    wss.close();
    server.close(done);
  });

  test('connect → status becomes connected; send → message logged; recv → message logged', async () => {
    const svc = new WsService();

    const statuses: string[] = [];
    const messages: { dir: string; data: string }[] = [];
    svc.on('status', (s: { state: string }) => statuses.push(s.state));
    svc.on('message', (m: { dir: string; data: string }) => messages.push(m));

    await svc.connect(`ws://127.0.0.1:${port}`);
    await svc.send('hello');
    await new Promise((r) => setTimeout(r, 50));

    assert.deepStrictEqual(statuses, ['connecting', 'connected']);
    assert.ok(messages.some((m) => m.dir === 'send' && m.data === 'hello'));
    assert.ok(messages.some((m) => m.dir === 'recv' && m.data === 'echo:hello'));

    svc.disconnect();
  });

  test('disconnect clears state', async () => {
    const svc = new WsService();
    await svc.connect(`ws://127.0.0.1:${port}`);
    svc.disconnect();
    assert.strictEqual(svc.getState(), 'disconnected');
  });

  test('invalid URL is rejected', async () => {
    const svc = new WsService();
    const statuses: string[] = [];
    svc.on('status', (s: { state: string }) => statuses.push(s.state));
    try {
      await svc.connect('not-a-url');
      assert.fail('should have thrown');
    } catch {
      assert.ok(statuses.includes('error'));
    }
  });
});
```

- [ ] **Step 2: Write the stub `src/services/WsService.ts`**

```typescript
import { EventEmitter } from 'events';
import { WsMessage, WsState } from '../types';
import { uuid } from '../utils/id';

export class WsService extends EventEmitter {
  private _state: WsState = 'idle';
  private _ws?: import('ws').WebSocket;

  getState(): WsState {
    return this._state;
  }

  async connect(_url: string): Promise<void> {
    throw new Error('not implemented');
  }

  async send(_data: string): Promise<void> {
    throw new Error('not implemented');
  }

  disconnect(): void {
    throw new Error('not implemented');
  }
}
```

- [ ] **Step 3: Build and run tests (expect failure)**

Run: `npm run build && npm test`
Expected: WsService tests fail

- [ ] **Step 4: Implement WsService**

```typescript
import { EventEmitter } from 'events';
import WebSocket from 'ws';
import { WsMessage, WsState } from '../types';
import { uuid } from '../utils/id';

const MAX_MESSAGES = 500;
const TRIM_BATCH = 100;

export class WsService extends EventEmitter {
  private _state: WsState = 'idle';
  private _ws?: WebSocket;
  private _buffer: WsMessage[] = [];

  getState(): WsState {
    return this._state;
  }

  getMessages(): WsMessage[] {
    return [...this._buffer];
  }

  connect(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this._setState('connecting');
      let ws: WebSocket;
      try {
        ws = new WebSocket(url);
      } catch (e) {
        this._setState('error', (e as Error).message);
        reject(e);
        return;
      }
      this._ws = ws;

      const onOpen = () => {
        ws.off('error', onError);
        this._setState('connected');
        resolve();
      };
      const onError = (err: Error) => {
        ws.off('open', onOpen);
        this._setState('error', err.message);
        reject(err);
      };

      ws.once('open', onOpen);
      ws.once('error', onError);
      ws.on('message', (data) => {
        const text = data instanceof Buffer ? data.toString('utf8') : String(data);
        this._appendMessage({ id: uuid(), dir: 'recv', data: text, ts: Date.now() });
      });
      ws.on('close', () => {
        this._setState('disconnected');
      });
      ws.on('error', (err) => {
        // If we never opened, onError handler already rejected.
        if (this._state !== 'connected') return;
        this._setState('error', err.message);
      });
    });
  }

  async send(data: string): Promise<void> {
    if (this._state !== 'connected' || !this._ws) {
      throw new Error(`Cannot send: state is ${this._state}`);
    }
    this._ws.send(data);
    this._appendMessage({ id: uuid(), dir: 'send', data, ts: Date.now() });
  }

  disconnect(): void {
    if (this._ws) {
      try {
        this._ws.close();
      } catch {
        // ignore
      }
      this._ws = undefined;
    }
    this._setState('disconnected');
  }

  private _setState(state: WsState, error?: string): void {
    this._state = state;
    this.emit('status', error ? { state, error } : { state });
  }

  private _appendMessage(msg: WsMessage): void {
    this._buffer.push(msg);
    if (this._buffer.length > MAX_MESSAGES) {
      this._buffer.splice(0, this._buffer.length - MAX_MESSAGES + TRIM_BATCH);
    }
    this.emit('message', msg);
  }
}
```

- [ ] **Step 5: Build and run tests (expect pass)**

Run: `npm run build && npm test`
Expected: all WsService tests pass

- [ ] **Step 6: Commit**

```bash
git add src/services/WsService.ts test/suite/WsService.test.ts
git commit -m "feat: implement WsService with message buffer and tests"
```

---

### Task 11: Wire WsService into ViewProvider

**Files:**
- Modify: `src/webview/ApiTesterViewProvider.ts`

- [ ] **Step 1: Update message handler to include WS**

Replace the entire content of `src/webview/ApiTesterViewProvider.ts`:

```typescript
import * as vscode from 'vscode';
import { HttpService } from '../services/HttpService';
import { WsService } from '../services/WsService';
import { WebviewMessage, ExtMessage } from '../types';

export class ApiTesterViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'apiTester.view';
  private _view?: vscode.WebviewView;
  private _http = new HttpService();
  private _ws = new WsService();

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };
    webviewView.webview.html = this._getHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((msg: WebviewMessage) => {
      this._handleMessage(msg);
    });

    // WS event forwarding
    this._ws.on('status', (s: { state: string; error?: string }) => {
      this._post({ type: 'ws.status', payload: s as any });
    });
    this._ws.on('message', (m) => {
      this._post({ type: 'ws.message', payload: m });
    });
  }

  private async _handleMessage(msg: WebviewMessage): Promise<void> {
    try {
      switch (msg.type) {
        case 'http.send': {
          const res = await this._http.send(msg.payload);
          this._post({ type: 'http.response', payload: res });
          break;
        }
        case 'ws.connect': {
          try {
            await this._ws.connect(msg.payload.url);
          } catch (e) {
            this._post({
              type: 'error',
              payload: { message: `WS connect failed: ${(e as Error).message}` }
            });
          }
          break;
        }
        case 'ws.disconnect': {
          this._ws.disconnect();
          break;
        }
        case 'ws.send': {
          try {
            await this._ws.send(msg.payload.data);
          } catch (e) {
            this._post({
              type: 'error',
              payload: { message: `WS send failed: ${(e as Error).message}` }
            });
          }
          break;
        }
      }
    } catch (e) {
      this._post({ type: 'error', payload: { message: (e as Error).message } });
    }
  }

  private _post(msg: ExtMessage): void {
    this._view?.webview.postMessage(msg);
  }

  private _getHtml(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'style.css')
    );

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource};">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Tester</title>
  <link rel="stylesheet" href="${styleUri}">
</head>
<body>
  <header class="title-bar">
    <span class="title">🔌 API & WebSocket Tester</span>
    <span class="settings-icon" title="Settings">⚙</span>
  </header>

  <nav class="tabs">
    <button class="tab active" data-tab="http">HTTP</button>
    <button class="tab" data-tab="ws">WebSocket</button>
  </nav>

  <main id="http-panel" class="panel active">
    <div class="request-line">
      <select id="http-method">
        <option value="GET">GET</option>
        <option value="POST">POST</option>
        <option value="PUT">PUT</option>
        <option value="DELETE">DELETE</option>
        <option value="PATCH">PATCH</option>
      </select>
      <input type="text" id="http-url" placeholder="https://api.example.com/endpoint" />
      <button id="http-send" class="btn-primary">Send</button>
      <button id="http-save" class="btn-secondary">Save</button>
    </div>

    <nav class="subtabs">
      <button class="subtab active" data-subtab="headers">Headers</button>
      <button class="subtab" data-subtab="body">Body</button>
      <button class="subtab" data-subtab="auth">Auth</button>
    </nav>

    <section id="sub-headers" class="subpanel active">
      <div id="headers-list"></div>
      <button id="header-add" class="btn-secondary">+ Add Header</button>
    </section>

    <section id="sub-body" class="subpanel">
      <div class="body-type">
        <label><input type="radio" name="body-type" value="none" checked> None</label>
        <label><input type="radio" name="body-type" value="json"> JSON</label>
        <label><input type="radio" name="body-type" value="text"> Text</label>
        <label><input type="radio" name="body-type" value="form"> Form</label>
      </div>
      <textarea id="body-input" placeholder='{"key":"value"}' spellcheck="false"></textarea>
    </section>

    <section id="sub-auth" class="subpanel">
      <label>Type:
        <select id="auth-type">
          <option value="none">None</option>
          <option value="bearer">Bearer Token</option>
          <option value="basic">Basic Auth</option>
        </select>
      </label>
      <div id="auth-bearer" class="auth-fields" hidden>
        <label>Token: <input type="text" id="auth-token" placeholder="ey..."></label>
      </div>
      <div id="auth-basic" class="auth-fields" hidden>
        <label>Username: <input type="text" id="auth-user"></label>
        <label>Password: <input type="password" id="auth-pass"></label>
      </div>
    </section>

    <section class="response-section">
      <div class="response-header">
        <span class="response-label">↓ Response</span>
        <span id="response-status" class="response-status"></span>
      </div>
      <pre id="response-body" class="response-body" spellcheck="false"></pre>
      <div class="response-meta">
        <span id="response-time"></span>
        <span id="response-size"></span>
      </div>
    </section>
  </main>

  <main id="ws-panel" class="panel">
    <div class="request-line">
      <input type="text" id="ws-url" placeholder="ws://localhost:8000/ws" />
      <button id="ws-connect" class="btn-primary">Connect</button>
      <button id="ws-disconnect" class="btn-secondary">Disconnect</button>
    </div>
    <div class="ws-status">
      <span class="status-dot" id="ws-status-dot"></span>
      <span id="ws-status-text">Disconnected</span>
    </div>
    <div id="ws-messages" class="ws-messages"></div>
    <div class="request-line">
      <input type="text" id="ws-input" placeholder='{"type":"ping"}' />
      <button id="ws-send" class="btn-primary">Send</button>
    </div>
  </main>

  <script src="${scriptUri}"></script>
</body>
</html>`;
  }
}
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: compiles

- [ ] **Step 3: Commit**

```bash
git add src/webview/ApiTesterViewProvider.ts
git commit -m "feat: wire WsService into webview message handler"
```

---

### Task 12: Webview WS UI logic

**Files:**
- Modify: `media/main.js`
- Modify: `media/style.css`

- [ ] **Step 1: Append WS styles to `media/style.css`**

Add at the end of `media/style.css`:

```css
.ws-status {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 8px 0;
  font-size: 12px;
}

.status-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--vscode-descriptionForeground);
}

.status-dot.connected { background: var(--success); }
.status-dot.connecting { background: var(--warn); }
.status-dot.error { background: var(--error); }

.ws-messages {
  background: var(--input-bg);
  border: 1px solid var(--border);
  padding: 4px;
  height: 250px;
  overflow-y: auto;
  font-family: var(--code-font);
  font-size: 12px;
  margin-bottom: 8px;
}

.ws-msg {
  padding: 2px 4px;
  border-bottom: 1px dotted var(--border);
  word-break: break-all;
  white-space: pre-wrap;
}

.ws-msg.send { color: var(--vscode-textLink-foreground, #3794ff); }
.ws-msg.recv { color: var(--success); }

.ws-msg .ws-ts {
  color: var(--vscode-descriptionForeground);
  margin-right: 4px;
  font-size: 11px;
}

.ws-msg .ws-dir {
  display: inline-block;
  width: 20px;
  font-weight: 600;
}
```

- [ ] **Step 2: Append WS logic to `media/main.js`**

Add at the end of the IIFE in `media/main.js` (inside the `(function () { ... })();` block, before the closing `})();`):

```javascript
  // --- WebSocket ---
  const wsConnectBtn = document.getElementById('ws-connect');
  const wsDisconnectBtn = document.getElementById('ws-disconnect');
  const wsSendBtn = document.getElementById('ws-send');
  const wsUrlInput = document.getElementById('ws-url');
  const wsInput = document.getElementById('ws-input');
  const wsMessagesEl = document.getElementById('ws-messages');
  const wsStatusDot = document.getElementById('ws-status-dot');
  const wsStatusText = document.getElementById('ws-status-text');

  wsConnectBtn.addEventListener('click', () => {
    const url = wsUrlInput.value.trim();
    if (!url) {
      showWsError('URL is required');
      return;
    }
    vscode.postMessage({ type: 'ws.connect', payload: { url } });
  });

  wsDisconnectBtn.addEventListener('click', () => {
    vscode.postMessage({ type: 'ws.disconnect', payload: {} });
  });

  wsSendBtn.addEventListener('click', sendWs);
  wsInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendWs();
    }
  });

  function sendWs() {
    const data = wsInput.value;
    if (!data) return;
    vscode.postMessage({ type: 'ws.send', payload: { data } });
    wsInput.value = '';
  }

  function appendWsMessage(msg) {
    const div = document.createElement('div');
    div.className = 'ws-msg ' + msg.dir;
    const ts = new Date(msg.ts).toLocaleTimeString();
    div.innerHTML =
      `<span class="ws-dir">${msg.dir === 'send' ? '→' : '←'}</span>` +
      `<span class="ws-ts">${escapeHtml(ts)}</span>` +
      `<span class="ws-data">${escapeHtml(msg.data)}</span>`;
    wsMessagesEl.appendChild(div);
    wsMessagesEl.scrollTop = wsMessagesEl.scrollHeight;
  }

  function setWsStatus(state, error) {
    wsStatusDot.className = 'status-dot ' + state;
    wsStatusText.textContent =
      state === 'connected' ? 'Connected' :
      state === 'connecting' ? 'Connecting...' :
      state === 'error' ? ('Error: ' + (error || '')) :
      'Disconnected';
  }

  function showWsError(msg) {
    setWsStatus('error', msg);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // Hook into message router (extend existing window listener)
  const origHandler = window.onmessage;
  // The handler is registered via addEventListener; instead we patch the message event below.
  window.addEventListener('message', (event) => {
    const msg = event.data;
    if (msg.type === 'ws.status') {
      setWsStatus(msg.payload.state, msg.payload.error);
    } else if (msg.type === 'ws.message') {
      appendWsMessage(msg.payload);
    }
  });
```

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: compiles

- [ ] **Step 4: Manual test with public echo server**

F5. Click the WebSocket tab. Enter URL `wss://echo.websocket.org`. Click Connect.

Expected:
- Status dot turns green, text says "Connected"
- Type `hello` in the input, click Send
- See `[→] 10:00:00 hello` and `[←] 10:00:00 hello` (echoed)
- Click Disconnect → status returns to "Disconnected"

- [ ] **Step 5: Commit**

```bash
git add media/main.js media/style.css
git commit -m "feat: WebSocket UI with connect, send, message log"
```

---

## Phase 4 — UI Polish

### Task 13: Right-click copy on response and messages

**Files:**
- Modify: `media/main.js`
- Modify: `package.json` (already has the menu definition; verify)

- [ ] **Step 1: Verify package.json has copy command**

The `package.json` from Task 1 already declared the webview context menu placeholder. We need a real command.

Modify `package.json` `contributes.commands` section — add to the existing commands array:

```json
{
  "command": "api-tester.copy",
  "title": "Copy",
  "category": "API Tester"
}
```

- [ ] **Step 2: Register the command in extension.ts**

Modify `src/extension.ts`:

```typescript
import * as vscode from 'vscode';
import { ApiTesterViewProvider } from './webview/ApiTesterViewProvider';

export function activate(context: vscode.ExtensionContext) {
  console.log('API & WebSocket Tester is now active');

  const provider = new ApiTesterViewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(ApiTesterViewProvider.viewType, provider)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('api-tester.openView', () => {
      vscode.commands.executeCommand('workbench.view.extension.apiTester.container');
    })
  );

  // Copy uses VS Code's built-in editor.action.clipboardCopyAction when invoked
  // in the webview context, but we also wire a direct command for the Webview.
  context.subscriptions.push(
    vscode.commands.registerCommand('api-tester.copy', () => {
      vscode.commands.executeCommand('editor.action.clipboardCopyAction');
    })
  );
}

export function deactivate() {}
```

- [ ] **Step 3: Add context menu CSS to make response selectable**

No code change needed — the response and message elements are already `<pre>` and `<div>` with text content. The default browser context menu (with copy) works in webviews.

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: compiles

- [ ] **Step 5: Manual test**

F5. Send an HTTP request. Right-click the response body → context menu shows "Copy". Click → text is copied to clipboard.

- [ ] **Step 6: Commit**

```bash
git add src/extension.ts package.json
git commit -m "feat: wire copy command for webview context menu"
```

---

### Task 14: Keyboard shortcut Ctrl+Enter inside webview

**Files:**
- Modify: `media/main.js`

- [ ] **Step 1: Add Ctrl+Enter handler**

In `media/main.js`, after `document.getElementById('http-send').addEventListener('click', sendHttp);` add:

```javascript
// Ctrl+Enter triggers send (intercept before VS Code's default)
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'Enter') {
    e.preventDefault();
    e.stopPropagation();
    const httpPanel = document.getElementById('http-panel');
    const wsPanel = document.getElementById('ws-panel');
    if (httpPanel.classList.contains('active')) {
      sendHttp();
    } else if (wsPanel.classList.contains('active')) {
      sendWs();
    }
  }
});
```

Note: the package.json keybinding `ctrl+enter` set in Task 1 only triggers when the webview has focus because of the `webviewId == 'apiTester.webview'` clause. We also wire a JS-level handler as a fallback inside the webview.

- [ ] **Step 2: Build**

Run: `npm run build`

- [ ] **Step 3: Manual test**

F5. Focus inside URL input, press Ctrl+Enter → request is sent.

- [ ] **Step 4: Commit**

```bash
git add media/main.js
git commit -m "feat: Ctrl+Enter keyboard shortcut in webview"
```

---

### Task 15: URL auto-protocol switch on tab change

**Files:**
- Modify: `media/main.js`

- [ ] **Step 1: Add URL rewrite on tab change**

Find the existing tab switching code in `media/main.js`:

```javascript
document.querySelectorAll('.tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('active', b === btn));
      document.querySelectorAll('.panel').forEach((p) => {
        p.classList.toggle('active', p.id === target + '-panel');
      });
    });
  });
```

Replace with:

```javascript
document.querySelectorAll('.tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('active', b === btn));
      document.querySelectorAll('.panel').forEach((p) => {
        p.classList.toggle('active', p.id === target + '-panel');
      });

      // Auto-rewrite URL protocol on tab switch
      if (target === 'http') {
        const url = document.getElementById('http-url').value.trim();
        if (url.startsWith('ws://')) {
          document.getElementById('http-url').value = 'http://' + url.slice(5);
        } else if (url.startsWith('wss://')) {
          document.getElementById('http-url').value = 'https://' + url.slice(6);
        }
        const wsUrl = document.getElementById('ws-url').value.trim();
        if (wsUrl.startsWith('http://')) {
          document.getElementById('ws-url').value = 'ws://' + wsUrl.slice(7);
        } else if (wsUrl.startsWith('https://')) {
          document.getElementById('ws-url').value = 'wss://' + wsUrl.slice(8);
        }
      } else if (target === 'ws') {
        const wsUrl = document.getElementById('ws-url').value.trim();
        if (!wsUrl) {
          const httpUrl = document.getElementById('http-url').value.trim();
          if (httpUrl.startsWith('http://')) {
            document.getElementById('ws-url').value = 'ws://' + httpUrl.slice(7);
          } else if (httpUrl.startsWith('https://')) {
            document.getElementById('ws-url').value = 'wss://' + httpUrl.slice(8);
          }
        }
      }
    });
  });
```

- [ ] **Step 2: Build and manual test**

Run: `npm run build`

F5. Enter `http://localhost:8000` in HTTP URL, click WebSocket tab. URL auto-fills as `ws://localhost:8000` in WS tab.

- [ ] **Step 3: Commit**

```bash
git add media/main.js
git commit -m "feat: auto-switch URL protocol between HTTP and WS tabs"
```

---

## Phase 5 — Persistence

### Task 16: HistoryService (TDD)

**Files:**
- Create: `src/services/HistoryService.ts`
- Create: `test/suite/HistoryService.test.ts`

- [ ] **Step 1: Write failing test `test/suite/HistoryService.test.ts`**

```typescript
import * as assert from 'assert';
import { HistoryService } from '../../src/services/HistoryService';
import { HistoryItem } from '../../src/types';

function fakeState(initial: HistoryItem[] = []) {
  const data: Record<string, unknown> = { 'apiTester.history': initial };
  return {
    get: <T>(k: string): T | undefined => data[k] as T,
    update: (k: string, v: unknown) => Promise.resolve(void (data[k] = v))
  } as any;
}

function makeItem(i: number): HistoryItem {
  return {
    id: `id-${i}`,
    kind: 'http',
    method: 'GET',
    url: `http://test/${i}`,
    headers: {},
    bodyType: 'none',
    ts: i
  };
}

suite('HistoryService', () => {
  test('list returns empty array when no state', () => {
    const svc = new HistoryService(fakeState([]));
    assert.deepStrictEqual(svc.list(), []);
  });

  test('add prepends new item', async () => {
    const state = fakeState([makeItem(1)]);
    const svc = new HistoryService(state);
    await svc.add(makeItem(2));
    const items = svc.list();
    assert.strictEqual(items.length, 2);
    assert.strictEqual(items[0].id, 'id-2');
    assert.strictEqual(items[1].id, 'id-1');
  });

  test('add truncates to MAX (50) keeping newest', async () => {
    const initial = Array.from({ length: 50 }, (_, i) => makeItem(i));
    const state = fakeState(initial);
    const svc = new HistoryService(state);
    await svc.add(makeItem(99));
    const items = svc.list();
    assert.strictEqual(items.length, 50);
    assert.strictEqual(items[0].id, 'id-99');
  });
});
```

- [ ] **Step 2: Write stub `src/services/HistoryService.ts`**

```typescript
import { Memento } from 'vscode';
import { HistoryItem } from '../types';

export const HISTORY_KEY = 'apiTester.history';
export const HISTORY_MAX = 50;

export class HistoryService {
  constructor(private _state: Memento) {}

  list(): HistoryItem[] {
    return [];
  }

  async add(_item: HistoryItem): Promise<void> {
    throw new Error('not implemented');
  }
}
```

- [ ] **Step 3: Build and run tests (expect failure)**

Run: `npm run build && npm test`
Expected: HistoryService tests fail

- [ ] **Step 4: Implement HistoryService**

```typescript
import { Memento } from 'vscode';
import { HistoryItem } from '../types';

export const HISTORY_KEY = 'apiTester.history';
export const HISTORY_MAX = 50;

export class HistoryService {
  constructor(private _state: Memento) {}

  list(): HistoryItem[] {
    return this._state.get<HistoryItem[]>(HISTORY_KEY) ?? [];
  }

  async add(item: HistoryItem): Promise<void> {
    const current = this.list();
    const next = [item, ...current].slice(0, HISTORY_MAX);
    await this._state.update(HISTORY_KEY, next);
  }
}
```

- [ ] **Step 5: Build and run tests (expect pass)**

Run: `npm run build && npm test`
Expected: all HistoryService tests pass

- [ ] **Step 6: Commit**

```bash
git add src/services/HistoryService.ts test/suite/HistoryService.test.ts
git commit -m "feat: HistoryService with 50-item cap and tests"
```

---

### Task 17: CollectionService (TDD)

**Files:**
- Create: `src/services/CollectionService.ts`
- Create: `test/suite/CollectionService.test.ts`

- [ ] **Step 1: Write failing test `test/suite/CollectionService.test.ts`**

```typescript
import * as assert from 'assert';
import { CollectionService } from '../../src/services/CollectionService';
import { CollectionItem } from '../../src/types';

function fakeState(initial: CollectionItem[] = []) {
  const data: Record<string, unknown> = { 'apiTester.collections': initial };
  return {
    get: <T>(k: string): T | undefined => data[k] as T,
    update: (k: string, v: unknown) => Promise.resolve(void (data[k] = v))
  } as any;
}

suite('CollectionService', () => {
  test('list returns empty array when no state', () => {
    const svc = new CollectionService(fakeState([]));
    assert.deepStrictEqual(svc.list(), []);
  });

  test('save appends item with generated id and timestamp', async () => {
    const svc = new CollectionService(fakeState([]));
    const saved = await svc.save({
      name: 'Get user',
      method: 'GET',
      url: 'http://x',
      headers: {},
      bodyType: 'none'
    });
    assert.ok(saved.id);
    assert.ok(saved.ts);
    assert.strictEqual(svc.list().length, 1);
  });

  test('delete removes by id', async () => {
    const svc = new CollectionService(fakeState([]));
    const a = await svc.save({ name: 'A', bodyType: 'none' });
    const b = await svc.save({ name: 'B', bodyType: 'none' });
    await svc.delete(a.id);
    const items = svc.list();
    assert.strictEqual(items.length, 1);
    assert.strictEqual(items[0].id, b.id);
  });

  test('get returns item by id or undefined', async () => {
    const svc = new CollectionService(fakeState([]));
    const a = await svc.save({ name: 'A', bodyType: 'none' });
    assert.strictEqual(svc.get(a.id)?.name, 'A');
    assert.strictEqual(svc.get('nope'), undefined);
  });
});
```

- [ ] **Step 2: Write stub `src/services/CollectionService.ts`**

```typescript
import { Memento } from 'vscode';
import { CollectionItem } from '../types';
import { uuid } from '../utils/id';

export const COLLECTION_KEY = 'apiTester.collections';

export class CollectionService {
  constructor(private _state: Memento) {}

  list(): CollectionItem[] {
    return [];
  }

  async save(item: Omit<CollectionItem, 'id' | 'ts'>): Promise<CollectionItem> {
    throw new Error('not implemented');
  }

  async delete(id: string): Promise<void> {
    throw new Error('not implemented');
  }

  get(id: string): CollectionItem | undefined {
    return undefined;
  }
}
```

- [ ] **Step 3: Build and run tests (expect failure)**

Run: `npm run build && npm test`
Expected: tests fail

- [ ] **Step 4: Implement CollectionService**

```typescript
import { Memento } from 'vscode';
import { CollectionItem } from '../types';
import { uuid } from '../utils/id';

export const COLLECTION_KEY = 'apiTester.collections';

export class CollectionService {
  constructor(private _state: Memento) {}

  list(): CollectionItem[] {
    return this._state.get<CollectionItem[]>(COLLECTION_KEY) ?? [];
  }

  async save(item: Omit<CollectionItem, 'id' | 'ts'>): Promise<CollectionItem> {
    const full: CollectionItem = { ...item, id: uuid(), ts: Date.now() };
    const next = [...this.list(), full];
    await this._state.update(COLLECTION_KEY, next);
    return full;
  }

  async delete(id: string): Promise<void> {
    const next = this.list().filter((c) => c.id !== id);
    await this._state.update(COLLECTION_KEY, next);
  }

  get(id: string): CollectionItem | undefined {
    return this.list().find((c) => c.id === id);
  }
}
```

- [ ] **Step 5: Build and run tests (expect pass)**

Run: `npm run build && npm test`
Expected: all tests pass

- [ ] **Step 6: Commit**

```bash
git add src/services/CollectionService.ts test/suite/CollectionService.test.ts
git commit -m "feat: CollectionService CRUD with tests"
```

---

### Task 18: Wire history + collection into ViewProvider and commands

**Files:**
- Modify: `src/webview/ApiTesterViewProvider.ts`

- [ ] **Step 1: Replace `src/webview/ApiTesterViewProvider.ts`**

```typescript
import * as vscode from 'vscode';
import { HttpService } from '../services/HttpService';
import { WsService } from '../services/WsService';
import { HistoryService } from '../services/HistoryService';
import { CollectionService } from '../services/CollectionService';
import { HistoryItem, WebviewMessage, ExtMessage } from '../types';
import { uuid } from '../utils/id';

export class ApiTesterViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'apiTester.view';
  private _view?: vscode.WebviewView;
  private _http = new HttpService();
  private _ws = new WsService();
  private _history!: HistoryService;
  private _collection!: CollectionService;

  constructor(private readonly _extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
    this._history = new HistoryService(context.globalState);
    this._collection = new CollectionService(context.globalState);
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };
    webviewView.webview.html = this._getHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((msg: WebviewMessage) => {
      this._handleMessage(msg);
    });

    this._ws.on('status', (s: { state: string; error?: string }) => {
      this._post({ type: 'ws.status', payload: s as any });
    });
    this._ws.on('message', (m) => {
      this._post({ type: 'ws.message', payload: m });
    });
  }

  private async _handleMessage(msg: WebviewMessage): Promise<void> {
    try {
      switch (msg.type) {
        case 'http.send': {
          const res = await this._http.send(msg.payload);
          this._post({ type: 'http.response', payload: res });
          // Append to history
          const item: HistoryItem = {
            id: uuid(),
            kind: 'http',
            method: msg.payload.method,
            url: msg.payload.url,
            headers: msg.payload.headers,
            body: msg.payload.body,
            bodyType: msg.payload.bodyType,
            ts: Date.now(),
            status: res.status,
            time: res.time
          };
          await this._history.add(item);
          break;
        }
        case 'ws.connect': {
          try {
            await this._ws.connect(msg.payload.url);
          } catch (e) {
            this._post({
              type: 'error',
              payload: { message: `WS connect failed: ${(e as Error).message}` }
            });
          }
          break;
        }
        case 'ws.disconnect': {
          this._ws.disconnect();
          break;
        }
        case 'ws.send': {
          try {
            await this._ws.send(msg.payload.data);
          } catch (e) {
            this._post({
              type: 'error',
              payload: { message: `WS send failed: ${(e as Error).message}` }
            });
          }
          break;
        }
        case 'history.list': {
          this._post({ type: 'history.list', payload: { items: this._history.list() } });
          break;
        }
        case 'history.save': {
          await this._history.add(msg.payload.item);
          break;
        }
        case 'collection.list': {
          this._post({ type: 'collection.list', payload: { items: this._collection.list() } });
          break;
        }
        case 'collection.save': {
          const saved = await this._collection.save(msg.payload.item);
          this._post({ type: 'collection.saved', payload: { item: saved } });
          break;
        }
        case 'collection.delete': {
          await this._collection.delete(msg.payload.id);
          this._post({ type: 'collection.deleted', payload: { id: msg.payload.id } });
          break;
        }
        case 'request.execute': {
          // Re-load and execute a stored request
          const stored =
            msg.payload.source === 'history'
              ? this._history.list().find((h) => h.id === msg.payload.id)
              : this._collection.get(msg.payload.id);
          if (stored && stored.url) {
            const res = await this._http.send({
              method: stored.method ?? 'GET',
              url: stored.url,
              headers: stored.headers ?? {},
              body: stored.body,
              bodyType: stored.bodyType ?? 'none',
              auth: { type: 'none' }
            });
            this._post({ type: 'http.response', payload: res });
          }
          break;
        }
      }
    } catch (e) {
      this._post({ type: 'error', payload: { message: (e as Error).message } });
    }
  }

  private _post(msg: ExtMessage): void {
    this._view?.webview.postMessage(msg);
  }

  private _getHtml(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'style.css')
    );

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource};">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Tester</title>
  <link rel="stylesheet" href="${styleUri}">
</head>
<body>
  <header class="title-bar">
    <span class="title">🔌 API & WebSocket Tester</span>
  </header>

  <nav class="tabs">
    <button class="tab active" data-tab="http">HTTP</button>
    <button class="tab" data-tab="ws">WebSocket</button>
    <button class="tab" data-tab="collections">Collections</button>
    <button class="tab" data-tab="history">History</button>
  </nav>

  <main id="http-panel" class="panel active">
    <div class="request-line">
      <select id="http-method">
        <option value="GET">GET</option>
        <option value="POST">POST</option>
        <option value="PUT">PUT</option>
        <option value="DELETE">DELETE</option>
        <option value="PATCH">PATCH</option>
      </select>
      <input type="text" id="http-url" placeholder="https://api.example.com/endpoint" />
      <button id="http-send" class="btn-primary">Send</button>
      <button id="http-save" class="btn-secondary">Save</button>
    </div>

    <nav class="subtabs">
      <button class="subtab active" data-subtab="headers">Headers</button>
      <button class="subtab" data-subtab="body">Body</button>
      <button class="subtab" data-subtab="auth">Auth</button>
    </nav>

    <section id="sub-headers" class="subpanel active">
      <div id="headers-list"></div>
      <button id="header-add" class="btn-secondary">+ Add Header</button>
    </section>

    <section id="sub-body" class="subpanel">
      <div class="body-type">
        <label><input type="radio" name="body-type" value="none" checked> None</label>
        <label><input type="radio" name="body-type" value="json"> JSON</label>
        <label><input type="radio" name="body-type" value="text"> Text</label>
        <label><input type="radio" name="body-type" value="form"> Form</label>
      </div>
      <textarea id="body-input" placeholder='{"key":"value"}' spellcheck="false"></textarea>
    </section>

    <section id="sub-auth" class="subpanel">
      <label>Type:
        <select id="auth-type">
          <option value="none">None</option>
          <option value="bearer">Bearer Token</option>
          <option value="basic">Basic Auth</option>
        </select>
      </label>
      <div id="auth-bearer" class="auth-fields" hidden>
        <label>Token: <input type="text" id="auth-token" placeholder="ey..."></label>
      </div>
      <div id="auth-basic" class="auth-fields" hidden>
        <label>Username: <input type="text" id="auth-user"></label>
        <label>Password: <input type="password" id="auth-pass"></label>
      </div>
    </section>

    <section class="response-section">
      <div class="response-header">
        <span class="response-label">↓ Response</span>
        <span id="response-status" class="response-status"></span>
      </div>
      <pre id="response-body" class="response-body" spellcheck="false"></pre>
      <div class="response-meta">
        <span id="response-time"></span>
        <span id="response-size"></span>
      </div>
    </section>
  </main>

  <main id="ws-panel" class="panel">
    <div class="request-line">
      <input type="text" id="ws-url" placeholder="ws://localhost:8000/ws" />
      <button id="ws-connect" class="btn-primary">Connect</button>
      <button id="ws-disconnect" class="btn-secondary">Disconnect</button>
    </div>
    <div class="ws-status">
      <span class="status-dot" id="ws-status-dot"></span>
      <span id="ws-status-text">Disconnected</span>
    </div>
    <div id="ws-messages" class="ws-messages"></div>
    <div class="request-line">
      <input type="text" id="ws-input" placeholder='{"type":"ping"}' />
      <button id="ws-send" class="btn-primary">Send</button>
    </div>
  </main>

  <main id="collections-panel" class="panel">
    <div id="collections-list" class="list"></div>
    <button id="collections-refresh" class="btn-secondary">Refresh</button>
  </main>

  <main id="history-panel" class="panel">
    <div id="history-list" class="list"></div>
    <button id="history-refresh" class="btn-secondary">Refresh</button>
  </main>

  <script src="${scriptUri}"></script>
</body>
</html>`;
  }
}
```

- [ ] **Step 2: Update src/extension.ts to pass context**

```typescript
import * as vscode from 'vscode';
import { ApiTesterViewProvider } from './webview/ApiTesterViewProvider';

export function activate(context: vscode.ExtensionContext) {
  console.log('API & WebSocket Tester is now active');

  const provider = new ApiTesterViewProvider(context.extensionUri, context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(ApiTesterViewProvider.viewType, provider)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('api-tester.openView', () => {
      vscode.commands.executeCommand('workbench.view.extension.apiTester.container');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('api-tester.copy', () => {
      vscode.commands.executeCommand('editor.action.clipboardCopyAction');
    })
  );
}

export function deactivate() {}
```

- [ ] **Step 3: Build**

Run: `npm run build`

- [ ] **Step 4: Commit**

```bash
git add src/webview/ApiTesterViewProvider.ts src/extension.ts
git commit -m "feat: wire HistoryService and CollectionService into webview"
```

---

### Task 19: History & Collections UI

**Files:**
- Modify: `media/main.js`
- Modify: `media/style.css`

- [ ] **Step 1: Append list styles to `media/style.css`**

```css
.list {
  background: var(--input-bg);
  border: 1px solid var(--border);
  max-height: 300px;
  overflow-y: auto;
}

.list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 6px;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  font-size: 12px;
}

.list-item:hover {
  background: var(--btn-hover);
}

.list-item .item-main {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.list-item .item-meta {
  font-size: 11px;
  color: var(--vscode-descriptionForeground);
  margin-left: 8px;
}

.list-item .item-action {
  background: transparent;
  color: var(--error);
  border: none;
  cursor: pointer;
  padding: 0 4px;
}

.empty-list {
  padding: 12px;
  text-align: center;
  color: var(--vscode-descriptionForeground);
  font-size: 12px;
}
```

- [ ] **Step 2: Append History + Collections + Save logic to `media/main.js`**

Add to the IIFE in `media/main.js`, before the closing `})();`:

```javascript
  // --- Save dialog ---
  document.getElementById('http-save').addEventListener('click', () => {
    const url = document.getElementById('http-url').value.trim();
    if (!url) {
      showError('URL is required');
      return;
    }
    const name = prompt('Save as (name):');
    if (!name) return;
    const method = document.getElementById('http-method').value;
    const bodyType = document.querySelector('input[name="body-type"]:checked').value;
    const body = bodyType === 'none' ? undefined : document.getElementById('body-input').value;
    vscode.postMessage({
      type: 'collection.save',
      payload: {
        item: { name, method, url, headers: collectHeaders(), body, bodyType }
      }
    });
  });

  // --- Collections tab ---
  document.getElementById('collections-refresh').addEventListener('click', () => {
    vscode.postMessage({ type: 'collection.list', payload: {} });
  });

  document.getElementById('history-refresh').addEventListener('click', () => {
    vscode.postMessage({ type: 'history.list', payload: {} });
  });

  function renderList(containerId, items, source) {
    const el = document.getElementById(containerId);
    el.innerHTML = '';
    if (!items.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-list';
      empty.textContent = source === 'history' ? 'No history yet' : 'No saved requests';
      el.appendChild(empty);
      return;
    }
    for (const item of items) {
      const div = document.createElement('div');
      div.className = 'list-item';
      const main = source === 'history'
        ? `${item.method} ${item.url}`
        : `${item.name} — ${item.method || 'WS'} ${item.url || item.wsUrl || ''}`;
      const meta = source === 'history'
        ? `${item.status || ''} ${item.time || 0}ms`
        : '';
      div.innerHTML =
        `<span class="item-main">${escapeHtml(main)}</span>` +
        `<span class="item-meta">${escapeHtml(meta)}</span>` +
        (source === 'collection'
          ? `<button class="item-action" data-id="${item.id}" title="Delete">×</button>`
          : '');
      div.querySelector('.item-main').addEventListener('click', () => {
        vscode.postMessage({
          type: 'request.execute',
          payload: { id: item.id, source }
        });
        // Switch to HTTP tab
        document.querySelector('.tab[data-tab="http"]').click();
      });
      if (source === 'collection') {
        div.querySelector('.item-action').addEventListener('click', (e) => {
          e.stopPropagation();
          vscode.postMessage({ type: 'collection.delete', payload: { id: item.id } });
        });
      }
      el.appendChild(div);
    }
  }

  // Extend window message handler
  window.addEventListener('message', (event) => {
    const msg = event.data;
    if (msg.type === 'history.list') {
      renderList('history-list', msg.payload.items, 'history');
    } else if (msg.type === 'collection.list' || msg.type === 'collection.saved') {
      const items = msg.type === 'collection.saved' ? [msg.payload.item] : msg.payload.items;
      // Refresh the full list after save
      if (msg.type === 'collection.saved') {
        vscode.postMessage({ type: 'collection.list', payload: {} });
      } else {
        renderList('collections-list', items, 'collection');
      }
    } else if (msg.type === 'collection.deleted') {
      vscode.postMessage({ type: 'collection.list', payload: {} });
    }
  });

  // Initial loads
  vscode.postMessage({ type: 'history.list', payload: {} });
  vscode.postMessage({ type: 'collection.list', payload: {} });
```

- [ ] **Step 3: Build**

Run: `npm run build`

- [ ] **Step 4: Manual test**

F5. Send a few HTTP requests, switch to History tab → see list. Save a request to Collections → appears in Collections tab. Reload window (Ctrl+R in Extension Development Host) → history and collections persist.

- [ ] **Step 5: Commit**

```bash
git add media/main.js media/style.css
git commit -m "feat: History and Collections UI with click-to-replay and persistence"
```

---

## Phase 6 — Tests and Packaging

### Task 20: README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace `README.md`**

````markdown
# VS Code API & WebSocket Tester

A VS Code extension that lets you test HTTP APIs and WebSocket connections directly from the sidebar — no need to switch to Postman or `websocat`.

## Features

- **HTTP**: GET / POST / PUT / DELETE / PATCH with custom headers, body (JSON / text / form), and auth (Bearer / Basic)
- **WebSocket**: Connect to `ws://` and `wss://`, send/receive text messages with timestamps
- **History**: Last 50 HTTP requests are persisted and click-to-replay
- **Collections**: Save and reuse requests with a friendly name
- **Theme**: Adapts to VS Code dark/light themes automatically
- **Shortcuts**: `Ctrl+Shift+W` to open, `Ctrl+Enter` to send

## Usage

1. Click the **API Tester** icon in the activity bar
2. Switch between **HTTP** and **WebSocket** tabs
3. For HTTP: enter URL, click **Send**
4. For WebSocket: enter `ws://...` URL, click **Connect**, type messages and **Send**

## Development

```bash
npm install
npm run build      # Compile TypeScript
npm test           # Run unit tests
npm run package    # Build .vsix
```

To debug, open this folder in VS Code and press **F5** (Extension Development Host).

## Architecture

See `docs/superpowers/specs/2026-06-28-vscode-api-ws-tester-design.md`.
````

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add user-facing README"
```

---

### Task 21: Run all tests and verify green

**Files:** none

- [ ] **Step 1: Run full test suite**

Run: `npm test`
Expected: all tests pass — format (3), HttpService (3), WsService (3), HistoryService (3), CollectionService (4) = 16 tests passing.

- [ ] **Step 2: If any test fails, fix and re-run until green**

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: no errors (warnings ok)

---

### Task 22: Manual end-to-end test against PRD acceptance criteria

**Files:** none

- [ ] **Step 1: HTTP acceptance (PRD §6.1)**

F5 in Extension Development Host. Verify each:
- [ ] GET request returns 200 and shows body
- [ ] POST with JSON body works
- [ ] PUT, DELETE, PATCH all work
- [ ] 2xx shows green, 4xx shows yellow, 5xx shows red
- [ ] Response JSON is auto-formatted
- [ ] Non-JSON response shows raw text
- [ ] Editing headers / body takes effect on next send
- [ ] History persists across reload
- [ ] Collection saves and re-loads correctly

- [ ] **Step 2: WebSocket acceptance (PRD §6.2)**

- [ ] Connect to `wss://echo.websocket.org` succeeds
- [ ] Failed connection shows error message
- [ ] Sent message appears in log with →
- [ ] Received message appears with ←
- [ ] Disconnect changes status to "Disconnected"

- [ ] **Step 3: Overall UX (PRD §6.3)**

- [ ] Open and close the sidebar repeatedly — no slowdown in VS Code
- [ ] Switch VS Code theme — plugin UI adapts
- [ ] Sidebar icon visible in activity bar

- [ ] **Step 4: Document any issues found and fix them**

If any acceptance criterion fails, fix the issue, commit, and re-verify.

---

### Task 23: Package the extension

**Files:** none

- [ ] **Step 1: Verify build is fresh**

Run: `npm run build`
Expected: `dist/extension.js` exists with current source

- [ ] **Step 2: Run vsce package**

Run: `npm run package`
Expected: produces `vscode-api-ws-tester-0.1.0.vsix` in repo root

- [ ] **Step 3: Verify .vsix contents**

Run: `unzip -l vscode-api-ws-tester-0.1.0.vsix | head -40`
Expected: includes `extension/dist/extension.js`, `extension/media/*`, `extension/package.json`, no `node_modules/`, no `src/`

- [ ] **Step 4: Commit final state**

```bash
git add -A
git commit -m "chore: package .vsix artifact (not committed)" --allow-empty
```

Note: `.vsix` is gitignored. The commit is a marker.

- [ ] **Step 5: Final tag (optional)**

```bash
git tag v0.1.0
```

---

## Verification Checklist (Final)

After all 23 tasks:

- [ ] `npm run build` succeeds
- [ ] `npm test` shows 16+ passing tests
- [ ] `npm run package` produces a `.vsix` file
- [ ] F5 launches Extension Development Host
- [ ] Sidebar icon visible, opens the panel
- [ ] HTTP GET/POST/PUT/DELETE/PATCH all work end-to-end
- [ ] WebSocket connect/send/receive works against a real echo server
- [ ] History persists across window reloads
- [ ] Collections persist, can be replayed, can be deleted
- [ ] Dark and light themes both readable
- [ ] `Ctrl+Enter` sends request
- [ ] Right-click → Copy works on response body

---

## Risks and Mitigations

| Risk | Mitigation |
| :--- | :--- |
| `ws` package version conflict with VS Code's bundled Node | Lock `ws@^8.16.0`; engines.vscode `^1.74.0` |
| Webview CSP blocks inline scripts | We use external `main.js` file referenced via webview.asWebviewUri |
| Sidebar too narrow for full HTTP form | UI uses vertical scroll, encourage users to drag panel to auxiliary bar (right side) |
| Large response body freezes UI | `response-body` has `max-height: 300px` and `overflow: auto` |
| WS messages accumulate forever | WsService caps at 500 messages, dropping oldest 100 when full |