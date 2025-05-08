# 评论 Comment 埋点

- [x] **评论点赞 likeCount**

  - 字段：`Comment.likeCount`
  - 触发接口：POST `/diary/:diaryId/comment/:id/like`，DELETE `/diary/:diaryId/comment/:id/like`
  - 埋点方式：点赞时 +1，取消点赞时 -1
  - 注意事项：需维护 CommentLike 关联表

- [x] **回复数 replyCount**
  - 字段：`Comment.replyCount`
  - 触发接口：POST `/diary/:id/comment`（带 parentId），DELETE `/diary/:diaryId/comment/:id`
  - 埋点方式：回复时父评论 replyCount +1，删除回复时 -1
  - 注意事项：仅 parentId 存在时计数
