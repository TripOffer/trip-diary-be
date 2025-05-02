import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  Put,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { DeleteAccountInput } from './dto/delete-account.input';
import { LoginInput } from './dto/login.input';
import { RegisterInput } from './dto/register.input';
import { SendCodeInput } from './dto/send-code.input';
import { UpdatePasswordInput } from './dto/update-password.input';
import { ResetPasswordInput } from './dto/reset-password.input';
import { JwtAuthGuard } from './guards/jwt-auth/jwt-auth.guard';

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

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteAccount(
    @Param('id') id: string,
    @Body(new ValidationPipe()) deleteAccountInput: DeleteAccountInput,
  ) {
    await this.authService.deleteAccount(Number(id), deleteAccountInput);
    return { success: true, message: '账号已注销' };
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/password')
  async updatePassword(
    @Param('id') id: string,
    @Body(new ValidationPipe()) updatePasswordInput: UpdatePasswordInput,
  ) {
    await this.authService.updatePassword(Number(id), updatePasswordInput);
    return { success: true, message: '密码修改成功' };
  }

  @Post('reset-password')
  async resetPassword(
    @Body(new ValidationPipe()) resetPasswordInput: ResetPasswordInput,
  ) {
    await this.authService.resetPassword(resetPasswordInput);
    return { success: true, message: '密码重置成功' };
  }
}
