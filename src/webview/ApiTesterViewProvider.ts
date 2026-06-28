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
    <p>WebSocket panel — Phase 3</p>
  </main>

  <script src="${scriptUri}"></script>
</body>
</html>`;
  }
}