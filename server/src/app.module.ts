import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProfilesModule } from './profiles/profiles.module';
import { SkillsModule } from './skills/skills.module';
import { ProjectsModule } from './projects/projects.module';
import { WorkspaceModule } from './workspace/workspace.module';
import { GithubModule } from './github/github.module';
import { MatchingModule } from './matching/matching.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
    }),
    PrismaModule,
    AuthModule,
    ProfilesModule,
    SkillsModule,
    ProjectsModule,
    WorkspaceModule,
    GithubModule,
    MatchingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
