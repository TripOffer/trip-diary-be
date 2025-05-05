import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { CommentService } from './comment.service';
import { CreateCommentInput } from './dto/create-comment.input';
import { GetDiaryCommentsQueryDto } from './dto/get-diary-comments-query.dto';
import { OptionalJwtAuthGuard } from 'src/auth/guards/jwt-auth/optional-jwt-auth.guard';

@Controller('diary')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @UseGuards(JwtAuthGuard)
  @Post(':id/comment')
  async createComment(
    @Param('id') id: string,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    input: CreateCommentInput,
    @Req() req,
  ) {
    return this.commentService.createComment(id, input, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':diaryId/comment/:id')
  async deleteComment(@Param('id') id: string, @Req() req) {
    return this.commentService.deleteComment(id, req.user);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id/comments')
  async getDiaryComments(
    @Param('id') id: string,
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: GetDiaryCommentsQueryDto,
    @Req() req,
  ) {
    return this.commentService.getDiaryComments(id, query, req.user?.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':diaryId/comment/:id')
  async getCommentReplies(
    @Param('id') id: string,
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: GetDiaryCommentsQueryDto,
    @Req() req,
  ) {
    return this.commentService.getCommentReplies(id, query, req.user?.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':diaryId/comment/:id/like')
  async likeComment(@Param('id') id: string, @Req() req) {
    return this.commentService.likeComment(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':diaryId/comment/:id/like')
  async unlikeComment(@Param('id') id: string, @Req() req) {
    return this.commentService.unlikeComment(id, req.user.id);
  }
}
