# 基于官方 Node 镜像
FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY package.json pnpm-lock.yaml ./

# 安装 pnpm
RUN npm install -g pnpm

# 安装依赖
RUN pnpm install --frozen-lockfile

# 先复制 prisma 目录，生成 Prisma Client
COPY prisma ./prisma
RUN pnpm prisma generate

# 再复制其它项目文件
COPY . .

# 复制 entrypoint 脚本
COPY docker-entrypoint.sh ./

# 构建项目
RUN pnpm run build

# 暴露端口（根据实际服务端口调整）
EXPOSE 3000

# 启动服务
CMD ["pnpm", "start:prod"]
