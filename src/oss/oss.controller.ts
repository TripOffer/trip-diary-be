import {
  Controller,
  Get,
  Query,
  UseGuards,
  BadRequestException,
  Request,
  Post,
  Body,
} from '@nestjs/common';
import { OssService } from './oss.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { PresignInputDto } from './dto/presign.input';
import { ConfirmUploadInputDto } from './dto/confirm-upload.input';

@Controller('oss')
export class OssController {
  constructor(private readonly ossService: OssService) {}

  @Get('presign')
  @UseGuards(JwtAuthGuard)
  async getPresignedUrl(@Query() dto: PresignInputDto) {
    try {
      return await this.ossService.generatePresignedUrl(dto);
    } catch (e) {
      throw new BadRequestException(e.message || '生成预签名链接失败');
    }
  }

  @Post('confirm-upload')
  @UseGuards(JwtAuthGuard)
  async confirmUpload(@Body() dto: ConfirmUploadInputDto, @Request() req: any) {
    try {
      return await this.ossService.confirmUpload(dto.key, req.user.id);
    } catch (e) {
      throw new BadRequestException(e.message || '确认上传失败');
    }
  }
}
