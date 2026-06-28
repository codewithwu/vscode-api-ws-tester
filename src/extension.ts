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