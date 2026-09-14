import { api } from '../api/client';

export interface MeetingVote {
  id: string;
  slotId: string;
  userId: string;
  createdAt?: string;
}

export interface MeetingSlot {
  id: string;
  meetingId: string;
  startTime: string;
  endTime: string;
  votes?: MeetingVote[];
  voteCount?: number;
  hasVoted?: boolean;
}

export interface Meeting {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: 'VOTING' | 'CONFIRMED' | 'CANCELLED';
  selectedSlotId?: string;
  selectedSlot?: MeetingSlot;
  slots: MeetingSlot[];
  createdAt: string;
}

export interface CreateMeetingSlotDto {
  startTime: string;
  endTime: string;
}

export interface CreateMeetingDto {
  projectId: string;
  title: string;
  description?: string;
  slots: CreateMeetingSlotDto[];
}

export const schedulerService = {
  /**
   * Fetch meetings for a specific project
   */
  getProjectMeetings: async (projectId: string): Promise<Meeting[]> => {
    try {
      const res = await api.get<Meeting[]>(`/projects/${projectId}/meetings`);
      return res || [];
    } catch {
      return [];
    }
  },

  /**
   * Propose a new meeting with time slots
   */
  createMeeting: async (dto: CreateMeetingDto): Promise<Meeting> => {
    return api.post<Meeting>(`/projects/${dto.projectId}/meetings`, {
      title: dto.title,
      description: dto.description,
      slots: dto.slots,
    });
  },

  /**
   * Vote on a time slot for a meeting
   */
  voteSlot: async (meetingId: string, slotId: string): Promise<{ success: boolean; slot: MeetingSlot }> => {
    return api.post<{ success: boolean; slot: MeetingSlot }>(`/meetings/${meetingId}/vote`, {
      slotId,
    });
  },

  /**
   * Confirm a winning meeting slot
   */
  confirmMeetingSlot: async (meetingId: string, slotId: string): Promise<Meeting> => {
    return api.post<Meeting>(`/meetings/${meetingId}/confirm`, {
      slotId,
    });
  },
};
