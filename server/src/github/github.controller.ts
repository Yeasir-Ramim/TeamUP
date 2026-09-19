import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { GithubService } from './github.service';
import { LinkGithubDto } from './dto/link-github.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';

@Controller('github')
export class GithubController {
  constructor(private readonly githubService: GithubService) {}

  @Get('auth-url')
  getAuthUrl(@Query('redirectUri') redirectUri?: string) {
    return this.githubService.getAuthUrl(redirectUri);
  }

  @Post('link')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async linkGithub(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: LinkGithubDto,
  ) {
    return this.githubService.linkAccount(
      user.userId,
      dto.code,
      ...(dto.redirectUri ? [dto.redirectUri] : []),
    );
  }

  @Get('stats/:username')
  async getStatsByUsername(@Param('username') username: string) {
    return this.githubService.getStatsForUsername(username);
  }

  @Get('profile/:profileId')
  async getStatsByProfileId(@Param('profileId') profileId: string) {
    return this.githubService.getStatsForProfile(profileId);
  }
}
