# Stats Summary 接口文档

## 接口说明

GET `/stats/summary`

用于获取任意埋点类型（TrackStats）在指定时间区间、指定分片周期（日/周/月）的统计趋势数据，适用于大屏、折线图等可视化。

---

## 请求参数

| 参数   | 类型   | 必填 | 说明                                                              |
| ------ | ------ | ---- | ----------------------------------------------------------------- |
| type   | string | 是   | 埋点类型（如 diary_view、user_register 等，详见 track/README.md） |
| period | string | 否   | 分片周期，day/week/month，默认 day                                |
| start  | string | 是   | 起始日期（ISO 格式，如 2025-05-01）                               |
| end    | string | 是   | 结束日期（ISO 格式，如 2025-05-08）                               |

---

## period 参数说明

- day：按天统计，返回每天的 value
- week：按周统计，返回每周的 value（以周一为起始）
- month：按月统计，返回每月的 value

---

## 聚合原理

- day：直接查 TrackStats 表，type+date 匹配，返回每天的 value
- week：查出所有天的数据，按每周分组累加，返回每周的总和
- month：查出所有天的数据，按每月分组累加，返回每月的总和

---

## 示例

请求：

```
GET /stats/summary?type=diary_view&period=day&start=2025-05-01&end=2025-05-08
```

返回：

```
[
  { "label": "2025-05-01", "value": 12 },
  { "label": "2025-05-02", "value": 18 },
  ...
]
```

---

## 支持的 type 列表

详见 [docs/track/README.md](./track/README.md)

---

## 管理后台统计字段说明（getAdminStats / getReviewerStats 返回结构）

### user（用户相关统计，仅 getAdminStats 返回）

- `total`：用户总数
- `today`：今日新增用户数
- `active7d`：近7天活跃用户数（有登录、发帖、评论、浏览行为的用户）

### diary（日记相关统计）

- `total`：日记总数
- `today`：今日新增日记数
- `pending`：待审核日记数
- `approved`：已通过审核日记数
- `rejected`：审核未通过日记数
- `viewTotal`：日记总浏览量
- `likeTotal`：日记总点赞数
- `favoriteTotal`：日记总收藏数
- `shareTotal`：日记总分享数

### comment（评论相关统计）

- `total`：评论总数
- `today`：今日新增评论数
- `likeTotal`：评论总点赞数
- `replyTotal`：评论总回复数

### tag（标签相关统计）

- `total`：标签总数
- `viewTotal`：标签总浏览量

### audit（审核相关统计，与日记审核状态一致）

- `pending`：待审核日记数
- `approved`：已通过审核日记数
- `rejected`：审核未通过日记数
