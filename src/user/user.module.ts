import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { DiaryModule } from '../diary/diary.module';

@Module({
  imports: [PrismaModule, DiaryModule],
  providers: [UserService],
  controllers: [UserController],
})
export class UserModule {}
