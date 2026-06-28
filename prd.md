# VS Code 插件 —— API & WebSocket Tester

## 产品需求文档（PRD）

| 文档版本 | 日期 | 作者 | 状态 |
| :--- | :--- | :--- | :--- |
| v1.0 | 2026-06-28 | AI 辅助生成 | 待评审 |

---

## 一、产品概述

### 1.1 产品名称
**VSCode API & WebSocket Tester**

### 1.2 一句话定位
一款 VS Code 插件，让开发者在编辑器内同时完成 **HTTP API** 和 **WebSocket** 接口的测试与调试，无需切换 Postman 等外部工具。

### 1.3 目标用户
- 后端开发工程师
- 全栈开发工程师
- API 接口测试人员
- 微服务开发者

### 1.4 用户痛点
| 痛点 | 说明 |
| :--- | :--- |
| 工具切换频繁 | 在 VS Code 写代码，切到 Postman/Insomnia 测接口，来回切换打断心流 |
| WebSocket 测试不方便 | 很多工具对 WebSocket 支持弱，命令行 `websocat` 不够直观 |
| 请求无法和代码关联 | 测试用例与项目代码分离，难以版本管理和复用 |
| 环境配置重复 | 不同环境（dev/staging/prod）的 URL 和 Token 需要重复填写 |

### 1.5 核心价值
> **在编码环境中完成全部接口验证，提升开发效率 30%+**

---

## 二、功能范围

### 2.1 MVP 版本（v1.0）—— 必须实现

#### 功能模块一：HTTP API 测试
| 功能点 | 优先级 | 说明 |
| :--- | :--- | :--- |
| 支持 GET / POST / PUT / DELETE / PATCH | P0 | 最常用的 5 种方法 |
| URL 输入框 | P0 | 支持输入完整 URL，带自动补全提示 |
| Headers 管理 | P0 | 支持添加、删除、编辑请求头（Key-Value） |
| Body 编辑 | P0 | 支持 JSON / Text / Form 三种格式 |
| 响应展示 | P0 | 展示状态码、响应头、响应体（JSON 自动格式化高亮） |
| 请求历史 | P1 | 自动保存最近 50 条请求记录，可点击重新发送 |
| 请求收藏/集合 | P2 | 将常用请求保存到集合中，方便复用 |

#### 功能模块二：WebSocket 测试
| 功能点 | 优先级 | 说明 |
| :--- | :--- | :--- |
| 连接管理 | P0 | 输入 ws/wss URL，点击连接/断开 |
| 连接状态指示 | P0 | 显示连接状态（已连接/已断开/连接中/错误） |
| 发送消息 | P0 | 支持发送文本消息，支持 JSON 格式校验 |
| 接收消息 | P0 | 实时展示接收到的消息，按时间戳排列 |
| 消息日志 | P0 | 区分发送和接收的消息（不同颜色/标签） |
| 二进制消息支持 | P2 | 支持发送/接收 ArrayBuffer 或 Blob（用于语音流场景） |
| 消息模板 | P2 | 保存常用消息模板，一键发送 |

#### 功能模块三：界面与交互
| 功能点 | 优先级 | 说明 |
| :--- | :--- | :--- |
| 协议切换 Tab | P0 | 在 HTTP 和 WebSocket 两种模式间切换 |
| 侧边栏视图 | P0 | 在 VS Code 左侧活动栏增加插件图标，点击展开侧边栏 |
| 响应时间显示 | P1 | 显示请求耗时（ms） |
| 响应体积显示 | P2 | 显示响应体大小（KB） |
| 暗色/亮色主题适配 | P1 | 跟随 VS Code 主题自动切换 |
| 键盘快捷键 | P2 | Ctrl+Enter 发送请求，Ctrl+Shift+W 打开插件 |

---

### 2.2 后续版本规划（v2.0+）
| 功能 | 说明 |
| :--- | :--- |
| GraphQL 支持 | 支持 GraphQL 查询和变量 |
| 环境变量管理 | 支持 dev/staging/prod 环境切换，变量替换 |
| 从代码导入请求 | 从 `.http` / `.rest` 文件导入请求 |
| 导出请求 | 导出为 curl 命令或 Postman Collection |
| 请求链/流程测试 | 支持多个请求串行执行，上下文变量传递 |

---

## 三、用户体验与交互设计

### 3.1 布局结构

```
┌──────────────────────────────────────────────────────┐
│ 🔌 API & WebSocket Tester                      [⚙️]  │  ← 标题栏
├──────────────────────────────────────────────────────┤
│  [HTTP]  [WebSocket]                                │  ← 协议切换 Tab
├──────────────────────────────────────────────────────┤
│  Method ▼  [___________________________URL________] │  ← 请求行
│  [Send]  [Save]                                     │  ← 操作按钮
├──────────────────────────────────────────────────────┤
│  Headers  │  Body  │  Auth                          │  ← 子 Tab
│  ┌────────────────────────────────────────────┐     │
│  │  Content-Type: application/json            │     │
│  │  Authorization: Bearer xxx                 │     │
│  │  [+ Add Header]                           │     │
│  └────────────────────────────────────────────┘     │
├──────────────────────────────────────────────────────┤
│  ↓ Response                    Status: 200 OK       │
│  ┌────────────────────────────────────────────┐     │
│  │  {                                         │     │
│  │    "code": 0,                             │     │
│  │    "data": { ... }                        │     │
│  │  }                                         │     │
│  └────────────────────────────────────────────┘     │
│  Time: 156ms  |  Size: 2.3KB                       │
└──────────────────────────────────────────────────────┘
```

### 3.2 WebSocket 模式布局

```
┌──────────────────────────────────────────────────────┐
│  [HTTP]  [WebSocket]                                │
├──────────────────────────────────────────────────────┤
│  ws://localhost:8000/ws  [Connect] [Disconnect]     │
│  状态: ● 已连接                                     │
├──────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────┐     │
│  │  [→] 2026-06-28 10:00:01  Hello Server    │     │  ← 发送消息（蓝色）
│  │  [←] 2026-06-28 10:00:02  服务端收到      │     │  ← 接收消息（绿色）
│  │  [→] 2026-06-28 10:00:05  {"type":"ping"} │     │
│  │  [←] 2026-06-28 10:00:05  {"type":"pong"} │     │
│  └────────────────────────────────────────────┘     │
│  [输入消息...]                           [发送]      │
└──────────────────────────────────────────────────────┘
```

### 3.3 交互细节
| 场景 | 交互行为 |
| :--- | :--- |
| URL 输入 | 支持 `http://` / `https://` / `ws://` / `wss://` 自动识别，切换 Tab 时自动切换协议前缀 |
| 发送请求 | 点击 Send 按钮或按 `Ctrl+Enter` |
| 响应 JSON | 自动检测 Content-Type，使用 VS Code 内置 JSON 格式化高亮 |
| WebSocket 连接 | 点击 Connect 建立连接，Disconnect 断开；连接失败时显示错误原因 |
| 消息日志 | 上限 500 条，超出后自动清除最早的 100 条 |
| 复制功能 | 右键点击响应体或消息，可复制内容 |

---

## 四、技术要求与约束

### 4.1 技术栈
| 模块 | 技术选型 | 说明 |
| :--- | :--- | :--- |
| 插件核心 | TypeScript + VS Code Extension API | 官方推荐 |
| HTTP 请求 | Node.js `https` / `http` 模块 或 `axios` | 原生模块更轻量 |
| WebSocket 客户端 | `ws` 或 `@fastify/websocket` | `ws` 库最流行 |
| UI 渲染 | VS Code Webview API | 使用 HTML/CSS/JS 构建界面 |
| 状态管理 | 插件全局状态 `context.globalState` | 保存历史记录和收藏 |

### 4.2 兼容性要求
| 项目 | 要求 |
| :--- | :--- |
| VS Code 版本 | >= 1.74.0 |
| Node.js 版本 | >= 16.x |
| 操作系统 | Windows / macOS / Linux 全平台支持 |
| 网络协议 | HTTP/1.1, HTTP/2, WebSocket (RFC 6455) |

### 4.3 性能指标
| 指标 | 目标值 |
| :--- | :--- |
| 插件激活时间 | < 200ms |
| HTTP 请求额外开销 | < 10ms |
| WebSocket 消息延迟 | < 5ms（不含网络） |
| 内存占用 | < 50MB（空闲时） |
| 消息日志渲染 | 500 条消息时滚动流畅 |

### 4.4 安全与隐私
| 要求 | 说明 |
| :--- | :--- |
| 本地运行 | 所有请求从本地发出，不经过任何第三方服务器 |
| 敏感信息 | 不在插件状态中明文存储密码/Token（v2.0 考虑加密存储） |
| 无数据收集 | 不收集任何用户使用数据 |

---

## 五、开发任务拆解（供 AI 参考）

建议按以下顺序开发，每个阶段可独立验证：

### Phase 1: 项目初始化
- [ ] 使用 `yo code` 生成 VS Code 插件项目模板
- [ ] 配置 TypeScript、ESLint、Prettier
- [ ] 定义 `package.json` 中的 `activationEvents`、`contributes`（命令、视图容器）
- [ ] 创建基本的 Webview Panel，显示 "Hello World"

### Phase 2: HTTP 核心功能
- [ ] 实现 HTTP 请求发送（支持 GET/POST/PUT/DELETE/PATCH）
- [ ] 实现请求头（Headers）的增删改
- [ ] 实现 Body 编辑（JSON / Text / Form）
- [ ] 实现响应展示（状态码、响应头、响应体）
- [ ] 实现 JSON 自动格式化高亮

### Phase 3: WebSocket 核心功能
- [ ] 集成 `ws` 库，实现 WebSocket 连接管理
- [ ] 实现连接/断开按钮及状态指示
- [ ] 实现文本消息的发送和接收
- [ ] 实现消息日志列表（区分发送/接收）
- [ ] 支持 JSON 消息语法校验

### Phase 4: UI 完善与交互优化
- [ ] 实现 HTTP / WebSocket Tab 切换
- [ ] 适配 VS Code 暗色/亮色主题
- [ ] 实现快捷键 `Ctrl+Enter` 发送
- [ ] 实现复制响应/消息的右键菜单
- [ ] 显示请求耗时和响应体积

### Phase 5: 数据持久化
- [ ] 使用 `context.globalState` 保存请求历史（最近 50 条）
- [ ] 历史记录列表展示，点击可重新加载
- [ ] 保存收藏请求到集合

### Phase 6: 测试与发布
- [ ] 编写基础单元测试
- [ ] 手动测试跨平台兼容性
- [ ] 打包 `.vsix` 文件
- [ ] 发布到 VS Code Marketplace

---

## 六、验收标准

### 6.1 HTTP 功能验收
- [ ] 能正确发送 5 种 HTTP 方法的请求
- [ ] 能正确显示 2xx/4xx/5xx 状态码
- [ ] 响应 JSON 能自动格式化，非 JSON 按原文显示
- [ ] 请求头和 Body 修改后能正确生效
- [ ] 请求历史能正常保存和加载

### 6.2 WebSocket 功能验收
- [ ] 能成功连接到 `ws://` 和 `wss://` 服务
- [ ] 连接失败时有明确的错误提示
- [ ] 发送的消息能在消息列表中显示
- [ ] 接收的消息能实时更新到消息列表
- [ ] 断开连接后状态正确变化

### 6.3 整体体验验收
- [ ] 插件激活不影响 VS Code 启动速度
- [ ] 所有交互响应流畅，无卡顿
- [ ] 暗色/亮色主题下界面清晰可读
- [ ] 侧边栏图标正常显示

---

## 七、附录

### 7.1 参考项目
- [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) — HTTP 测试插件
- [WebSocket Client](https://marketplace.visualstudio.com/items?itemName=mtxr.sqltools-driver-pg) — WebSocket 测试插件
- [Postman](https://www.postman.com/) — 桌面端 API 测试工具

### 7.2 技术文档
- [VS Code Extension API](https://code.visualstudio.com/api)
- [Webview API](https://code.visualstudio.com/api/extension-guides/webview)
- [ws 库文档](https://github.com/websockets/ws)

### 7.3 关键代码结构（参考）

```typescript
// extension.ts 核心结构
export function activate(context: vscode.ExtensionContext) {
    // 1. 注册侧边栏视图提供者
    const provider = new ApiTesterViewProvider(context.extensionUri, context);
    vscode.window.registerWebviewViewProvider(ApiTesterViewProvider.viewType, provider);
    
    // 2. 注册命令
    context.subscriptions.push(
        vscode.commands.registerCommand('api-tester.sendRequest', () => {...}),
        vscode.commands.registerCommand('api-tester.connectWs', () => {...}),
        vscode.commands.registerCommand('api-tester.disconnectWs', () => {...})
    );
}

// Webview 与 Extension 通信机制
// 使用 postMessage / onDidReceiveMessage 实现双向通信
```

---
