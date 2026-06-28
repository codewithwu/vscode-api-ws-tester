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