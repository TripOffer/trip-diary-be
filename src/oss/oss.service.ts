import { BadRequestException, Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import * as dayjs from 'dayjs';
import { ConfigService } from '@nestjs/config';
import { PresignInputDto } from './dto/presign.input';
import { RedisService } from '../common/redis.service';
import { PrismaService } from '../prisma/prisma.service';

interface OssMeta {
  width?: string;
  height?: string;
  duration?: string;
  type?: string;
}

@Injectable()
export class OssService {
  private client: S3Client;
  private bucket: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly prisma: PrismaService,
  ) {
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
    dto: PresignInputDto,
  ): Promise<{ url: string; key: string }> {
    const allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'webm'];
    const ext = dto.ext.toLowerCase();
    if (!allowedExts.includes(ext)) {
      throw new BadRequestException(
        '仅支持图片（jpg、jpeg、png、webp、gif）和视频（mp4、webm）格式',
      );
    }
    const datePath = dayjs().format('YYYY/MM/DD');
    const key = `${datePath}/${uuidv4()}.${ext}`;
    const contentTypeMap = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      gif: 'image/gif',
      mp4: 'video/mp4',
      webm: 'video/webm',
    };
    // 构造自定义元数据
    const Metadata: Record<string, string> = {};
    if (dto.width !== undefined) Metadata['width'] = String(dto.width);
    if (dto.height !== undefined) Metadata['height'] = String(dto.height);
    if (dto.duration !== undefined) Metadata['duration'] = String(dto.duration);
    if (dto.type) Metadata['type'] = dto.type;

    // 写入 Redis，10 分钟过期
    const redisClient = this.redisService.getClient();
    const redisKey = `oss:presign:${key}`;
    const metaToSave = {
      key,
      ext,
      width: dto.width,
      height: dto.height,
      duration: dto.duration,
      type: dto.type,
      createdAt: Date.now(),
    };
    await redisClient.set(redisKey, JSON.stringify(metaToSave), 'EX', 600);

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentTypeMap[ext],
      Metadata,
    });
    const url = await getSignedUrl(this.client, command, { expiresIn: 300 });
    return { url, key };
  }

  async confirmUpload(key: string, userId: number) {
    if (!key) throw new Error('缺少 key');
    if (!userId) throw new Error('缺少 userId');
    // 检查 R2 是否存在该对象
    try {
      await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      );
    } catch (err) {
      throw new Error('对象未上传或已过期');
    }
    // 查 Redis
    const redisClient = this.redisService.getClient();
    const redisKey = `oss:presign:${key}`;
    const metaStr = await redisClient.get(redisKey);
    if (!metaStr) throw new Error('元数据不存在或已过期');
    const meta = JSON.parse(metaStr);
    await redisClient.del(redisKey);
    // 写入数据库
    const ossObject = await this.prisma.ossObject.create({
      data: {
        key,
        userId,
        ext: meta.ext,
        width: meta.width ?? null,
        height: meta.height ?? null,
        duration: meta.duration ?? null,
        type: meta.type ?? null,
      },
    });
    return { success: true, ossObject };
  }

  /**
   * 根据 key 查询 OSS 文件元信息
   */
  async getOssObjectByKey(key: string) {
    if (!key) return null;
    const meta = await this.prisma.ossObject.findUnique({ where: { key } });
    return this.formatOssMeta(meta);
  }

  /**
   * 批量获取 OSS 文件元信息
   */
  async getOssObjectsByKeys(keys: string[]): Promise<Record<string, any>> {
    if (!keys || keys.length === 0) return {};
    const list = await this.prisma.ossObject.findMany({
      where: { key: { in: keys } },
    });
    const map: Record<string, any> = {};
    for (const obj of list) {
      map[obj.key] = this.formatOssMeta(obj);
    }
    return map;
  }

  /**
   * 格式化 OSS 元信息，根据类型裁剪字段
   */
  formatOssMeta(meta: any) {
    if (!meta) return null;
    const base = {
      id: meta.id,
      key: meta.key,
      userId: meta.userId,
      ext: meta.ext,
      type: meta.type,
      createdAt: meta.createdAt,
    };
    const imageExts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    const videoExts = ['mp4', 'webm'];
    if (imageExts.includes(meta.ext)) {
      return { ...base, width: meta.width, height: meta.height };
    }
    if (videoExts.includes(meta.ext)) {
      return {
        ...base,
        width: meta.width,
        height: meta.height,
        duration: meta.duration,
      };
    }
    return base;
  }
}
