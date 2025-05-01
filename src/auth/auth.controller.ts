import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginInput } from './dto/login.input';
import { AuthPayload } from './entities/auth-payload.entity';
import { RegisterInput } from './dto/register.input';
import { SendCodeInput } from './dto/send-code.input';
import { ValidationPipe } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginInput: LoginInput) {
    const user = await this.authService.validateLocalUser(loginInput);
    return await this.authService.login(user);
  }

  @Post('register')
  async register(@Body() registerInput: RegisterInput) {
    return await this.authService.register(registerInput);
  }

  @Post('send-code')
  async sendCode(@Body(new ValidationPipe()) sendCodeInput: SendCodeInput) {
    const { email } = sendCodeInput;
    await this.authService.sendVerificationCode(email);
    return { success: true, message: '验证码已发送' };
  }
}
