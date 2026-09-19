import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { IdeasController } from './ideas.controller';
import { IdeasService } from './ideas.service';
import { AiIdeaService } from './ai-idea.service';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [IdeasController],
  providers: [IdeasService, AiIdeaService],
  exports: [IdeasService, AiIdeaService],
})
export class IdeasModule {}
