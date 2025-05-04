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
import { GetUserFollowListQueryDto } from './dto/get-user-follow-list-query.dto';
import { GetUserIdParamDto } from './dto/get-user-id-param.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('list')
  @UseGuards(JwtAuthGuard)
  async getUserList(@Query() query: GetUserListQueryDto, @Request() req: any) {
    return this.userService.getUserList(query, req.user);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Request() req: any) {
    return filterBySelect(req.user, fullInfoSelect);
  }

  @UseGuards(JwtAuthGuard)
  @Put('me')
  async updateMe(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    updateUserInput: UpdateUserInput,
    @Request() req: any,
  ) {
    return this.userService.updateBasicInfo(req.user.id, updateUserInput);
  }

  @UseGuards(JwtAuthGuard)
  @Put('me/avatar')
  async updateMeAvatar(@Body() input: UpdateAvatarInput, @Request() req: any) {
    return this.userService.updateAvatar(req.user.id, input.avatar);
  }

  @Get(':id')
  async getUserById(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    const user = await this.userService.findBasicInfoById(id, req.user);
    if (!user) throw new NotFoundException('用户不存在');
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

  @UseGuards(JwtAuthGuard)
  @Put(':id/follow')
  async followUser(
    @Param(new ValidationPipe({ transform: true })) param: GetUserIdParamDto,
    @Request() req: any,
  ) {
    return this.userService.followUser(req.user.id, param.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/unfollow')
  async unfollowUser(
    @Param(new ValidationPipe({ transform: true })) param: GetUserIdParamDto,
    @Request() req: any,
  ) {
    return this.userService.unfollowUser(req.user.id, param.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/following')
  async getFollowingListById(
    @Param(new ValidationPipe({ transform: true })) param: GetUserIdParamDto,
    @Query(new ValidationPipe({ transform: true }))
    query: GetUserFollowListQueryDto,
  ) {
    return this.userService.getFollowingList(param.id, query.page, query.size);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/followers')
  async getFollowersListById(
    @Param(new ValidationPipe({ transform: true })) param: GetUserIdParamDto,
    @Query(new ValidationPipe({ transform: true }))
    query: GetUserFollowListQueryDto,
  ) {
    return this.userService.getFollowersList(param.id, query.page, query.size);
  }
}
