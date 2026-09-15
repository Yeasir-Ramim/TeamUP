import { Test, TestingModule } from '@nestjs/testing';
import { MeetingsController } from './meetings.controller';
import { MeetingsService } from './meetings.service';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';

describe('MeetingsController', () => {
  let controller: MeetingsController;

  const mockMeetingsService = {
    createMeeting: jest.fn(),
    getProjectMeetings: jest.fn(),
    getMeetingById: jest.fn(),
    voteSlots: jest.fn(),
    manualFinalize: jest.fn(),
    cancelMeeting: jest.fn(),
  };

  const mockUser: AuthenticatedUser = {
    userId: 'user-ctrl-1',
    email: 'ctrl@uni.edu',
    role: 'STUDENT',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MeetingsController],
      providers: [{ provide: MeetingsService, useValue: mockMeetingsService }],
    }).compile();

    controller = module.get<MeetingsController>(MeetingsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('createMeeting should delegate to service.createMeeting', async () => {
    const dto = {
      title: 'Sync',
      slots: [
        { startTime: '2026-10-01T10:00:00Z', endTime: '2026-10-01T11:00:00Z' },
        { startTime: '2026-10-01T12:00:00Z', endTime: '2026-10-01T13:00:00Z' },
      ],
    };
    mockMeetingsService.createMeeting.mockResolvedValue({ id: 'meet-1' });

    const result = await controller.createMeeting(mockUser, 'proj-1', dto);

    expect(result).toEqual({ id: 'meet-1' });
    expect(mockMeetingsService.createMeeting).toHaveBeenCalledWith(
      'user-ctrl-1',
      'proj-1',
      dto,
    );
  });

  it('getProjectMeetings should delegate to service.getProjectMeetings', async () => {
    mockMeetingsService.getProjectMeetings.mockResolvedValue([{ id: 'm-1' }]);

    const result = await controller.getProjectMeetings(mockUser, 'proj-1');

    expect(result).toEqual([{ id: 'm-1' }]);
    expect(mockMeetingsService.getProjectMeetings).toHaveBeenCalledWith(
      'user-ctrl-1',
      'proj-1',
    );
  });

  it('getMeetingById should delegate to service.getMeetingById', async () => {
    mockMeetingsService.getMeetingById.mockResolvedValue({ id: 'meet-99' });

    const result = await controller.getMeetingById(mockUser, 'meet-99');

    expect(result).toEqual({ id: 'meet-99' });
    expect(mockMeetingsService.getMeetingById).toHaveBeenCalledWith(
      'user-ctrl-1',
      'meet-99',
    );
  });

  it('voteSlots should delegate to service.voteSlots', async () => {
    const dto = { slotIds: ['slot-1'] };
    mockMeetingsService.voteSlots.mockResolvedValue({ status: 'VOTING' });

    const result = await controller.voteSlots(mockUser, 'meet-1', dto);

    expect(result).toEqual({ status: 'VOTING' });
    expect(mockMeetingsService.voteSlots).toHaveBeenCalledWith(
      'user-ctrl-1',
      'meet-1',
      dto,
    );
  });

  it('finalizeMeeting should delegate to service.manualFinalize', async () => {
    const dto = { slotId: 'slot-1' };
    mockMeetingsService.manualFinalize.mockResolvedValue({
      status: 'CONFIRMED',
    });

    const result = await controller.finalizeMeeting(mockUser, 'meet-1', dto);

    expect(result).toEqual({ status: 'CONFIRMED' });
    expect(mockMeetingsService.manualFinalize).toHaveBeenCalledWith(
      'user-ctrl-1',
      'meet-1',
      dto,
    );
  });

  it('cancelMeeting should delegate to service.cancelMeeting', async () => {
    mockMeetingsService.cancelMeeting.mockResolvedValue({
      status: 'CANCELLED',
    });

    const result = await controller.cancelMeeting(mockUser, 'meet-1');

    expect(result).toEqual({ status: 'CANCELLED' });
    expect(mockMeetingsService.cancelMeeting).toHaveBeenCalledWith(
      'user-ctrl-1',
      'meet-1',
    );
  });
});
