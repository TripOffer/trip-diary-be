# 埋点文档导航

- [日记 Diary 埋点](./diary.md)
- [评论 Comment 埋点](./comment.md)
- [用户 User 埋点](./user.md)
- [标签 Tag 埋点](./tag.md)

---

## TrackStats 埋点类型规范

| 埋点类型 type  | 说明                     |
| -------------- | ------------------------ |
| user_register  | 用户注册数（可每日累计） |
| user_active    | 活跃用户数（每日/周/月） |
| diary_create   | 新增日记数               |
| diary_view     | 日记浏览量               |
| diary_like     | 日记点赞量               |
| diary_favorite | 日记收藏量               |
| diary_share    | 日记分享量               |
| diary_comment  | 日记评论数               |
| diary_approved | 审核通过日记数           |
| diary_rejected | 审核拒绝日记数           |
| diary_pending  | 待审核日记数（快照）     |
| comment_create | 新增评论数               |
| comment_like   | 评论点赞量               |
| comment_reply  | 评论回复数               |
| tag_create     | 新增标签数               |
| tag_view       | 标签浏览量               |

> 说明：所有 type 均建议以“对象\_行为”命名，统计表 date 字段为分片日期，value 为当日累计值。

### 统计举例

- 用户注册折线图：type=user_register，period=day/week/month
- 日记浏览量趋势：type=diary_view，period=day/week/month
- 评论新增量：type=comment_create，period=day/week/month
- 标签浏览量：type=tag_view，period=day/week/month

---

## 统计聚合原理

- day：直接查 TrackStats 表，type+date 匹配，返回每天的 value
- week：查出所有天的数据，按每周分组累加，返回每周的总和（以周一为起始）
- month：查出所有天的数据，按每月分组累加，返回每月的总和

这样可以灵活支持任意时间区间、任意粒度的趋势统计和可视化。

---

如需扩展更多埋点类型，请补充本表。
