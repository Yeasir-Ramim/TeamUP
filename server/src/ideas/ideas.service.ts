import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateIdeaDto } from './dto/create-idea.dto';
import { UpdateIdeaDto } from './dto/update-idea.dto';
import { IdeaFilterDto } from './dto/idea-filter.dto';
import { ExpressInterestDto } from './dto/express-interest.dto';

@Injectable()
export class IdeasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Create a new community idea
   */
  async createIdea(userId: string, dto: CreateIdeaDto) {
    const suggestedStack = Array.isArray(dto.suggestedStack)
      ? [...new Set(dto.suggestedStack.map((s) => s.trim()).filter(Boolean))]
      : [];

    return this.prisma.idea.create({
      data: {
        title: dto.title.trim(),
        description: dto.description.trim(),
        domain: dto.domain.trim(),
        suggestedStack,
        authorId: userId,
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            role: true,
            profile: {
              select: {
                fullName: true,
                avatarUrl: true,
                bio: true,
                department: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Find all ideas matching optional search, domain, tag, author filters with pagination
   */
  async findAll(query: IdeaFilterDto) {
    const where: Prisma.IdeaWhereInput = {};

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
      ];
    }

    if (query.domain && query.domain.trim()) {
      where.domain = { equals: query.domain.trim(), mode: 'insensitive' };
    }

    if (query.tag && query.tag.trim()) {
      where.suggestedStack = {
        hasSome: [query.tag.trim()],
      };
    }

    if (query.authorId && query.authorId.trim()) {
      where.authorId = query.authorId.trim();
    }

    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 20;
    const skip = (page - 1) * limit;

    const [total, ideas] = await Promise.all([
      this.prisma.idea.count({ where }),
      this.prisma.idea.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              email: true,
              role: true,
              profile: {
                select: {
                  fullName: true,
                  avatarUrl: true,
                  bio: true,
                  department: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      ideas,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single idea by ID
   */
  async getIdeaById(id: string) {
    const idea = await this.prisma.idea.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            role: true,
            profile: {
              select: {
                fullName: true,
                avatarUrl: true,
                bio: true,
                department: true,
              },
            },
          },
        },
      },
    });

    if (!idea) {
      throw new NotFoundException(`Idea with ID '${id}' not found`);
    }

    return idea;
  }

  /**
   * Update authored idea
   */
  async updateIdea(userId: string, id: string, dto: UpdateIdeaDto) {
    const idea = await this.prisma.idea.findUnique({
      where: { id },
    });

    if (!idea) {
      throw new NotFoundException(`Idea with ID '${id}' not found`);
    }

    if (idea.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own ideas');
    }

    const data: Prisma.IdeaUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.description !== undefined)
      data.description = dto.description.trim();
    if (dto.domain !== undefined) data.domain = dto.domain.trim();
    if (dto.suggestedStack !== undefined) {
      data.suggestedStack = [
        ...new Set(dto.suggestedStack.map((s) => s.trim()).filter(Boolean)),
      ];
    }

    return this.prisma.idea.update({
      where: { id },
      data,
      include: {
        author: {
          select: {
            id: true,
            email: true,
            role: true,
            profile: {
              select: {
                fullName: true,
                avatarUrl: true,
                bio: true,
                department: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Delete authored idea (Author or Admin)
   */
  async deleteIdea(userId: string, id: string, userRole?: string) {
    const idea = await this.prisma.idea.findUnique({
      where: { id },
    });

    if (!idea) {
      throw new NotFoundException(`Idea with ID '${id}' not found`);
    }

    if (idea.authorId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('You can only delete your own ideas');
    }

    await this.prisma.idea.delete({
      where: { id },
    });

    return {
      message: 'Idea deleted successfully',
    };
  }

  /**
   * Express collaboration interest in an idea and notify the author
   */
  async expressInterest(userId: string, id: string, dto: ExpressInterestDto) {
    const idea = await this.prisma.idea.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!idea) {
      throw new NotFoundException(`Idea with ID '${id}' not found`);
    }

    if (idea.authorId === userId) {
      throw new BadRequestException(
        'You cannot express collaboration interest in your own idea',
      );
    }

    if (!idea.authorId) {
      throw new BadRequestException(
        'Author of this idea is no longer available',
      );
    }

    const applicant = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          select: {
            fullName: true,
          },
        },
      },
    });

    const applicantName =
      applicant?.profile?.fullName || applicant?.email || 'A fellow student';

    await this.notificationsService.notifyUser(idea.authorId, {
      title: 'New Collaboration Interest!',
      body: `${applicantName} expressed interest in collaborating on "${idea.title}".`,
      type: 'IDEA_INTEREST',
      data: {
        ideaId: idea.id,
        ideaTitle: idea.title,
        applicantId: userId,
        applicantName,
        message: dto.message || null,
      },
    });

    return {
      message: 'Interest expressed successfully',
    };
  }
}
