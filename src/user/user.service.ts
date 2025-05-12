import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateUserInput } from './dto/create-user.input';
import { PrismaService } from 'src/prisma/prisma.service';
import { hash } from 'argon2';
import { UpdateUserInput } from './dto/update-user.input';
import { ChangeUserRoleInput } from './dto/change-user-role.input';
import { GetUserListQueryDto } from './dto/get-user-list-query.dto';
import { isAdminUser } from '../common/is-admin-user.util';
import { basicInfoSelect, fullInfoSelect } from './common/info-select';
import { diarySelect } from 'src/diary/common/diary.select';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(createUserInput: CreateUserInput) {
    let { password, name, ...user } = createUserInput;
    const hashedPassword = await hash(password);

    // 如果没有传 name，先用临时名注册，注册后再用 id 更新 name
    let userName = name;
    let createdUser;
    if (!userName) {
      // 用时间戳临时名，避免 unique 冲突
      userName = '旅行者' + Date.now();
      createdUser = await this.prisma.user
        .create({
          data: {
            ...user,
            name: userName,
            password: hashedPassword,
          },
          select: { id: true },
        })
        .catch((e) => {
          if (e.code === 'P2002') {
            throw new Error('用户已存在');
          }
          throw e;
        });
      // 用 id 更新 name
      const finalName = '旅行者' + createdUser.id;
      return this.prisma.user.update({
        where: { id: createdUser.id },
        data: { name: finalName },
        select: fullInfoSelect,
      });
    } else {
      return this.prisma.user
        .create({
          data: {
            ...user,
            name: userName,
            password: hashedPassword,
          },
          select: fullInfoSelect,
        })
        .catch((e) => {
          if (e.code === 'P2002') {
            throw new Error('用户已存在');
          }
          throw e;
        });
    }
  }

  async getUserRoleById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        role: true,
      },
    });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }

  async findBasicInfoById(
    id: number,
    currentUser?: { id?: number; role?: string },
  ) {
    // 只有自己能看到自己的完整信息
    const isSelf = currentUser && currentUser.id === id;
    const isAdmin = isAdminUser(currentUser);
    const select = isSelf || isAdmin ? fullInfoSelect : basicInfoSelect;
    const user = await this.prisma.user.findUnique({
      where: { id },
      select,
    });
    if (!user) return null;
    // 查询关注数和粉丝数
    const [followingCount, followersCount] = await this.prisma.$transaction([
      this.prisma.userFollow.count({ where: { followerId: id } }),
      this.prisma.userFollow.count({ where: { followingId: id } }),
    ]);
    return {
      ...user,
      followingCount,
      followersCount,
    };
  }

  async findByIdWithSelect(id: number, select: Record<string, boolean>) {
    return this.prisma.user.findUnique({
      where: { id },
      select,
    });
  }
  async updateBasicInfo(id: number, data: Partial<UpdateUserInput>) {
    try {
      return await this.prisma.user.update({
        where: { id },
        data,
        select: {
          id: true,
          name: true,
          bio: true,
          gender: true,
          birthday: true,
        },
      });
    } catch (e: any) {
      if (e.code === 'P2002' && e.meta?.target?.includes('name')) {
        throw new ForbiddenException('用户名已存在');
      }
      throw e;
    }
  }

  async updateAvatar(id: number, avatar: string) {
    // 检查 OssObject 表中是否存在该 key
    const oss = await this.prisma.ossObject.findUnique({
      where: { key: avatar },
    });
    if (!oss) {
      throw new NotFoundException('头像文件不存在');
    }
    return this.prisma.user.update({
      where: { id },
      data: { avatar },
      select: {
        id: true,
        avatar: true,
      },
    });
  }

  async changeUserRole(
    id: number,
    data: ChangeUserRoleInput,
    operator: { id: number; role: string },
  ) {
    // 禁止自己改自己
    if (id === operator.id) {
      throw new ForbiddenException('禁止修改自己的角色');
    }
    // 查询被操作用户的当前角色
    const targetUser = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, role: true },
    });
    if (!targetUser) {
      throw new NotFoundException('用户不存在');
    }
    // 只有Super能设Admin
    if (data.role === 'Admin' && operator.role !== 'Super') {
      throw new ForbiddenException('只有超级管理员可以设置 Admin 角色');
    }
    // Admin禁止修改Super和Admin
    if (
      operator.role === 'Admin' &&
      ['Admin', 'Super'].includes(targetUser.role)
    ) {
      throw new ForbiddenException('禁止 Admin 修改 Super 或 Admin 用户的角色');
    }
    // 执行角色变更
    return this.prisma.user.update({
      where: { id },
      data: { role: data.role },
      select: {
        id: true,
        name: true,
        role: true,
      },
    });
  }

  async getUserList(
    query: GetUserListQueryDto,
    currentUser?: { role?: string },
  ) {
    const { page = 1, size = 10, name, id } = query;
    let { email, role } = query;
    const where: any = {};
    if (id) where.id = id;
    if (name) where.name = { contains: name };
    const isAdmin = isAdminUser(currentUser);
    // 只有管理员才能用 email 和 role 查询
    if (isAdmin) {
      if (email) where.email = { contains: email };
      if (role) where.role = role;
    }
    const [list, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * size,
        take: size,
        orderBy: { id: 'desc' },
        select: isAdmin ? fullInfoSelect : basicInfoSelect,
      }),
      this.prisma.user.count({ where }),
    ]);
    return {
      list,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  // 关注用户
  async followUser(userId: number, targetUserId: number) {
    if (userId === targetUserId) {
      throw new ForbiddenException('不能关注自己');
    }
    // 检查目标用户是否存在
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!targetUser) {
      throw new NotFoundException('目标用户不存在');
    }
    // 检查是否已关注
    const exist = await this.prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: targetUserId,
        },
      },
    });
    if (exist) {
      throw new ForbiddenException('已关注该用户');
    }
    return this.prisma.userFollow.create({
      data: {
        followerId: userId,
        followingId: targetUserId,
      },
    });
  }

  // 取关用户
  async unfollowUser(userId: number, targetUserId: number) {
    if (userId === targetUserId) {
      throw new ForbiddenException('不能取关自己');
    }
    // 检查目标用户是否存在
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!targetUser) {
      throw new NotFoundException('目标用户不存在');
    }
    // 检查是否已关注
    const exist = await this.prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: targetUserId,
        },
      },
    });
    if (!exist) {
      throw new ForbiddenException('未关注该用户');
    }
    return this.prisma.userFollow.delete({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: targetUserId,
        },
      },
    });
  }

  // 获取关注列表
  async getFollowingList(userId: number, page = 1, size = 10) {
    const [list, total] = await this.prisma.$transaction([
      this.prisma.userFollow.findMany({
        where: { followerId: userId },
        skip: (page - 1) * size,
        take: size,
        orderBy: { createdAt: 'desc' },
        include: {
          following: { select: basicInfoSelect },
        },
      }),
      this.prisma.userFollow.count({ where: { followerId: userId } }),
    ]);
    return {
      list: list.map((item) => item.following),
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  // 获取粉丝列表
  async getFollowersList(userId: number, page = 1, size = 10) {
    const [list, total] = await this.prisma.$transaction([
      this.prisma.userFollow.findMany({
        where: { followingId: userId },
        skip: (page - 1) * size,
        take: size,
        orderBy: { createdAt: 'desc' },
        include: {
          follower: { select: basicInfoSelect },
        },
      }),
      this.prisma.userFollow.count({ where: { followingId: userId } }),
    ]);
    return {
      list: list.map((item) => item.follower),
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  async getFollowStats(userId: number) {
    const [followingCount, followersCount] = await this.prisma.$transaction([
      this.prisma.userFollow.count({ where: { followerId: userId } }),
      this.prisma.userFollow.count({ where: { followingId: userId } }),
    ]);
    return { followingCount, followersCount };
  }

  async getMyFavoriteDiaries(
    userId: number,
    query: { page?: number; size?: number },
  ) {
    const { page = 1, size = 10 } = query;
    const [list, total] = await this.prisma.$transaction([
      this.prisma.favorite.findMany({
        where: { userId },
        skip: (page - 1) * size,
        take: size,
        orderBy: { createdAt: 'desc' },
        include: {
          diary: {
            select: diarySelect,
          },
        },
      }),
      this.prisma.favorite.count({ where: { userId } }),
    ]);
    return {
      list: list.map((item) => item.diary),
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }
}
