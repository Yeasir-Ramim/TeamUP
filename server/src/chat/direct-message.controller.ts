import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';

class SendDirectMessageDto {
  recipientId: string;
  content: string;
  projectId?: string;
}

@Controller('direct-messages')
@UseGuards(JwtAuthGuard)
export class DirectMessageController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * Get all active conversations for the authenticated user
   * GET /direct-messages/conversations
   */
  @Get('conversations')
  async getConversations(@CurrentUser() user: AuthenticatedUser) {
    return this.chatService.getUserConversations(user.userId);
  }

  /**
   * Get direct message history between current user and target user
   * GET /direct-messages/:targetUserId
   */
  @Get(':targetUserId')
  async getDirectMessages(
    @CurrentUser() user: AuthenticatedUser,
    @Param('targetUserId') targetUserId: string,
  ) {
    if (!targetUserId) {
      throw new BadRequestException('targetUserId is required');
    }
    return this.chatService.getDirectMessages(user.userId, targetUserId, 50);
  }

  /**
   * Send a direct message to a user
   * POST /direct-messages
   */
  @Post()
  async sendDirectMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: SendDirectMessageDto,
  ) {
    if (!body?.recipientId || !body?.content?.trim()) {
      throw new BadRequestException('recipientId and content are required');
    }
    return this.chatService.sendDirectMessage(
      user.userId,
      body.recipientId,
      body.content.trim(),
      body.projectId,
    );
  }
}
