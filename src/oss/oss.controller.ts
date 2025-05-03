import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { OssService } from './oss.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';

@Controller('oss')
export class OssController {
  constructor(private readonly ossService: OssService) {}

  @Get('presign')
  @UseGuards(JwtAuthGuard)
  async getPresignedUrl(@Query('ext') ext: string = 'jpg') {
    return this.ossService.generatePresignedUrl(ext);
  }
}
