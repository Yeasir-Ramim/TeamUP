import { api } from '../api/client';

export interface CalendarEvent {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  eventType: 'MEETING' | 'DEADLINE' | 'MILESTONE';
  startDate: string;
  endDate?: string;
  createdAt?: string;
}

export interface CreateCalendarEventDto {
  projectId: string;
  title: string;
  description?: string;
  eventType: 'MEETING' | 'DEADLINE' | 'MILESTONE';
  startDate: string;
  endDate?: string;
}

export const calendarService = {
  /**
   * Fetch calendar events (meetings, deadlines, milestones) for a project
   */
  getCalendarEvents: async (projectId: string): Promise<CalendarEvent[]> => {
    try {
      const res = await api.get<CalendarEvent[]>(`/projects/${projectId}/calendar`);
      return res || [];
    } catch {
      return [];
    }
  },

  /**
   * Create a new deadline or calendar event
   */
  createCalendarEvent: async (dto: CreateCalendarEventDto): Promise<CalendarEvent> => {
    return api.post<CalendarEvent>(`/projects/${dto.projectId}/calendar`, {
      title: dto.title,
      description: dto.description,
      eventType: dto.eventType,
      startDate: dto.startDate,
      endDate: dto.endDate,
    });
  },
};
