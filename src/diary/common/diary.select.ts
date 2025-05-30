// 只返回安全字段的 select 配置
export const diarySelect = {
  id: true,
  authorId: true,
  title: true,
  slug: true,
  thumbnail: true,
  viewCount: true,
  likeCount: true,
  favoriteCount: true,
  commentCount: true,
  shareCount: true,
  publishedAt: true,
  updatedAt: true,
  tags: { select: { id: true, name: true } },
  author: { select: { id: true, name: true, avatar: true } },
};

// 用户自己可见的 select 配置，包含部分敏感信息
export const diarySelfSelect = {
  id: true,
  authorId: true,
  parentId: true,
  title: true,
  slug: true,
  thumbnail: true,
  viewCount: true,
  likeCount: true,
  favoriteCount: true,
  commentCount: true,
  shareCount: true,
  published: true,
  publishedAt: true,
  status: true,
  rejectedReason: true,
  reviewedAt: true,
  createdAt: true,
  updatedAt: true,
  tags: { select: { id: true, name: true } },
};

// 日记详细信息 select 配置
export const diaryDetailSelect = {
  id: true,
  authorId: true,
  title: true,
  slug: true,
  content: true,
  thumbnail: true,
  images: true,
  video: true,
  viewCount: true,
  likeCount: true,
  favoriteCount: true,
  commentCount: true,
  shareCount: true,
  publishedAt: true,
  status: true,
  reviewedAt: true,
  createdAt: true,
  updatedAt: true,
  tags: { select: { id: true, name: true } },
  author: { select: { id: true, name: true, avatar: true } },
};
