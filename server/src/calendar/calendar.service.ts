import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import {
  EventType,
  MemberStatus,
  MeetingStatus,
  TaskStatus,
  ProjectRole,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { CalendarFeedQueryDto } from './dto/calendar-feed-query.dto';
import { UnifiedCalendarItem } from './interfaces/unified-calendar-item.interface';

@Injectable()
export class CalendarService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper to verify if user is an accepted member or creator of a project
   */
  private async verifyProjectMember(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          where: { status: MemberStatus.ACCEPTED },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID '${projectId}' not found`);
    }

    const isMember =
      project.creatorId === userId ||
      project.members.some((m) => m.userId === userId);

    if (!isMember) {
      throw new ForbiddenException(
        'You are not an active member of this project',
      );
    }

    return project;
  }

  /**
   * Create an explicit project calendar event (Meeting, Deadline, Milestone)
   */
  async createEvent(
    userId: string,
    projectId: string,
    dto: CreateCalendarEventDto,
  ) {
    await this.verifyProjectMember(projectId, userId);

    const start = new Date(dto.startDate);
    if (isNaN(start.getTime())) {
      throw new BadRequestException('Invalid startDate format');
    }

    let end: Date | null = null;
    if (dto.endDate) {
      end = new Date(dto.endDate);
      if (isNaN(end.getTime())) {
        throw new BadRequestException('Invalid endDate format');
      }
      if (start.getTime() >= end.getTime()) {
        throw new BadRequestException(
          'Event startDate must be strictly before endDate',
        );
      }
    }

    return this.prisma.calendarEvent.create({
      data: {
        projectId,
        title: dto.title.trim(),
        description: dto.description?.trim(),
        eventType: dto.eventType ?? EventType.DEADLINE,
        startDate: start,
        endDate: end,
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }

  /**
   * Get all calendar events for a specific project with optional filtering
   */
  async getProjectEvents(
    userId: string,
    projectId: string,
    query?: CalendarFeedQueryDto,
  ) {
    await this.verifyProjectMember(projectId, userId);

    const where: Prisma.CalendarEventWhereInput = { projectId };

    if (query?.eventType) {
      where.eventType = query.eventType;
    }

    if (query?.startDate || query?.endDate) {
      const conditions: Prisma.CalendarEventWhereInput[] = [];
      if (query.endDate) {
        conditions.push({ startDate: { lte: new Date(query.endDate) } });
      }
      if (query.startDate) {
        conditions.push({
          OR: [
            { endDate: { gte: new Date(query.startDate) } },
            { endDate: null, startDate: { gte: new Date(query.startDate) } },
          ],
        });
      }
      where.AND = conditions;
    }

    return this.prisma.calendarEvent.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        startDate: 'asc',
      },
    });
  }

  /**
   * Get single calendar event details
   */
  async getEventById(userId: string, id: string) {
    const event = await this.prisma.calendarEvent.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            members: {
              where: { status: MemberStatus.ACCEPTED },
            },
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException(`Calendar event with ID '${id}' not found`);
    }

    const isMember =
      event.project.creatorId === userId ||
      event.project.members.some((m) => m.userId === userId);

    if (!isMember) {
      throw new ForbiddenException(
        'You are not an active member of this project',
      );
    }

    return event;
  }

  /**
   * Delete calendar event (Leader or Creator only)
   */
  async deleteEvent(userId: string, id: string) {
    const event = await this.prisma.calendarEvent.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException(`Calendar event with ID '${id}' not found`);
    }

    const isLeader =
      event.project.creatorId === userId ||
      event.project.members.some(
        (m) =>
          m.userId === userId &&
          m.role === ProjectRole.LEADER &&
          m.status === MemberStatus.ACCEPTED,
      );

    if (!isLeader) {
      throw new ForbiddenException(
        'Only project leaders or creators can delete calendar events',
      );
    }

    await this.prisma.calendarEvent.delete({
      where: { id },
    });

    return {
      deleted: true,
      message: 'Calendar event deleted successfully',
    };
  }

  /**
   * Unified Calendar Aggregator Feed
   * Merges CalendarEvent, Task deadlines, and confirmed Meetings across user's active projects.
   */
  async getUnifiedFeed(
    userId: string,
    query?: CalendarFeedQueryDto,
  ): Promise<UnifiedCalendarItem[]> {
    // 1. Identify all active project IDs for the user
    const memberships = await this.prisma.projectMember.findMany({
      where: {
        userId,
        status: MemberStatus.ACCEPTED,
      },
      select: { projectId: true },
    });

    const createdProjects = await this.prisma.project.findMany({
      where: { creatorId: userId },
      select: { id: true },
    });

    const userProjectIds = Array.from(
      new Set([
        ...memberships.map((m) => m.projectId),
        ...createdProjects.map((p) => p.id),
      ]),
    );

    let targetProjectIds: string[] = [];

    if (query?.projectId) {
      if (!userProjectIds.includes(query.projectId)) {
        throw new ForbiddenException(
          'You are not a member of the requested project',
        );
      }
      targetProjectIds = [query.projectId];
    } else {
      targetProjectIds = userProjectIds;
    }

    if (targetProjectIds.length === 0) {
      return [];
    }

    const queryStart = query?.startDate ? new Date(query.startDate) : null;
    const queryEnd = query?.endDate ? new Date(query.endDate) : null;

    // 2. Fetch from multiple sources in parallel
    // Source A: Calendar Events
    const eventWhere: Prisma.CalendarEventWhereInput = {
      projectId: { in: targetProjectIds },
    };
    if (query?.eventType) {
      eventWhere.eventType = query.eventType;
    }
    if (queryStart || queryEnd) {
      const conditions: Prisma.CalendarEventWhereInput[] = [];
      if (queryEnd) conditions.push({ startDate: { lte: queryEnd } });
      if (queryStart) {
        conditions.push({
          OR: [
            { endDate: { gte: queryStart } },
            { endDate: null, startDate: { gte: queryStart } },
          ],
        });
      }
      eventWhere.AND = conditions;
    }

    // Source B: Tasks with DueDates (Only if eventType filter is not excluding deadlines)
    const shouldFetchTasks =
      !query?.eventType || query.eventType === EventType.DEADLINE;

    const taskWhere: Prisma.TaskWhereInput = {
      projectId: { in: targetProjectIds },
      dueDate: { not: null },
    };
    if (queryStart || queryEnd) {
      const dueDateFilter: Prisma.DateTimeNullableFilter = { not: null };
      if (queryStart) dueDateFilter.gte = queryStart;
      if (queryEnd) dueDateFilter.lte = queryEnd;
      taskWhere.dueDate = dueDateFilter;
    }

    // Source C: Confirmed Meetings
    const shouldFetchMeetings =
      !query?.eventType || query.eventType === EventType.MEETING;

    const [events, tasks, meetings] = await Promise.all([
      this.prisma.calendarEvent.findMany({
        where: eventWhere,
        include: { project: { select: { id: true, title: true } } },
      }),
      shouldFetchTasks
        ? this.prisma.task.findMany({
            where: taskWhere,
            include: { project: { select: { id: true, title: true } } },
          })
        : Promise.resolve([]),
      shouldFetchMeetings
        ? this.prisma.meeting.findMany({
            where: {
              projectId: { in: targetProjectIds },
              status: MeetingStatus.CONFIRMED,
              selectedSlot: { isNot: null },
            },
            include: {
              project: { select: { id: true, title: true } },
              selectedSlot: true,
            },
          })
        : Promise.resolve([]),
    ]);

    // 3. Normalize into UnifiedCalendarItem[]
    const items: UnifiedCalendarItem[] = [];

    // Map Calendar Events
    for (const e of events) {
      items.push({
        id: e.id,
        source: 'CALENDAR_EVENT',
        projectId: e.projectId,
        projectTitle: e.project.title,
        title: e.title,
        description: e.description,
        eventType: e.eventType,
        startDate: e.startDate.toISOString(),
        endDate: e.endDate ? e.endDate.toISOString() : null,
      });
    }

    // Map Tasks
    for (const t of tasks) {
      if (!t.dueDate) continue;
      items.push({
        id: t.id,
        source: 'TASK',
        projectId: t.projectId,
        projectTitle: t.project.title,
        title: `Task Deadline: ${t.title}`,
        description: t.description,
        eventType: 'TASK',
        startDate: t.dueDate.toISOString(),
        endDate: null,
        priority: t.priority,
        isCompleted: t.status === TaskStatus.DONE,
        isAssignee: t.assigneeId === userId,
        status: t.status,
      });
    }

    // Map Confirmed Meetings (deduplicating against already-synced CalendarEvents)
    for (const m of meetings) {
      if (!m.selectedSlot) continue;
      const slotStart = m.selectedSlot.startTime.toISOString();

      if (queryStart && m.selectedSlot.endTime < queryStart) continue;
      if (queryEnd && m.selectedSlot.startTime > queryEnd) continue;

      const isAlreadySynced = items.some(
        (i) =>
          i.projectId === m.projectId &&
          i.eventType === 'MEETING' &&
          i.startDate === slotStart,
      );

      if (!isAlreadySynced) {
        items.push({
          id: m.id,
          source: 'MEETING',
          projectId: m.projectId,
          projectTitle: m.project.title,
          title: m.title,
          description: m.description,
          eventType: 'MEETING',
          startDate: slotStart,
          endDate: m.selectedSlot.endTime.toISOString(),
          status: m.status,
        });
      }
    }

    // 4. Sort chronologically ascending by startDate, breaking ties by title
    items.sort((a, b) => {
      const diff =
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      if (diff !== 0) return diff;
      return a.title.localeCompare(b.title);
    });

    return items;
  }
}
