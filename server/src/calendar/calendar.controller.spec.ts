import { Test, TestingModule } from '@nestjs/testing';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { EventType } from '@prisma/client';

describe('CalendarController', () => {
  let controller: CalendarController;

  const mockCalendarService = {
    getUnifiedFeed: jest.fn(),
    createEvent: jest.fn(),
    getProjectEvents: jest.fn(),
    getEventById: jest.fn(),
    deleteEvent: jest.fn(),
  };

  const mockUser: AuthenticatedUser = {
    userId: 'u-ctrl-1',
    email: 'cal@uni.edu',
    role: 'STUDENT',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CalendarController],
      providers: [{ provide: CalendarService, useValue: mockCalendarService }],
    }).compile();

    controller = module.get<CalendarController>(CalendarController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getUnifiedFeed should delegate to service.getUnifiedFeed', async () => {
    const query = { startDate: '2026-10-01T00:00:00Z' };
    mockCalendarService.getUnifiedFeed.mockResolvedValue([]);

    const result = await controller.getUnifiedFeed(mockUser, query);

    expect(result).toEqual([]);
    expect(mockCalendarService.getUnifiedFeed).toHaveBeenCalledWith(
      'u-ctrl-1',
      query,
    );
  });

  it('createEvent should delegate to service.createEvent', async () => {
    const dto = {
      title: 'Milestone 1',
      eventType: EventType.MILESTONE,
      startDate: '2026-10-15T10:00:00Z',
    };
    mockCalendarService.createEvent.mockResolvedValue({ id: 'evt-1' });

    const result = await controller.createEvent(mockUser, 'proj-1', dto);

    expect(result).toEqual({ id: 'evt-1' });
    expect(mockCalendarService.createEvent).toHaveBeenCalledWith(
      'u-ctrl-1',
      'proj-1',
      dto,
    );
  });

  it('getProjectEvents should delegate to service.getProjectEvents', async () => {
    const query = {};
    mockCalendarService.getProjectEvents.mockResolvedValue([{ id: 'evt-1' }]);

    const result = await controller.getProjectEvents(mockUser, 'proj-1', query);

    expect(result).toEqual([{ id: 'evt-1' }]);
    expect(mockCalendarService.getProjectEvents).toHaveBeenCalledWith(
      'u-ctrl-1',
      'proj-1',
      query,
    );
  });

  it('getEventById should delegate to service.getEventById', async () => {
    mockCalendarService.getEventById.mockResolvedValue({ id: 'evt-99' });

    const result = await controller.getEventById(mockUser, 'evt-99');

    expect(result).toEqual({ id: 'evt-99' });
    expect(mockCalendarService.getEventById).toHaveBeenCalledWith(
      'u-ctrl-1',
      'evt-99',
    );
  });

  it('deleteEvent should delegate to service.deleteEvent', async () => {
    mockCalendarService.deleteEvent.mockResolvedValue({ deleted: true });

    const result = await controller.deleteEvent(mockUser, 'evt-99');

    expect(result).toEqual({ deleted: true });
    expect(mockCalendarService.deleteEvent).toHaveBeenCalledWith(
      'u-ctrl-1',
      'evt-99',
    );
  });
});
