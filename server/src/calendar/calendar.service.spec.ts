import { Test, TestingModule } from '@nestjs/testing';
import { CalendarService } from './calendar.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import {
  EventType,
  MemberStatus,
  ProjectRole,
  TaskStatus,
  Priority,
  MeetingStatus,
} from '@prisma/client';

describe('CalendarService', () => {
  let service: CalendarService;

  const mockPrismaService = {
    project: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    projectMember: {
      findMany: jest.fn(),
    },
    calendarEvent: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    task: {
      findMany: jest.fn(),
    },
    meeting: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalendarService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<CalendarService>(CalendarService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createEvent', () => {
    const validDto = {
      title: 'Milestone 1 Deliverable',
      description: 'Submit initial architectural prototype',
      eventType: EventType.MILESTONE,
      startDate: '2026-10-15T10:00:00.000Z',
      endDate: '2026-10-15T18:00:00.000Z',
    };

    it('should successfully create event for accepted project member', async () => {
      mockPrismaService.project.findUnique.mockResolvedValue({
        id: 'proj-1',
        creatorId: 'user-1',
        members: [{ userId: 'user-1', status: MemberStatus.ACCEPTED }],
      });

      const created = { id: 'evt-1', projectId: 'proj-1', ...validDto };
      mockPrismaService.calendarEvent.create.mockResolvedValue(created);

      const result = await service.createEvent('user-1', 'proj-1', validDto);

      expect(result).toEqual(created);
      expect(mockPrismaService.calendarEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          projectId: 'proj-1',
          title: validDto.title,
          eventType: EventType.MILESTONE,
        }),
        include: {
          project: { select: { id: true, title: true } },
        },
      });
    });

    it('should throw NotFoundException if project not found', async () => {
      mockPrismaService.project.findUnique.mockResolvedValue(null);

      await expect(
        service.createEvent('user-1', 'ghost-proj', validDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not an accepted member', async () => {
      mockPrismaService.project.findUnique.mockResolvedValue({
        id: 'proj-1',
        creatorId: 'creator-99',
        members: [{ userId: 'member-88', status: MemberStatus.ACCEPTED }],
      });

      await expect(
        service.createEvent('outsider-user', 'proj-1', validDto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if startDate >= endDate', async () => {
      mockPrismaService.project.findUnique.mockResolvedValue({
        id: 'proj-1',
        creatorId: 'user-1',
        members: [{ userId: 'user-1', status: MemberStatus.ACCEPTED }],
      });

      await expect(
        service.createEvent('user-1', 'proj-1', {
          ...validDto,
          startDate: '2026-10-15T18:00:00.000Z',
          endDate: '2026-10-15T10:00:00.000Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getProjectEvents', () => {
    it('should return list of events for project member', async () => {
      mockPrismaService.project.findUnique.mockResolvedValue({
        id: 'proj-1',
        creatorId: 'user-1',
        members: [{ userId: 'user-1', status: MemberStatus.ACCEPTED }],
      });

      const events = [{ id: 'evt-1', title: 'Event 1' }];
      mockPrismaService.calendarEvent.findMany.mockResolvedValue(events);

      const result = await service.getProjectEvents('user-1', 'proj-1');

      expect(result).toEqual(events);
    });

    it('should throw ForbiddenException for non-member', async () => {
      mockPrismaService.project.findUnique.mockResolvedValue({
        id: 'proj-1',
        creatorId: 'user-1',
        members: [{ userId: 'user-1', status: MemberStatus.ACCEPTED }],
      });

      await expect(
        service.getProjectEvents('outsider', 'proj-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getEventById', () => {
    it('should return event details for project member', async () => {
      mockPrismaService.calendarEvent.findUnique.mockResolvedValue({
        id: 'evt-1',
        title: 'Midterm Demo',
        project: {
          id: 'proj-1',
          creatorId: 'user-1',
          members: [{ userId: 'user-1', status: MemberStatus.ACCEPTED }],
        },
      });

      const result = await service.getEventById('user-1', 'evt-1');

      expect(result.id).toBe('evt-1');
    });

    it('should throw NotFoundException if event does not exist', async () => {
      mockPrismaService.calendarEvent.findUnique.mockResolvedValue(null);

      await expect(service.getEventById('u-1', 'ghost-evt')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteEvent', () => {
    it('should allow project leader to delete event', async () => {
      mockPrismaService.calendarEvent.findUnique.mockResolvedValue({
        id: 'evt-1',
        project: {
          id: 'proj-1',
          creatorId: 'user-leader',
          members: [
            {
              userId: 'user-leader',
              role: ProjectRole.LEADER,
              status: MemberStatus.ACCEPTED,
            },
          ],
        },
      });
      mockPrismaService.calendarEvent.delete.mockResolvedValue({ id: 'evt-1' });

      const result = await service.deleteEvent('user-leader', 'evt-1');

      expect(result.deleted).toBe(true);
      expect(mockPrismaService.calendarEvent.delete).toHaveBeenCalledWith({
        where: { id: 'evt-1' },
      });
    });

    it('should throw ForbiddenException if regular member tries to delete event', async () => {
      mockPrismaService.calendarEvent.findUnique.mockResolvedValue({
        id: 'evt-1',
        project: {
          id: 'proj-1',
          creatorId: 'user-leader',
          members: [
            {
              userId: 'user-member',
              role: ProjectRole.MEMBER,
              status: MemberStatus.ACCEPTED,
            },
          ],
        },
      });

      await expect(service.deleteEvent('user-member', 'evt-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('getUnifiedFeed', () => {
    it('should aggregate and chronologically sort events, tasks, and meetings', async () => {
      mockPrismaService.projectMember.findMany.mockResolvedValue([
        { projectId: 'proj-1' },
      ]);
      mockPrismaService.project.findMany.mockResolvedValue([]);

      const mockEvents = [
        {
          id: 'evt-1',
          projectId: 'proj-1',
          project: { id: 'proj-1', title: 'Robotics Project' },
          title: 'Final Report Submission',
          description: 'Submit PDF to portal',
          eventType: EventType.DEADLINE,
          startDate: new Date('2026-10-20T23:59:00Z'),
          endDate: null,
        },
      ];

      const mockTasks = [
        {
          id: 'task-1',
          projectId: 'proj-1',
          project: { id: 'proj-1', title: 'Robotics Project' },
          title: 'Assemble Chassis',
          description: 'Mount motors and wheels',
          dueDate: new Date('2026-10-10T12:00:00Z'),
          priority: Priority.HIGH,
          status: TaskStatus.IN_PROGRESS,
          assigneeId: 'u-1',
        },
      ];

      const mockMeetings = [
        {
          id: 'meet-1',
          projectId: 'proj-1',
          project: { id: 'proj-1', title: 'Robotics Project' },
          title: 'Sprint Retrospective',
          description: 'Sprint 2 review',
          status: MeetingStatus.CONFIRMED,
          selectedSlot: {
            startTime: new Date('2026-10-05T15:00:00Z'),
            endTime: new Date('2026-10-05T16:00:00Z'),
          },
        },
      ];

      mockPrismaService.calendarEvent.findMany.mockResolvedValue(mockEvents);
      mockPrismaService.task.findMany.mockResolvedValue(mockTasks);
      mockPrismaService.meeting.findMany.mockResolvedValue(mockMeetings);

      const feed = await service.getUnifiedFeed('u-1');

      expect(feed.length).toBe(3);
      // Verify ascending chronological order: Oct 5 (meeting), Oct 10 (task), Oct 20 (event)
      expect(feed[0].source).toBe('MEETING');
      expect(feed[0].startDate).toBe('2026-10-05T15:00:00.000Z');

      expect(feed[1].source).toBe('TASK');
      expect(feed[1].startDate).toBe('2026-10-10T12:00:00.000Z');

      expect(feed[2].source).toBe('CALENDAR_EVENT');
      expect(feed[2].startDate).toBe('2026-10-20T23:59:00.000Z');
    });

    it('should return empty array if user belongs to no projects', async () => {
      mockPrismaService.projectMember.findMany.mockResolvedValue([]);
      mockPrismaService.project.findMany.mockResolvedValue([]);

      const feed = await service.getUnifiedFeed('lonely-user');

      expect(feed).toEqual([]);
    });

    it('should filter tasks and events by date range (startDate and endDate)', async () => {
      mockPrismaService.projectMember.findMany.mockResolvedValue([
        { projectId: 'proj-1' },
      ]);
      mockPrismaService.project.findMany.mockResolvedValue([]);
      mockPrismaService.calendarEvent.findMany.mockResolvedValue([]);
      mockPrismaService.task.findMany.mockResolvedValue([]);
      mockPrismaService.meeting.findMany.mockResolvedValue([]);

      await service.getUnifiedFeed('u-1', {
        startDate: '2026-10-01T00:00:00.000Z',
        endDate: '2026-10-31T23:59:59.000Z',
      });

      expect(mockPrismaService.task.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          dueDate: expect.objectContaining({
            gte: expect.any(Date),
            lte: expect.any(Date),
          }),
        }),
        include: expect.any(Object),
      });
    });

    it('should throw ForbiddenException if querying specific project user is not a member of', async () => {
      mockPrismaService.projectMember.findMany.mockResolvedValue([
        { projectId: 'proj-1' },
      ]);
      mockPrismaService.project.findMany.mockResolvedValue([]);

      await expect(
        service.getUnifiedFeed('u-1', { projectId: 'other-proj-99' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
