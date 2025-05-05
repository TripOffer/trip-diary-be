import { IsOptional, IsString, IsIn, IsInt, IsNumber } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class PresignInputDto {
  @IsString()
  @IsIn(['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'webm'], {
    message: 'ext 仅支持 jpg、jpeg、png、webp、gif、mp4、webm',
  })
  @Transform(({ value }) => value?.toLowerCase?.())
  ext: string;

  @IsOptional()
  @IsInt({ message: 'width 必须为整数' })
  @Type(() => Number)
  width?: number;

  @IsOptional()
  @IsInt({ message: 'height 必须为整数' })
  @Type(() => Number)
  height?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'duration 必须为数字（秒，可带小数，支持毫秒）' })
  duration?: number;

  @IsOptional()
  @IsString()
  @IsIn(['thumb', 'origin', 'video'], {
    message: 'type 仅支持 thumb、origin、video',
  })
  type?: string; // 区分缩略图、原图、视频
}
