# 日记 Diary 埋点

- [x] **详情页浏览量 viewCount**

  - 字段：`Diary.viewCount`
  - 触发接口：GET `/diary/:id/detail`
  - 埋点方式：任何用户访问详情时，`viewCount` 自增 1
  - 注意事项：无论是否作者本人都计数，且会同步给所有关联标签的 viewCount +1

- [x] **浏览历史 ViewHistory**

  - 表：`ViewHistory`
  - 字段：`userId`, `diaryId`, `viewedAt`
  - 触发接口：GET `/diary/:id/detail`
  - 埋点方式：已登录用户访问详情时，每天只保留一条最新记录（如有则更新 viewedAt，否则插入新记录）
  - 注意事项：不排除作者本人，统计以最新的 viewedAt 为准

- [x] **点赞 likeCount**

  - 字段：`Diary.likeCount`
  - 触发接口：POST `/diary/:id/like`，DELETE `/diary/:id/like`
  - 埋点方式：点赞时 +1，取消点赞时 -1
  - 注意事项：需维护 Like 关联表，防止重复点赞

- [x] **收藏 favoriteCount**

  - 字段：`Diary.favoriteCount`
  - 触发接口：POST `/diary/:id/favorite`，DELETE `/diary/:id/favorite`
  - 埋点方式：收藏时 +1，取消收藏时 -1
  - 注意事项：需维护 Favorite 关联表，防止重复收藏

- [x] **评论 commentCount**

  - 字段：`Diary.commentCount`
  - 触发接口：POST `/diary/:id/comment`，DELETE `/diary/:diaryId/comment/:id`
  - 埋点方式：评论时 +1，删除评论时 -1
  - 注意事项：所有评论都计数，无需区分是否为顶级评论

- [ ] **分享 shareCount**
  - 字段：`Diary.shareCount`
  - 触发接口：POST `/diary/:id/share`
  - 埋点方式：每次分享 +1
  - 注意事项：已实现接口
