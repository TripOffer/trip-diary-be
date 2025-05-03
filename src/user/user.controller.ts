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
  ValidationPipe,
  ForbiddenException,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { UpdateUserInput } from './dto/update-user.input';
import { AdminGuard } from '../auth/guards/admin.guard';
import { ChangeUserRoleInput } from './dto/change-user-role.input';
import { GetUserListQueryDto } from './dto/get-user-list-query.dto';
import { fullInfoSelect } from './common/info-select';
import { filterBySelect } from 'src/common/filter-by-select.util';
import { UpdateAvatarInput } from './dto/update-avatar.input';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getProfile(@Request() req: any) {
    return filterBySelect(req.user, fullInfoSelect);
  }

  @Get('list')
  @UseGuards(JwtAuthGuard)
  async getUserList(@Query() query: GetUserListQueryDto, @Request() req: any) {
    return this.userService.getUserList(query, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Put()
  async updateProfile(
    @Body(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    updateUserInput: UpdateUserInput,
    @Request() req: any,
  ) {
    const id = req.user.id;
    return this.userService.updateBasicInfo(id, updateUserInput);
  }

  @UseGuards(JwtAuthGuard)
  @Put('avatar')
  async updateAvatar(
    @Body()
    input: UpdateAvatarInput,
    @Request() req: any,
  ) {
    const id = req.user.id;
    return this.userService.updateAvatar(id, input.avatar);
  }

  @Get(':id')
  async getUserProfileById(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    const user = await this.userService.findBasicInfoById(id, req.user);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put(':id/role')
  async changeUserRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() changeUserRoleInput: ChangeUserRoleInput,
    @Request() req: any,
  ) {
    return this.userService.changeUserRole(id, changeUserRoleInput, req.user);
  }
}
