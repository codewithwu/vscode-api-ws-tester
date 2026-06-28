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
        case 'collection.save.prompt': {
          const name = await vscode.window.showInputBox({
            prompt: 'Name for this saved request',
            placeHolder: 'e.g. Get user profile',
            validateInput: (v) => (v.trim() ? null : 'Name is required')
          });
          if (name) {
            const saved = await this._collection.save({ ...msg.payload.spec, name });
            this._post({
              type: 'collection.save.prompt.result',
              payload: { name, spec: { ...msg.payload.spec, name } }
            });
            this._post({ type: 'collection.saved', payload: { item: saved } });
          } else {
            this._post({
              type: 'collection.save.prompt.result',
              payload: { name: null, spec: null }
            });
          }
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
          if (!stored) break;
          // History items only have HTTP fields; only CollectionItem may have wsUrl.
          const isWsOnly =
            'wsUrl' in stored && !!stored.wsUrl && !stored.url;
          if (isWsOnly && stored.wsUrl) {
            try {
              await this._ws.connect(stored.wsUrl);
            } catch (e) {
              this._post({
                type: 'error',
                payload: { message: `WS connect failed: ${(e as Error).message}` }
              });
            }
          } else if (stored.url) {
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