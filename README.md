# AGILink - 跨应用智能记忆中心

构建一个本地优先、平台无关的个人记忆中枢。

**核心理念：记忆属于人，而不属于任何 AI 工具。**

任何来源的上下文都可以流入 AGILink，沉淀整理后按需注入到任意 AI 工具。导入源和导出目标均为可扩展的适配器插件，系统核心不感知任何具体平台。

## 快速开始

### 前置依赖

- Node.js 20+
- pnpm 9+
- 零克云 API Key（登录 https://gpulink.cc 注册申请）

### 安装

```bash
# 克隆仓库
git clone <repo-url> agilink && cd agilink

# 安装依赖
pnpm install

# 构建所有包
pnpm build
```

### 配置 API Key

在管理界面的「设置」页面中输入零克云 API Key，或手动编辑 `~/.agilink/config.json`。

### 启动服务

```bash
# 启动 API + Web 管理界面
pnpm --filter @agilink/cli dev -- serve

# 或者构建后运行
node packages/cli/dist/index.js serve
```

访问 http://localhost:43210 打开管理界面。

## 项目结构

```
agilink/
├── packages/
│   ├── core/           # 记忆引擎 + 适配器接口定义
│   ├── api/            # 本地 REST API 服务 (Fastify)
│   ├── web/            # 管理界面 (React + Vite + Tailwind)
│   └── cli/            # 命令行工具 (Commander.js)
├── adapters/
│   ├── in/             # 内置导入适配器
│   │   ├── plain-text/
│   │   ├── markdown-file/
│   │   ├── chatgpt-json/
│   │   ├── claude-json/
│   │   └── json-generic/
│   └── out/            # 内置导出适配器
│       ├── system-prompt/
│       ├── context-snippet/
│       ├── markdown-file/
│       └── json-export/
└── data/
```

## CLI 使用

```bash
agilink serve                                        # 启动 API + Web 界面
agilink adapters list                                # 列出所有适配器

agilink import --adapter plain-text                  # 交互式粘贴模式
agilink import --adapter chatgpt-json ./export.json  # 文件导入
agilink import --adapter markdown-file ./notes.md

agilink export --adapter system-prompt --query "React 项目开发"
agilink export --adapter json-export --output ./backup.json

agilink search "职业偏好"
agilink deduplicate
agilink stats
```

## API 端点

API 默认监听 `localhost:43210`：

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /health | 健康检查 |
| GET | /adapters/in | 列出导入适配器 |
| GET | /adapters/out | 列出导出适配器 |
| POST | /import | 导入数据 |
| GET | /memories | 查询记忆 |
| POST | /memories | 手动新增 |
| PUT | /memories/:id | 更新记忆 |
| DELETE | /memories/:id | 删除记忆 |
| POST | /memories/search | 语义搜索 |
| POST | /memories/deduplicate | 去重整理 |
| POST | /export | 导出记忆 |
| GET | /profile | 获取个人档案 |
| PUT | /profile/:key | 更新档案 |
| GET | /stats | 统计信息 |
| GET | /settings | 获取设置 |
| PUT | /settings | 更新设置 |
| POST | /generate/image | 图像生成 (Seedream) |
| POST | /generate/video | 视频生成任务提交 (Seedance) |
| GET | /generate/video/:taskId | 查询视频任务状态 |

## 自定义适配器

在 `~/.agilink/adapters/` 放置自定义适配器文件，AGILink 启动时自动扫描加载：

```javascript
// ~/.agilink/adapters/my-adapter.mjs
export default {
  id: "my-source",
  name: "我的自定义来源",
  description: "自定义导入适配器",
  accepts: { fileExtensions: [".txt"], text: true },
  async parse(input) {
    const text = typeof input.content === "string"
      ? input.content
      : input.content.toString("utf-8")
    return [{ content: text }]
  }
}
```

## 配置

配置文件位于 `~/.agilink/config.json`：

```json
{
  "gpulink": {
    "apiKey": "你的零克云 API Key",
    "baseUrl": "https://gpulink.cc/v1"
  },
  "llm": { "model": "kimi-k2.5" },
  "embedding": { "model": "text-embedding-3-small" },
  "imageGen": { "model": "doubao-seedream-4-5-251128" },
  "videoGen": { "model": "doubao-seedance-1-5-pro-251215" },
  "api": { "port": 43210 },
  "dedup": { "threshold": 0.92 }
}
```

**获取 API Key**: 登录零克云 https://gpulink.cc，注册申请即可。也可在管理界面的「设置」页面中配置。

## Docker

```bash
docker-compose up -d
```

## 技术栈

- **Runtime**: Node.js 20+ (TypeScript)
- **API**: Fastify
- **数据库**: SQLite (better-sqlite3)
- **AI 服务**: 零克云 API（语言: kimi-k2.5 / 图像: Seedream / 视频: Seedance）
- **前端**: React + Vite + Tailwind CSS
- **CLI**: Commander.js
- **包管理**: pnpm workspaces (monorepo)

## 隐私

- 所有数据存储在本地 `~/.agilink/`
- API 仅监听 localhost
- 随时可通过 json-export 适配器完整导出迁移

## License

MIT
