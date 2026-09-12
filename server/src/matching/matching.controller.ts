import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { MatchingService } from './matching.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';

@Controller('matching')
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Get('recommendations/:projectId')
  @UseGuards(JwtAuthGuard)
  async getRecommendations(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.matchingService.getRecommendations(projectId, user?.userId);
  }
}
