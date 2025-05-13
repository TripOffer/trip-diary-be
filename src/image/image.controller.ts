import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { SkipThrottle } from '@nestjs/throttler';

@SkipThrottle()
@Controller('image')
export class ImageController {
  @Get()
  redirectToImage(
    @Query() query: Record<string, string>,
    @Res() res: Response,
  ) {
    const baseUrl =
      process.env.IMAGE_PROXY_BASE || 'https://image.trip.mengchen.xyz/';
    const params = new URLSearchParams(query).toString();
    const targetUrl = `${baseUrl}?${params}`;
    return res.redirect(targetUrl);
  }
}
