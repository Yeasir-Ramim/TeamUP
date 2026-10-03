import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { MatchingModule } from '../matching/matching.module';
import { BookmarksModule } from '../bookmarks/bookmarks.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [MatchingModule, BookmarksModule, NotificationsModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
