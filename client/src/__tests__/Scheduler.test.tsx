import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SchedulerScreen } from '../screens/Scheduler/SchedulerScreen';
import { ThemeProvider } from '../theme/ThemeContext';
import { schedulerService, Meeting } from '../services/schedulerService';
import * as Haptics from 'expo-haptics';

jest.mock('../api/client', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
}));

describe('Meeting Scheduler (Phase 8 - Feature 8)', () => {
  const mockMeetings: Meeting[] = [
    {
      id: 'mtg-1',
      projectId: 'proj-101',
      title: 'Architecture & Schema Review',
      description: 'Discuss PostgreSQL schema and NestJS modules.',
      status: 'VOTING',
      slots: [
        {
          id: 'slot-1',
          meetingId: 'mtg-1',
          startTime: '2026-09-16T10:00:00Z',
          endTime: '2026-09-16T11:00:00Z',
          voteCount: 2,
          hasVoted: false,
        },
        {
          id: 'slot-2',
          meetingId: 'mtg-1',
          startTime: '2026-09-16T14:00:00Z',
          endTime: '2026-09-16T15:00:00Z',
          voteCount: 1,
          hasVoted: false,
        },
      ],
      createdAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders meetings list and candidate time slots', async () => {
    jest.spyOn(schedulerService, 'getProjectMeetings').mockResolvedValueOnce(mockMeetings);

    const { findByText } = render(
      <ThemeProvider>
        <SchedulerScreen projectId="proj-101" />
      </ThemeProvider>
    );

    expect(await findByText('Meeting Scheduler')).toBeTruthy();
    expect(await findByText('Architecture & Schema Review')).toBeTruthy();
    expect(await findByText('2 votes')).toBeTruthy();
  });

  it('handles voting on a candidate time slot', async () => {
    jest.spyOn(schedulerService, 'getProjectMeetings').mockResolvedValueOnce(mockMeetings);
    const voteSpy = jest.spyOn(schedulerService, 'voteSlot').mockResolvedValueOnce({
      success: true,
      slot: { ...mockMeetings[0].slots[0], voteCount: 3, hasVoted: true },
    });

    const { findByText, getByTestId } = render(
      <ThemeProvider>
        <SchedulerScreen projectId="proj-101" />
      </ThemeProvider>
    );

    await findByText('Architecture & Schema Review');
    const voteBtn = getByTestId('vote-btn-slot-1');
    fireEvent.press(voteBtn);

    expect(Haptics.impactAsync).toHaveBeenCalled();
    expect(voteSpy).toHaveBeenCalledWith('mtg-1', 'slot-1');
    expect(await findByText('3 votes')).toBeTruthy();
  });

  it('confirms a winning meeting slot and updates meeting state', async () => {
    jest.spyOn(schedulerService, 'getProjectMeetings').mockResolvedValueOnce(mockMeetings);
    const confirmSpy = jest.spyOn(schedulerService, 'confirmMeetingSlot').mockResolvedValueOnce({
      ...mockMeetings[0],
      status: 'CONFIRMED',
      selectedSlotId: 'slot-1',
      selectedSlot: mockMeetings[0].slots[0],
    });
    const onConfirmCallback = jest.fn();

    const { findByText, getByTestId } = render(
      <ThemeProvider>
        <SchedulerScreen projectId="proj-101" onMeetingConfirmed={onConfirmCallback} />
      </ThemeProvider>
    );

    await findByText('Architecture & Schema Review');
    const confirmBtn = getByTestId('confirm-btn-slot-1');
    fireEvent.press(confirmBtn);

    expect(confirmSpy).toHaveBeenCalledWith('mtg-1', 'slot-1');
    expect(await findByText(/Confirmed:/i)).toBeTruthy();
    expect(onConfirmCallback).toHaveBeenCalled();
  });

  it('proposes a new meeting with candidate slots', async () => {
    jest.spyOn(schedulerService, 'getProjectMeetings').mockResolvedValueOnce([]);
    const createSpy = jest.spyOn(schedulerService, 'createMeeting').mockResolvedValueOnce({
      id: 'mtg-new',
      projectId: 'proj-101',
      title: 'Sprint Retrospective',
      status: 'VOTING',
      slots: [
        {
          id: 's-1',
          meetingId: 'mtg-new',
          startTime: '2026-09-15T10:00:00Z',
          endTime: '2026-09-15T11:00:00Z',
          voteCount: 0,
        },
      ],
      createdAt: new Date().toISOString(),
    });

    const { findByText, getByText, getByTestId } = render(
      <ThemeProvider>
        <SchedulerScreen projectId="proj-101" />
      </ThemeProvider>
    );

    await findByText('No Meetings Scheduled');
    const proposeBtn = getByText('+ Propose Meeting');
    fireEvent.press(proposeBtn);

    const titleInput = getByTestId('input-meeting-title');
    fireEvent.changeText(titleInput, 'Sprint Retrospective');

    const submitBtn = getByTestId('submit-propose-btn');
    fireEvent.press(submitBtn);

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Sprint Retrospective',
      })
    );
    expect(await findByText('Sprint Retrospective')).toBeTruthy();
  });

  it('renders empty state when no meetings exist', async () => {
    jest.spyOn(schedulerService, 'getProjectMeetings').mockResolvedValueOnce([]);

    const { findByText } = render(
      <ThemeProvider>
        <SchedulerScreen projectId="proj-101" />
      </ThemeProvider>
    );

    expect(await findByText('No Meetings Scheduled')).toBeTruthy();
  });

  it('renders error state when fetching meetings fails', async () => {
    jest.spyOn(schedulerService, 'getProjectMeetings').mockRejectedValueOnce(new Error('Connection error'));

    const { findByText } = render(
      <ThemeProvider>
        <SchedulerScreen projectId="proj-101" />
      </ThemeProvider>
    );

    expect(await findByText('Connection error')).toBeTruthy();
  });
});
