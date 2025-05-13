# Trip Diary Backend

## 项目简介

本项目为携程第四期前端训练营大作业「旅行日记」的后端服务，基于 NestJS + Prisma 实现，支持用户注册、日记发布、评论、标签、统计分析等功能，适用于旅行日记、社交内容等场景。

## 主要功能

- 用户注册、登录、找回密码、关注/粉丝
- 日记发布、浏览、点赞、收藏、评论
- 标签管理与热门标签统计
- OSS 文件上传（如图片）
- 埋点统计与趋势分析（如活跃用户、日记浏览量等）
- 管理后台统计接口

## 技术栈

- Node.js / TypeScript
- NestJS
- Prisma ORM
- PostgreSQL
- Redis
- AWS S3 兼容对象存储

## 安装与运行

1. 安装依赖

```bash
pnpm install
```

2. 生成 Prisma Client

```bash
npx prisma generate
```

3. 配置环境变量

复制 `.env.example` 为 `.env` 并根据实际情况修改配置：

```bash
cp .env.example .env
```

4. 初始化数据库（如首次运行）

```bash
npx prisma migrate dev --name init
```

5. 启动开发环境

```bash
pnpm run start:dev
```

6. 生成模拟数据（可选）

```bash
pnpm run db:seed
```

## 主要接口概览

> 接口文档：[旅行日记](https://apifox.com/apidoc/shared/3cc8c915-b9d0-46d2-b78f-92f0f2a00e48)

### 认证 Auth

- `POST /auth/login` 用户登录
- `POST /auth/register` 用户注册
- `POST /auth/send-code` 发送邮箱验证码
- `PUT /auth/password` 修改密码
- `POST /auth/reset-password` 重置密码
- `DELETE /auth` 注销账号

### 用户 User

- `GET /user/list` 用户列表（需登录）
- `GET /user/me` 当前用户信息
- `PUT /user/me` 修改个人信息
- `PUT /user/me/avatar` 修改头像
- `GET /user/:id` 获取指定用户信息
- `PUT /user/:id/follow` 关注用户
- `PUT /user/:id/unfollow` 取关用户
- `GET /user/:id/following` 关注列表
- `GET /user/:id/followers` 粉丝列表
- `GET /user/:id/diary` 用户日记列表
- `GET /user/me/diary` 我的全部日记
- `GET /user/me/favorite` 我的收藏
- `GET /user/me/like` 我的点赞

### 日记 Diary

- `POST /diary` 发布日记
- `PATCH /diary/:id` 编辑日记
- `DELETE /diary/:id` 删除日记
- `GET /diary/review-list` 日记审核列表（需审核员）
- `POST /diary/:id/review` 审核日记（需审核员）
- `PATCH /diary/:id/publish` 发布/下架日记
- `GET /diary/recommend` 推荐日记
- `GET /diary/:id/detail` 日记详情
- `POST /diary/:id/share` 分享日记

#### 日记互动

- `POST /diary/:id/like` 点赞
- `DELETE /diary/:id/like` 取消点赞
- `POST /diary/:id/favorite` 收藏
- `DELETE /diary/:id/favorite` 取消收藏

#### 评论

- `POST /diary/:id/comment` 发表评论
- `DELETE /diary/:diaryId/comment/:id` 删除评论
- `GET /diary/:id/comments` 获取评论列表

### 标签 Tag

- `GET /tag/hot` 热门标签
- `GET /tag/:id/diaries` 某标签下的日记
- `GET /tag/:id` 标签详情
- `GET /tag?name=xxx` 根据名称查标签

### 统计 Stats

- `GET /stats/summary` 趋势统计（支持多种埋点类型，详见文档）
- `GET /stats/admin` 管理后台统计（需管理员）
- `GET /stats/reviewer` 审核员统计（需审核员）

### OSS 文件

- `GET /oss/presign` 获取 OSS 上传预签名链接
- `POST /oss/confirm-upload` 确认上传

### 图片代理

- `GET /image?...` 图片代理跳转

> 更多接口细节和参数请参考 `src/` 目录下各 controller 及 DTO 文件，或查阅 docs 目录文档。

## 接口文档

- [埋点统计清单及说明](docs/track/README.md)
- [统计接口文档](docs/stats-api.md)
- 其他模块接口可参考 `src/` 目录下各 controller 及 DTO 文件

## 贡献指南

1. Fork 本仓库并新建分支
2. 提交代码前请确保通过 lint 检查
3. 提交 PR 并详细描述变更内容

## 联系方式

如有问题或建议，欢迎提 Issue 或联系维护者。

---

> 本项目为比赛/学习用途，欢迎交流与贡献。
