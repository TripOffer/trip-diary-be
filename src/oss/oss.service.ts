import { BadRequestException, Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import * as dayjs from 'dayjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OssService {
  private client: S3Client;
  private bucket: string;

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get<string>('AWS_REGION');
    const endpoint = this.configService.get<string>('S3_ENDPOINT');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    );
    const bucket = this.configService.get<string>('S3_BUCKET');

    if (!region || !endpoint || !accessKeyId || !secretAccessKey || !bucket) {
      throw new Error('缺少 AWS S3 配置');
    }

    this.client = new S3Client({
      region,
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true,
    });
    this.bucket = bucket;
  }

  async generatePresignedUrl(
    ext: string = 'jpg',
  ): Promise<{ url: string; key: string }> {
    // 仅支持 webview 可用的图片和视频格式
    const allowedExts = [
      // 图片
      'jpg',
      'jpeg',
      'png',
      'webp',
      'gif',
      // 视频
      'mp4',
      'webm',
    ];
    ext = ext.toLowerCase();
    if (!allowedExts.includes(ext)) {
      throw new BadRequestException(
        '仅支持图片（jpg、jpeg、png、webp、gif）和视频（mp4、webm）格式',
      );
    }
    const datePath = dayjs().format('YYYY/MM/DD');
    const key = `${datePath}/${uuidv4()}.${ext}`;
    const contentTypeMap = {
      // 图片
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      gif: 'image/gif',
      // 视频
      mp4: 'video/mp4',
      webm: 'video/webm',
    };
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentTypeMap[ext],
    });
    const url = await getSignedUrl(this.client, command, { expiresIn: 300 }); // 5分钟
    return { url, key };
  }
}
