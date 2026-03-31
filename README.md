# AGILink - 跨应用智能记忆中心

构建一个本地优先、平台无关的个人记忆中枢。

**核心理念：记忆属于人，而不属于任何 AI 工具。**

任何来源的上下文都可以流入 AGILink，沉淀整理后按需注入到任意 AI 工具。导入源和导出目标均为可扩展的适配器插件，系统核心不感知任何具体平台。

## 快速开始

### 前置依赖

- Node.js 20+
- pnpm 9+
- [Ollama](https://ollama.ai/)（本地 LLM 和 Embedding 推理）

### 安装

```bash
# 克隆仓库
git clone <repo-url> agilink && cd agilink

# 安装依赖
pnpm install

# 构建所有包
pnpm build
```

### 准备 Ollama 模型

```bash
# 安装 embedding 模型
ollama pull nomic-embed-text

# 安装 LLM 模型（用于记忆提炼）
ollama pull llama3.2
```

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
  "embedding": {
    "provider": "ollama",
    "model": "nomic-embed-text",
    "ollamaBaseUrl": "http://localhost:11434"
  },
  "llm": {
    "provider": "ollama",
    "model": "llama3.2",
    "ollamaBaseUrl": "http://localhost:11434"
  },
  "api": { "port": 43210 },
  "dedup": { "threshold": 0.92 }
}
```

也支持 OpenAI 作为 embedding/LLM 后端，将 `provider` 改为 `"openai"` 并配置 `openaiApiKey`。

## Docker

```bash
docker-compose up -d
```

## 技术栈

- **Runtime**: Node.js 20+ (TypeScript)
- **API**: Fastify
- **数据库**: SQLite (better-sqlite3)
- **嵌入模型**: Ollama (本地优先) / OpenAI
- **前端**: React + Vite + Tailwind CSS
- **CLI**: Commander.js
- **包管理**: pnpm workspaces (monorepo)

## 隐私

- 所有数据存储在本地 `~/.agilink/`
- API 仅监听 localhost
- Embedding 计算优先使用本地 Ollama，原文不上传
- 随时可通过 json-export 适配器完整导出迁移

## License

MIT
