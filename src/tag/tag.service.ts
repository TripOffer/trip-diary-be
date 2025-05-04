import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TagService {
  constructor(private prisma: PrismaService) {}

  /**
   * 根据标签名数组查找已存在的标签，并为不存在的标签创建新标签，返回所有标签的id对象数组
   */
  async findOrCreateTagsByName(names: string[]): Promise<{ id: string }[]> {
    if (!names || names.length === 0) return [];
    // 查询已存在的标签
    const existedTags = await this.prisma.tag.findMany({
      where: { name: { in: names } },
    });
    const existedTagNames = existedTags.map((t) => t.name);
    const existedTagIds = existedTags.map((t) => ({ id: t.id }));
    // 新建不存在的标签
    const newTagNames = names.filter((name) => !existedTagNames.includes(name));
    const newTags = await Promise.all(
      newTagNames.map((name) => this.prisma.tag.create({ data: { name } })),
    );
    const newTagIds = newTags.map((t) => ({ id: t.id }));
    return [...existedTagIds, ...newTagIds];
  }
}
