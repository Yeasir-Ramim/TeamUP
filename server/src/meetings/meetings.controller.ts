import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MeetingsService } from './meetings.service';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { VoteSlotsDto } from './dto/vote-slots.dto';
import { FinalizeMeetingDto } from './dto/finalize-meeting.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';

@Controller()
@UseGuards(JwtAuthGuard)
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  /**
   * Propose candidate meeting slots for a project
   */
  @Post('projects/:projectId/meetings')
  @HttpCode(HttpStatus.CREATED)
  async createMeeting(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Body() dto: CreateMeetingDto,
  ) {
    return this.meetingsService.createMeeting(user.userId, projectId, dto);
  }

  /**
   * List all meetings for a project with slots and vote tallies
   */
  @Get('projects/:projectId/meetings')
  async getProjectMeetings(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
  ) {
    return this.meetingsService.getProjectMeetings(user.userId, projectId);
  }

  /**
   * Get single meeting details with candidate slots and vote records
   */
  @Get('meetings/:id')
  async getMeetingById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.meetingsService.getMeetingById(user.userId, id);
  }

  /**
   * Cast votes for candidate meeting slots
   */
  @Post('meetings/:id/vote')
  @HttpCode(HttpStatus.OK)
  async voteSlots(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: VoteSlotsDto,
  ) {
    return this.meetingsService.voteSlots(user.userId, id, dto);
  }

  /**
   * Manually finalize meeting and select winning slot (Leader only)
   */
  @Post('meetings/:id/finalize')
  @HttpCode(HttpStatus.OK)
  async finalizeMeeting(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: FinalizeMeetingDto,
  ) {
    return this.meetingsService.manualFinalize(user.userId, id, dto);
  }

  /**
   * Cancel meeting (Leader only)
   */
  @Post('meetings/:id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelMeeting(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.meetingsService.cancelMeeting(user.userId, id);
  }
}
