import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateAuthInput } from './dto/create-auth.input';
import { UpdateAuthInput } from './dto/update-auth.input';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoginInput } from './dto/login.input';
import { verify } from 'argon2';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}
  async validateLocalUser({ email, password }: LoginInput) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('用户不存在');

    const isPasswordMatched = await verify(user.password, password);

    if (!isPasswordMatched) throw new UnauthorizedException('邮箱或密码错误');
  }
}
