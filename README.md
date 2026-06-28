# VS Code API & WebSocket Tester

[![Open in Open VSX](https://img.shields.io/open-vsx/v/codewithwu-cn/vscode-api-ws-tester)](https://open-vsx.org/extension/codewithwu-cn/vscode-api-ws-tester)

A VS Code extension that lets you test HTTP APIs and WebSocket connections directly from the sidebar — no need to switch to Postman or `websocat`.

## Installation

Install from [Open VSX Registry](https://open-vsx.org/extension/codewithwu-cn/vscode-api-ws-tester):

```bash
code --install-extension codewithwu-cn.vscode-api-ws-tester
```

Or install a local `.vsix` file (after `npm run package`):

```bash
code --install-extension vscode-api-ws-tester-0.1.2.vsix
```

To uninstall:

```bash
code --uninstall-extension codewithwu-cn.vscode-api-ws-tester
```

Or install the [Open VSX](https://marketplace.visualstudio.com/items?itemName=open-vsx.open-vsx) extension to search this and other Open VSX-published extensions directly from VS Code.

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
