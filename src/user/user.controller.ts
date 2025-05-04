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
import { DiaryService } from '../diary/diary.service';
import { GetUserDiariesQueryDto } from 'src/diary/dto/get-user-diaries-query.dto';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly diaryService: DiaryService,
  ) {}

  @Get('list')
  @UseGuards(JwtAuthGuard)
  async getUserList(@Query() query: GetUserListQueryDto, @Request() req: any) {
    return this.userService.getUserList(query, req.user);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Request() req: any) {
    // 过滤用户信息
    const filteredUser = filterBySelect(req.user, fullInfoSelect);
    // 获取关注和粉丝状态
    const followStats = await this.userService.getFollowStats(req.user.id);
    return {
      ...filteredUser,
      ...followStats,
    };
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

  @UseGuards(JwtAuthGuard)
  @Get('me/diary')
  async getMyAllDiaries(
    @Request() req: any,
    @Query(new ValidationPipe({ transform: true }))
    query: GetUserDiariesQueryDto,
  ) {
    return this.diaryService.getAllUserDiaries(req.user.id, query);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/follow-stats')
  async getUserFollowStats(
    @Param(new ValidationPipe({ transform: true })) param: GetUserIdParamDto,
  ) {
    return this.userService.getFollowStats(param.id);
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

  @Get(':id/diary')
  async getUserDiaries(
    @Param(new ValidationPipe({ transform: true })) param: GetUserIdParamDto,
    @Query(new ValidationPipe({ transform: true }))
    query: GetUserDiariesQueryDto,
  ) {
    return this.diaryService.getUserDiaries(param.id, query);
  }
}
