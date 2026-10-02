import { api } from '../api/client';
import { ChatMessage, DirectMessagePayload } from './socketService';

export const chatService = {
  /**
   * Get message history for a project via REST
   */
  getProjectMessages: async (projectId: string): Promise<ChatMessage[]> => {
    return api.get<ChatMessage[]>(`/projects/${projectId}/messages`);
  },

  /**
   * Get direct message history with a specific user via REST
   */
  getDirectMessages: async (targetUserId: string): Promise<DirectMessagePayload[]> => {
    return api.get<DirectMessagePayload[]>(`/direct-messages/${encodeURIComponent(targetUserId)}`);
  },

  /**
   * Get all active DM conversations for the current user
   */
  getDirectConversations: async (): Promise<any[]> => {
    return api.get<any[]>('/direct-messages/conversations');
  },
};

