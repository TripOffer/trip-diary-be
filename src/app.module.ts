import { Module } from '@nestjs/common';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PostModule } from './post/post.module';
import { PrismaModule } from './prisma/prisma.module';
import { CommentModule } from './comment/comment.module';
import { TagModule } from './tag/tag.module';
import { LikeModule } from './like/like.module';
import { FavoriteModule } from './favorite/favorite.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    PrismaModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      ignoreEnvFile: false,
      cache: true,
    }),
    UserModule,
    PostModule,
    CommentModule,
    TagModule,
    LikeModule,
    FavoriteModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
