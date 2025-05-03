import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateUserInput } from './dto/create-user.input';
import { PrismaService } from 'src/prisma/prisma.service';
import { hash } from 'argon2';
import { UpdateUserInput } from './dto/update-user.input';
import { ChangeUserRoleInput } from './dto/change-user-role.input';

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

  async findBasicInfoById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        avatar: true,
        bio: true,
        gender: true,
      },
    });
    return user;
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

  async changeUserRole(id: number, data: ChangeUserRoleInput, operator: { id: number; role: string }) {
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
    if (operator.role === 'Admin' && ['Admin', 'Super'].includes(targetUser.role)) {
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
}
