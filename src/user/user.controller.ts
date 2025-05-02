import {
  Controller,
  Get,
  Request,
  UseGuards,
  Param,
  ParseIntPipe,
  NotFoundException,
  Body,
  Put,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { UpdateUserInput } from './dto/update-user.input';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getProfile(@Request() req: any) {
    // 只返回基础信息
    const { id, name, email, avatar, bio, gender, role } = req.user;
    return { id, name, email, avatar, bio, gender, role };
  }

  @Get(':id')
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    const user = await this.userService.findBasicInfoById(id);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Put()
  async updateProfile(
    @Body() updateUserInput: UpdateUserInput,
    @Request() req: any,
  ) {
    const id = req.user.id;
    const { name, bio, gender } = updateUserInput;
    return this.userService.updateBasicInfo(id, { name, bio, gender });
  }
}
