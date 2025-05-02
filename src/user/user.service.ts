import { Injectable } from '@nestjs/common';
import { CreateUserInput } from './dto/create-user.input';
import { PrismaService } from 'src/prisma/prisma.service';
import { hash } from 'argon2';

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

  async updateBasicInfo(
    id: number,
    data: Partial<{
      name: string;
      bio: string;
      gender: string;
    }>,
  ) {
    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        bio: true,
        gender: true,
      },
    });
  }
}
