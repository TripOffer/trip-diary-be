import { Module } from '@nestjs/common';
import { FavoriteService } from './favorite.service';
import { FavoriteController } from './favorite.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  providers: [FavoriteService, PrismaService],
  controllers: [FavoriteController],
})
export class FavoriteModule {}
