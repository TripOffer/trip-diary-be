#!/bin/sh
set -e

# 等待数据库启动
until nc -z -v -w30 db 5432; do
  echo "Waiting for database connection..."
  sleep 1
done

# 运行 Prisma 数据库迁移
pnpm prisma migrate deploy

# 启动主服务
exec pnpm start:prod
