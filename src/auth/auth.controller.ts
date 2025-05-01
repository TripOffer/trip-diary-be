import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginInput } from './dto/login.input';
import { AuthPayload } from './entities/auth-payload.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginInput: LoginInput) {
    const user = await this.authService.validateLocalUser(loginInput);

    return await this.authService.login(user);
  }
}
