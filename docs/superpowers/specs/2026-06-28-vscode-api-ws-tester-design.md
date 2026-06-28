# VS Code API & WebSocket Tester — 设计文档

| 项目 | 内容 |
| :--- | :--- |
| 文档版本 | v1.0 |
| 日期 | 2026-06-28 |
| 状态 | 待评审 |
| 上游输入 | `prd.md` (v1.0, 待评审) |
| 范围 | MVP v1.0（完整实现） |

---

## 1. 目标与非目标

### 1.1 目标

实现 `prd.md` 描述的完整 MVP v1.0：在 VS Code 侧边栏提供一个集成 HTTP API 测试和 WebSocket 测试的 Webview 视图，让开发者无需离开编辑器即可完成接口调试。

### 1.2 非目标（本次不做）

- GraphQL 支持（v2.0）
- 环境变量管理（v2.0）
- 从 `.http` / `.rest` 文件导入（v2.0）
- 导出 curl / Postman Collection（v2.0）
- 请求链 / 流程测试（v2.0）
- 二进制消息（v2.0）
- 消息模板（v2.0）
- 发布到 Marketplace（Phase 6 仅完成 `.vsix` 打包）

---

## 2. 关键设计决策

| 决策 | 选择 | 备选 | 理由 |
| :--- | :--- | :--- | :--- |
| 脚手架 | 手写精简 | yo code | 轻量、无交互式依赖 |
| 主视图位置 | 侧边栏 WebviewView（`viewsContainer: activitybar`） | 编辑器 Tab | 符合 PRD §3.1 布局示意 |
| Webview UI 样式 | 原生 HTML + CSS + VS Code 主题变量 | React、UI Toolkit | 零构建步骤、体积小、主题自动适配 |
| HTTP 客户端 | Node.js 原生 `http` / `https` | axios | 零额外依赖 |
| WebSocket 客户端 | `ws` | - | PRD 明确推荐 |
| 业务分层 | Extension（业务）+ Webview（表现） | 全在 Webview | 业务逻辑可单元测试、持久化在 Extension |
| 持久化 | `context.globalState` | 文件系统 | PRD 明确指定；MVP 阶段够用 |
| 单元测试 | `@vscode/test-electron` + Mocha | - | VS Code 官方方案 |

---

## 3. 架构

### 3.1 分层

```
┌────────────────────────────────────────────────────────┐
│ VS Code Extension Host（Node.js 进程）                 │
│                                                        │
│  ┌────────────────────────────────────────────────┐    │
│  │ services/                                       │    │
│  │  ├─ HttpService     — 发送 HTTP 请求           │    │
│  │  ├─ WsService       — 管理 WebSocket 连接      │    │
│  │  ├─ HistoryService  — 读写最近 50 条请求历史    │    │
│  │  └─ CollectionService — 读写收藏集合           │    │
│  └────────────────────────────────────────────────┘    │
│                        ▲                               │
│                        │ postMessage                   │
│                        ▼                               │
│  ┌────────────────────────────────────────────────┐    │
│  │ webview/                                        │    │
│  │  └─ ApiTesterViewProvider — 消息路由 + 状态   │    │
│  └────────────────────────────────────────────────┘    │
│                        │                               │
│  ┌────────────────────────────────────────────────┐    │
│  │ commands/  — 注册到 VS Code 命令面板          │    │
│  └────────────────────────────────────────────────┘    │
└────────────────────┬───────────────────────────────────┘
                     │ Webview (隔离上下文)
                     ▼
┌────────────────────────────────────────────────────────┐
│ Webview（HTML/CSS/JS）                                 │
│  ├─ index.html  — 顶层布局                              │
│  ├─ main.js     — UI 状态、事件处理、消息发送           │
│  └─ style.css   — 使用 --vscode-* 主题变量              │
└────────────────────────────────────────────────────────┘
```

### 3.2 职责边界

| 单元 | 职责 | 不做的事 |
| :--- | :--- | :--- |
| `HttpService` | 构造请求、调用 Node `http`/`https`、解析响应、计算耗时/体积 | 不存历史、不处理 UI |
| `WsService` | 管理单个连接、收发消息、维护消息队列（最多 500 条） | 不存历史 |
| `HistoryService` | 读写 globalState、追加/截断 50 条上限 | 不发起请求 |
| `CollectionService` | 读写收藏集合（CRUD） | 不发起请求 |
| `ApiTesterViewProvider` | 创建 Webview、转发双向消息 | 不直接调用 http/ws |
| Webview `main.js` | DOM 渲染、表单状态、调用 Extension API | 不直连网络、不持久化 |

---

## 4. 数据流

### 4.1 HTTP 发送

```
[User] 点击 Send
   │
   ▼
[Webview] 收集表单数据（method/url/headers/body）
   │  postMessage({ type: 'http.send', payload: { ... } })
   ▼
[ApiTesterViewProvider] 接收消息 → 调用 HttpService.send()
   │
   ▼
[HttpService] 用 Node http/https 发送
   │
   ▼
[HttpService] 返回 { status, headers, body, time, size }
   │
   ▼
[ApiTesterViewProvider] postMessage({ type: 'http.response', payload })
   │
   ▼
[Webview] 渲染响应区
   │  并通知 Extension 保存到历史
   ▼
[HistoryService] 追加记录（如超出 50 条则截断）
```

### 4.2 WebSocket 连接

```
[User] 点击 Connect
   │
   ▼
[Webview] postMessage({ type: 'ws.connect', url })
   ▼
[WsService.connect(url)] 创建 ws 实例
   │  注册事件：
   │    'open'    → postMessage({ type: 'ws.status', state: 'connected' })
   │    'message' → postMessage({ type: 'ws.message', dir: 'recv', data, ts })
   │    'error'   → postMessage({ type: 'ws.status', state: 'error', error })
   │    'close'   → postMessage({ type: 'ws.status', state: 'disconnected' })
   ▼
[User] 在输入框输入消息 → 点击 Send
   │
   ▼
[Webview] postMessage({ type: 'ws.send', data })
   ▼
[WsService] ws.send(data)
   │  + 在内部消息队列记录 { dir: 'send', data, ts }
   │  + postMessage 通知 Webview 追加发送消息
```

### 4.3 消息契约（Webview ↔ Extension）

| 方向 | `type` | payload |
| :--- | :--- | :--- |
| Web → Ext | `http.send` | `{ method, url, headers, body }` |
| Ext → Web | `http.response` | `{ status, statusText, headers, body, time, size, error? }` |
| Web → Ext | `ws.connect` | `{ url }` |
| Web → Ext | `ws.disconnect` | `{}` |
| Web → Ext | `ws.send` | `{ data }` |
| Ext → Web | `ws.status` | `{ state: 'connecting'\|'connected'\|'disconnected'\|'error', error? }` |
| Ext → Web | `ws.message` | `{ dir: 'send'\|'recv', data, ts }` |
| Web → Ext | `history.load` | `{}` |
| Ext → Web | `history.list` | `{ items: HistoryItem[] }` |
| Web → Ext | `history.save` | `{ item: HistoryItem }` |
| Web → Ext | `collection.list` | `{}` |
| Ext → Web | `collection.items` | `{ items: CollectionItem[] }` |
| Web → Ext | `collection.save` | `{ item: CollectionItem }` |
| Web → Ext | `collection.delete` | `{ id }` |
| Web → Ext | `request.execute` | `{ id }`（重新发送某条历史/收藏） |

---

## 5. 数据模型

### 5.1 HistoryItem

```typescript
interface HistoryItem {
  id: string;             // uuid v4
  kind: 'http';
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
  bodyType?: 'json' | 'text' | 'form';
  ts: number;             // Date.now()
  status?: number;        // 响应后写入
  time?: number;          // 耗时 ms
}
```

存储 key：`globalState['apiTester.history']` → `HistoryItem[]`（最多 50 条，先进先出截断）。

### 5.2 CollectionItem

```typescript
interface CollectionItem {
  id: string;
  name: string;
  kind: 'http' | 'ws';
  // HTTP 字段
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  body?: string;
  bodyType?: 'json' | 'text' | 'form';
  // WS 字段
  wsUrl?: string;
  // 公共
  ts: number;
}
```

存储 key：`globalState['apiTester.collections']` → `CollectionItem[]`。

### 5.3 WsService 内部消息队列

```typescript
interface WsMessage {
  dir: 'send' | 'recv';
  data: string;
  ts: number;
}
```

上限 500 条，超出后丢弃最早的 100 条。

---

## 6. UI 设计

### 6.1 整体布局

```
┌─────────────────────────────────────────────────────┐
│ 🔌 API & WebSocket Tester                  [⚙]    │
├─────────────────────────────────────────────────────┤
│  [ HTTP ]   [ WebSocket ]                           │
├─────────────────────────────────────────────────────┤
│  Method ▼  [________________________ URL ________] │
│  [ Send ]  [ Save ]                                 │
├─────────────────────────────────────────────────────┤
│  [ Headers ] [ Body ] [ Auth ]                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  ... 子面板内容 ...                          │   │
│  └──────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────┤
│  Response                    Status: 200 OK         │
│  ┌──────────────────────────────────────────────┐   │
│  │  ... 响应体（JSON 自动格式化）...            │   │
│  └──────────────────────────────────────────────┘   │
│  Time: 156ms  |  Size: 2.3KB                         │
└─────────────────────────────────────────────────────┘
```

### 6.2 WebSocket 模式布局

```
┌─────────────────────────────────────────────────────┐
│  ws://localhost:8000/ws  [Connect] [Disconnect]     │
│  状态: ● 已连接                                     │
├─────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────┐   │
│  │  [→] 10:00:01  Hello Server                 │   │
│  │  [←] 10:00:02  服务端收到                   │   │
│  │  [→] 10:00:05  {"type":"ping"}              │   │
│  │  [←] 10:00:05  {"type":"pong"}              │   │
│  └──────────────────────────────────────────────┘   │
│  [输入消息...]                          [ 发送 ]     │
└─────────────────────────────────────────────────────┘
```

### 6.3 主题适配

所有颜色使用 VS Code 主题变量：
- 背景：`var(--vscode-editor-background)`
- 前景：`var(--vscode-editor-foreground)`
- 边框：`var(--vscode-input-border)`
- 主色按钮：`var(--vscode-button-background)` / `var(--vscode-button-foreground)`
- 错误：`var(--vscode-errorForeground)`
- 成功：`var(--vscode-testing-iconPassed)`（或自定义绿色变量）
- 字体：`var(--vscode-font-family)` / `var(--vscode-font-size)`

Webview HTML 使用 `Content-Security-Policy` meta 禁止内联脚本（除 `style-src 'unsafe-inline'`）。

---

## 7. 错误处理

| 场景 | 行为 |
| :--- | :--- |
| URL 非法 | Webview 端校验：协议必须为 http/https/ws/wss；格式用 `URL` 构造器验证 |
| HTTP 网络错误 | Extension 捕获 `ECONNREFUSED` 等错误，返回 `{ error: 'message' }` 给 Webview，响应区显示错误 |
| HTTP 超时 | 客户端设默认 30s 超时（`req.setTimeout`），超时后取消并返回错误 |
| WebSocket 连接失败 | `error` 事件 → Webview 显示错误信息和原因 |
| WebSocket 断连 | `close` 事件 → 状态更新为"已断开"，UI 上的 Connect 按钮可点击 |
| 响应体非 UTF-8 | Extension 端用 `Buffer.toString('utf8')` 转换，标记 `isBinary: true` 时 Webview 显示十六进制预览 |
| globalState 读取失败 | 捕获异常，返回空数组 |
| JSON 解析失败 | Body 面板显示错误，原始内容保留在文本编辑器 |

---

## 8. 测试

### 8.1 单元测试

| 模块 | 测试覆盖 |
| :--- | :--- |
| `HttpService` | 正常请求（mock `http.request`）、错误处理、超时 |
| `HistoryService` | 追加、截断、上限边界 |
| `CollectionService` | 增删改查、id 唯一性 |
| `format.ts` | JSON 格式化、字节体积计算、耗时计算 |

### 8.2 手动测试清单（沿用 PRD §6）

- [ ] 5 种 HTTP 方法
- [ ] 2xx/4xx/5xx 状态码显示
- [ ] JSON 自动格式化
- [ ] Headers / Body 修改生效
- [ ] 历史保存和加载
- [ ] ws/wss 连接
- [ ] 错误提示
- [ ] 主题切换

---

## 9. 实施阶段

按 PRD §5 的 Phase 顺序，每阶段产出可验证产物：

| Phase | 内容 | 验证 |
| :--- | :--- | :--- |
| 1 | 项目初始化（package.json、tsconfig、Hello Webview） | 插件加载、侧边栏图标可见、点击显示 "Hello" |
| 2 | HTTP 核心 | 能用 GET 拉取一个公开 API，看到状态码和 body |
| 3 | WebSocket 核心 | 能连上 `wss://echo.websocket.org`，发送并接收回显 |
| 4 | UI / 主题 / 快捷键 / 右键菜单 | 暗色主题清晰、Ctrl+Enter 发送、右键复制响应 |
| 5 | 历史 + 收藏 | 关闭再打开插件，历史仍在；收藏可保存/加载/删除 |
| 6 | 单元测试 + 打包 | `npm test` 通过、`vsce package` 生成 `.vsix` |

每个 Phase 结束时人工 `F5` 启动 Extension Development Host 验证。

---

## 10. 风险与权衡

| 风险 | 缓解 |
| :--- | :--- |
| 侧边栏宽度有限，复杂布局难以阅读 | UI 使用纵向滚动；Method 下拉独立行；引导用户把视图拖到辅助栏（右侧）以获得更宽空间 |
| WebSocket 长时间连接导致内存累积 | WsService 内部消息队列上限 500 条，超出后丢弃最早 100 条 |
| 敏感 Token 写入 globalState | MVP 阶段接受此风险（PRD §4.4）；v2.0 考虑加密 |
| `ws` 库和 `vscode` 引擎的 Node 版本兼容 | `ws@8.x` 兼容 Node 16+；package.json `engines.vscode: ^1.74.0` |
| Webview 内 fetch 受 CSP 限制 | 业务请求全部走 Extension Host，Webview 不发网络请求 |

---

## 11. 后续步骤

进入 `writing-plans` 阶段，把本设计文档拆解为可执行的实现计划（含每个 Phase 的具体任务、文件路径、代码骨架、验收点）。