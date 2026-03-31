FROM node:20-slim AS builder

# 安装 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# 安装构建依赖（better-sqlite3 需要）
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 先复制依赖描述文件，利用 Docker 缓存
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY packages/core/package.json packages/core/
COPY packages/api/package.json packages/api/
COPY packages/web/package.json packages/web/
COPY packages/cli/package.json packages/cli/
COPY adapters/in/plain-text/package.json adapters/in/plain-text/
COPY adapters/in/markdown-file/package.json adapters/in/markdown-file/
COPY adapters/in/chatgpt-json/package.json adapters/in/chatgpt-json/
COPY adapters/in/claude-json/package.json adapters/in/claude-json/
COPY adapters/in/json-generic/package.json adapters/in/json-generic/
COPY adapters/out/system-prompt/package.json adapters/out/system-prompt/
COPY adapters/out/context-snippet/package.json adapters/out/context-snippet/
COPY adapters/out/markdown-file/package.json adapters/out/markdown-file/
COPY adapters/out/json-export/package.json adapters/out/json-export/

RUN pnpm install --frozen-lockfile

# 复制源码并构建
COPY . .
RUN pnpm build

# 运行阶段
FROM node:20-slim

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY --from=builder /app .

EXPOSE 43210

CMD ["node", "packages/cli/dist/index.js", "serve"]
