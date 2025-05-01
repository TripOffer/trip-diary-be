import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { verify } from 'argon2';
import { PrismaService } from 'src/prisma/prisma.service';
import { User } from 'src/user/entities/user.entity';
import { LoginInput } from './dto/login.input';
import { AuthJwtPayload } from './types/auth-jwtPayload';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}
  async validateLocalUser({ email, password }: LoginInput) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('用户不存在');

    const isPasswordMatched = await verify(user.password, password);

    if (!isPasswordMatched) throw new UnauthorizedException('邮箱或密码错误');

    return user;
  }

  async generateToken(userId: number) {
    const payload: AuthJwtPayload = { sub: userId };
    const accessToken = await this.jwtService.signAsync(payload);
    return accessToken;
  }

  async login(user: User) {
    const accessToken = await this.generateToken(user.id);
    return {
      token: accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
    };
  }
}
