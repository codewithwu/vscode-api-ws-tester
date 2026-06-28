# Open VSX 发布指南

将本插件发布到 [Eclipse Open VSX Registry](https://open-vsx.org/) 的完整流程。

## 前置要求

- 已注册 [open-vsx.org](https://open-vsx.org/) 账号
- 已在 Open VSX 上认领自己的 namespace
- 本地已安装 Node.js 16+ 和 Git
- 已克隆本仓库并能正常执行 `npm install`

## 1. 安装 CLI 工具

```bash
npm install -g ovsx
```

验证安装：

```bash
ovsx --version
```

## 2. 获取访问令牌（Access Token）

1. 打开 https://open-vsx.org/ 并登录
2. 右上角头像 → **User settings** → **Access Tokens** 标签
3. 点击 **Generate New Token**
4. 起一个名称（例如 `vscode-api-ws-tester-publish`），选择过期时间
5. **复制 token**（只显示一次，关闭后无法再次查看）

将 token 保存到环境变量，避免每次输入：

```bash
# 临时（仅当前 shell 会话）
export OVSX_PAT="你的token"

# 永久（写入 ~/.bashrc 或 ~/.zshrc）
echo 'export OVSX_PAT="你的token"' >> ~/.bashrc
source ~/.bashrc
```

## 3. 修改 package.json 的 publisher

`package.json` 中 `"publisher"` 字段决定了扩展归属的 namespace。占位值 `"local"` 不能发布，必须改为在 Open VSX 上认领的 namespace：

- 查询已有 namespace：登录后访问 `https://open-vsx.org/user/<你的用户名>`
- 申请新 namespace：访问 https://open-vsx.org/user-settings/namespaces

修改 `package.json`：

```json
"publisher": "你的namespace"
```

> 例如 `package.json` 中的 `"publisher": "codewithwu-cn"` 表示发布到 `codewithwu-cn.vscode-api-ws-tester` namespace。

## 4. 重新打包 .vsix

publisher 改动后，原有的 `.vsix` 文件失效，必须重新打包：

```bash
npm run build      # 确保 dist/ 是最新的
npm run package    # 重新打包 vsix
# 输出：vscode-api-ws-tester-0.1.0.vsix
```

可选：补全 `package.json` 中的仓库信息（消除 vsce 警告，并让 Open VSX 页面显示源码链接）：

```json
"repository": {
  "type": "git",
  "url": "https://github.com/用户名/仓库名"
},
"bugs": {
  "url": "https://github.com/用户名/仓库名/issues"
},
"homepage": "https://github.com/用户名/仓库名#readme"
```

## 5. 发布到 Open VSX

```bash
ovsx publish vscode-api-ws-tester-0.1.0.vsix
```

CLI 会自动：

- 读取 `.vsix` 内的 `package.json`
- 使用 `OVSX_PAT` 环境变量认证
- 上传到 `<namespace>.vscode-api-ws-tester`

如果未设置环境变量，CLI 会交互式提示输入 token，也可手动指定：

```bash
ovsx publish vscode-api-ws-tester-0.1.0.vsix --pat <你的token>
```

## 6. 验证发布成功

```bash
# 列出 namespace 下的所有扩展
ovsx list-extensions <你的namespace>
```

或在浏览器访问：

```
https://open-vsx.org/extension/<你的namespace>/vscode-api-ws-tester
```

首次发布 Open VSX 会进行自动扫描（通常几秒到几分钟），状态从 `Publishing...` 变为 `Active` 后，其他用户即可在 VS Code 中搜索到此扩展。

## 7. 用户安装方式

### 方式 A：通过 Open VSX Registry

VS Code 默认使用 Microsoft Marketplace。若要搜索 Open VSX 仓库：

1. 安装 [Open VSX 插件](https://marketplace.visualstudio.com/items?itemName=open-vsx.open-vsx)（让 VS Code 在 Open VSX 上搜索）
2. 在 VS Code 扩展面板搜索扩展名即可

### 方式 B：手动安装 .vsix

```bash
code --install-extension <你的namespace>.vscode-api-ws-tester
```

### 方式 C：从 Open VSX 页面下载

访问扩展页面，点击右侧 **Download** 按钮获取 `.vsix`，再用方式 B 安装。

## 常见错误排查

| 错误信息 | 原因 | 解决方法 |
|---------|------|---------|
| `Forbidden` / 401 | token 错误或已过期 | 重新生成 token |
| `Namespace 'xxx' does not exist` | publisher 未在 Open VSX 认领 | 前往 https://open-vsx.org/user-settings/namespaces 创建 |
| `Extension name must be unique` | 同名扩展已存在 | 修改 `package.json` 中的 `name` 字段 |
| `Invalid version` | 版本号不符合 semver | 使用 `x.y.z` 格式（如 `0.1.0`） |
| `Missing repository` | vsce 校验失败 | 在 `package.json` 添加 `repository` 字段，或加 `--allow-missing-repository` 跳过 |

## 快速发布清单

```bash
# 1. 配置 token（首次需要）
npm install -g ovsx
export OVSX_PAT="你的token"

# 2. 修改 package.json
#    - "publisher" 改为你的 namespace
#    - （可选）补充 repository / bugs / homepage 字段

# 3. 打包并发布
npm run build
npm run package
ovsx publish vscode-api-ws-tester-0.1.0.vsix
```

## 后续版本更新

发布新版本时只需修改 `package.json` 中的 `version`（遵循 semver），然后重新执行：

```bash
npm run build
npm run package
ovsx publish vscode-api-ws-tester-<新版本号>.vsix
```