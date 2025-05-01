# Trip Diary Backend

## 如何开发

```bash
pnpm install
```

```bash
pnpm run start:dev
```

## 如何初始化

复制 `.env.example` 到 `.env` 并修改配置

```bash
cp .env.example .env
```

```bash
npx prisma migrate dev --name init
```

## 其他

### 生成模拟数据

```bash
pnpm run db:seed
```
