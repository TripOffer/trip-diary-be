import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { hash, verify } from 'argon2';
import { PrismaService } from 'src/prisma/prisma.service';
import { User } from 'src/user/entities/user.entity';
import { LoginInput } from './dto/login.input';
import { AuthJwtPayload } from './types/auth-jwtPayload';
import { RegisterInput } from './dto/register.input';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../common/redis.service';
import { DeleteAccountInput } from './dto/delete-account.input';
import { UpdatePasswordInput } from './dto/update-password.input';
import { ResetPasswordInput } from './dto/reset-password.input';
import { TrackStatsService } from '../track/track-stats.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
    private trackStatsService: TrackStatsService,
  ) {}
  async validateLocalUser({ email, password }: LoginInput) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('用户不存在');

    const isPasswordMatched = await verify(user.password, password);

    if (!isPasswordMatched) throw new UnauthorizedException('邮箱或密码错误');

    return user;
  }

  async generateToken(user: User) {
    const payload: AuthJwtPayload = { sub: user.id, email: user.email };
    const accessToken = await this.jwtService.signAsync(payload);
    return accessToken;
  }

  async validateToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token);
      return payload;
    } catch (error) {
      throw new UnauthorizedException('无效的token');
    }
  }

  async validateJwtUser(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('用户不存在');
    return user;
  }

  async login(user: User) {
    const accessToken = await this.generateToken(user);
    // 统一返回 user 的结构，去除 password 字段
    const { password, ...userInfo } = user;
    return {
      token: accessToken,
      user: userInfo,
    };
  }

  async register(registerInput: RegisterInput) {
    // 校验验证码
    const valid = await this.verifyEmailCode(
      registerInput.email,
      registerInput.code,
    );
    if (!valid) throw new BadRequestException('验证码错误或已过期');
    // 校验通过后删除验证码
    await this.redisService
      .getClient()
      .del(`verify:email:${registerInput.email}`);
    // 检查邮箱是否已注册
    const exist = await this.prisma.user.findUnique({
      where: { email: registerInput.email },
    });
    if (exist) throw new BadRequestException('邮箱已被注册');
    // 处理 name 为空的情况
    let name = registerInput.name;
    if (!name) {
      name = '旅行者' + Math.floor(Math.random() * 10000).toString();
    }
    // 创建用户
    const user = await this.prisma.user.create({
      data: {
        email: registerInput.email,
        password: await hash(registerInput.password),
        name,
      },
    });
    // 埋点：用户注册
    await this.trackStatsService.incr('user_register', new Date(), 1);
    // 统一返回 user 的结构
    return this.login(user);
  }

  /**
   * 发送邮箱验证码
   */
  async sendVerificationCode(email: string) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    // 有效期5分钟
    const EXPIRE_SECONDS = 5 * 60;
    // 存储到redis
    await this.redisService
      .getClient()
      .setex(`verify:email:${email}`, EXPIRE_SECONDS, code);

    // 配置邮件发送
    const transporter = nodemailer.createTransport({
      service: 'qq',
      auth: {
        user: this.configService.get('MAIL_USER'),
        pass: this.configService.get('MAIL_PASS'),
      },
    });

    await transporter.sendMail({
      from: `TripDiary <${this.configService.get('MAIL_USER')}>`,
      to: email,
      subject: 'TripDiary 注册验证码',
      text: `您的验证码是：${code}，有效期5分钟。请勿泄露。`,
    });
    return true;
  }

  // 校验邮箱验证码
  async verifyEmailCode(email: string, code: string): Promise<boolean> {
    const redisCode = await this.redisService
      .getClient()
      .get(`verify:email:${email}`);
    return redisCode === code;
  }

  async deleteAccount(user: User, input: DeleteAccountInput) {
    if (!user) throw new BadRequestException('用户不存在');

    // 校验验证码
    const valid = await this.verifyEmailCode(user.email, input.code);
    if (!valid) throw new BadRequestException('验证码错误或已过期');
    // 校验通过后删除验证码
    await this.redisService.getClient().del(`verify:email:${user.email}`);

    // 校验密码
    const isPasswordMatched = await require('argon2').verify(
      user.password,
      input.password,
    );
    if (!isPasswordMatched) throw new UnauthorizedException('密码错误');

    // 删除用户
    await this.prisma.user.delete({ where: { id: user.id } });
    return true;
  }

  async updatePassword(user: User, input: UpdatePasswordInput) {
    if (!user) throw new BadRequestException('用户不存在');

    // 校验旧密码
    const isPasswordMatched = await require('argon2').verify(
      user.password,
      input.oldPassword,
    );
    if (!isPasswordMatched) throw new BadRequestException('旧密码错误');

    // 更新新密码
    const newHashedPassword = await require('argon2').hash(input.newPassword);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: newHashedPassword },
    });
    return true;
  }

  async resetPassword(input: ResetPasswordInput) {
    // 校验验证码
    const redisCode = await this.redisService
      .getClient()
      .get(`verify:email:${input.email}`);
    if (!redisCode || redisCode !== input.code) {
      throw new BadRequestException('验证码错误或已过期');
    }
    // 校验通过后删除验证码
    await this.redisService.getClient().del(`verify:email:${input.email}`);

    // 查找用户
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
    });
    if (!user) throw new BadRequestException('用户不存在');

    // 更新新密码
    const newHashedPassword = await require('argon2').hash(input.newPassword);
    await this.prisma.user.update({
      where: { email: input.email },
      data: { password: newHashedPassword },
    });
    return true;
  }
}
