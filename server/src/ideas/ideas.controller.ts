import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IdeasService } from './ideas.service';
import { CreateIdeaDto } from './dto/create-idea.dto';
import { UpdateIdeaDto } from './dto/update-idea.dto';
import { IdeaFilterDto } from './dto/idea-filter.dto';
import { ExpressInterestDto } from './dto/express-interest.dto';
import { GenerateIdeaDto } from './dto/generate-idea.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';

@Controller('ideas')
export class IdeasController {
  constructor(private readonly ideasService: IdeasService) {}

  /**
   * Generate an AI project idea with query caching
   */
  @Post('generate')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async generateIdea(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: GenerateIdeaDto,
  ) {
    return this.ideasService.generateIdea(user.userId, dto);
  }

  /**
   * Publish a new community idea
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createIdea(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateIdeaDto,
  ) {
    return this.ideasService.createIdea(user.userId, dto);
  }

  /**
   * Search and filter community ideas
   */
  @Get()
  async findAll(@Query() query: IdeaFilterDto) {
    return this.ideasService.findAll(query);
  }

  /**
   * View details of a specific idea
   */
  @Get(':id')
  async getIdeaById(@Param('id') id: string) {
    return this.ideasService.getIdeaById(id);
  }

  /**
   * Update authored idea
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async updateIdea(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateIdeaDto,
  ) {
    return this.ideasService.updateIdea(user.userId, id, dto);
  }

  /**
   * Delete authored idea
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteIdea(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.ideasService.deleteIdea(user.userId, id, user.role);
  }

  /**
   * Express collaboration interest in an idea
   */
  @Post(':id/interest')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async expressInterest(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ExpressInterestDto,
  ) {
    return this.ideasService.expressInterest(user.userId, id, dto);
  }
}
