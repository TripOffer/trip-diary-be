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

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(createUserInput: CreateUserInput) {
    let { password, name, ...user } = createUserInput;
    const hashedPassword = await hash(password);

    if (!name) {
      name = '旅行者' + Math.floor(Math.random() * 10000).toString();
    }

    return this.prisma.user
      .create({
        data: {
          ...user,
          name,
          password: hashedPassword,
        },
      })
      .catch((e) => {
        if (e.code === 'P2002') {
          throw new Error('用户已存在');
        }
      });
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

  async findBasicInfoById(id: number, currentUser?: { role?: string }) {
    const isAdmin = isAdminUser(currentUser);
    console.log('isAdmin', isAdmin, currentUser);
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: isAdmin ? fullInfoSelect : basicInfoSelect,
    });
    return user;
  }

  async findByIdWithSelect(id: number, select: Record<string, boolean>) {
    return this.prisma.user.findUnique({
      where: { id },
      select,
    });
  }

  async updateBasicInfo(id: number, data: Partial<UpdateUserInput>) {
    return this.prisma.user.update({
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
}
