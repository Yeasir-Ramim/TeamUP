import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CalendarView } from '../components/CalendarView';
import { ThemeProvider } from '../theme/ThemeContext';
import { calendarService, CalendarEvent } from '../services/calendarService';
import * as Haptics from 'expo-haptics';

jest.mock('../api/client', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));

describe('Calendar & Deadlines (Phase 9 - Feature 9)', () => {
  const todayStr = new Date().toISOString().split('T')[0];
  const mockEvents: CalendarEvent[] = [
    {
      id: 'evt-1',
      projectId: 'proj-101',
      title: 'Milestone 1 Deliverable',
      description: 'Submit core architecture slides.',
      eventType: 'DEADLINE',
      startDate: `${todayStr}T12:00:00Z`,
    },
    {
      id: 'evt-2',
      projectId: 'proj-101',
      title: 'Sprint Sync',
      description: 'Weekly team meeting.',
      eventType: 'MEETING',
      startDate: '2026-09-20T10:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders calendar and day agenda view for selected date', async () => {
    jest.spyOn(calendarService, 'getCalendarEvents').mockResolvedValueOnce(mockEvents);

    const { findByText } = render(
      <ThemeProvider>
        <CalendarView projectId="proj-101" />
      </ThemeProvider>
    );

    expect(await findByText(`Agenda for ${todayStr}`)).toBeTruthy();
    expect(await findByText('Milestone 1 Deliverable')).toBeTruthy();
    expect(await findByText('DEADLINE')).toBeTruthy();
  });

  it('adds a new deadline event via modal', async () => {
    jest.spyOn(calendarService, 'getCalendarEvents').mockResolvedValueOnce([]);
    const createSpy = jest.spyOn(calendarService, 'createCalendarEvent').mockResolvedValueOnce({
      id: 'evt-new',
      projectId: 'proj-101',
      title: 'Final Defense Slides',
      description: 'Prepare demo walkthrough.',
      eventType: 'DEADLINE',
      startDate: `${todayStr}T12:00:00Z`,
    });

    const { findByText, getAllByText, getByTestId } = render(
      <ThemeProvider>
        <CalendarView projectId="proj-101" />
      </ThemeProvider>
    );

    await findByText('No Events on this Date');
    const addBtn = getAllByText('+ Add Deadline')[0];
    fireEvent.press(addBtn);

    const titleInput = getByTestId('input-event-title');
    fireEvent.changeText(titleInput, 'Final Defense Slides');

    const submitBtn = getByTestId('submit-event-btn');
    fireEvent.press(submitBtn);

    expect(Haptics.impactAsync).toHaveBeenCalled();
    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Final Defense Slides',
        eventType: 'DEADLINE',
      })
    );
    expect(await findByText('Final Defense Slides')).toBeTruthy();
  });

  it('renders empty agenda state when selected date has no events', async () => {
    jest.spyOn(calendarService, 'getCalendarEvents').mockResolvedValueOnce([]);

    const { findByText } = render(
      <ThemeProvider>
        <CalendarView projectId="proj-101" />
      </ThemeProvider>
    );

    expect(await findByText('No Events on this Date')).toBeTruthy();
  });

  it('renders error state when calendar service request fails', async () => {
    jest.spyOn(calendarService, 'getCalendarEvents').mockRejectedValueOnce(new Error('Calendar service offline'));

    const { findByText } = render(
      <ThemeProvider>
        <CalendarView projectId="proj-101" />
      </ThemeProvider>
    );

    expect(await findByText('Calendar service offline')).toBeTruthy();
  });
});
