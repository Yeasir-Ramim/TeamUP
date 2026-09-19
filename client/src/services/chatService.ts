import { api } from '../api/client';
import { ChatMessage } from '../screens/TeamChat/TeamChatScreen';

export const chatService = {
  /**
   * Get message history for a project
   * @param projectId - The project ID
   * @param limit - Optional limit for number of messages (default: 50)
   */
  getMessages: (projectId: string, limit: number = 50): Promise<ChatMessage[]> => {
    return api.get<ChatMessage[]>(`/projects/${projectId}/messages`, { limit });
  },

  /**
   * Send a chat message (REST fallback, WebSocket preferred)
   */
  sendMessage: (projectId: string, content: string): Promise<ChatMessage> => {
    return api.post<ChatMessage>(`/projects/${projectId}/messages`, { content });
  },

  /**
   * Delete a message (only own messages)
   */
  deleteMessage: (messageId: string): Promise<void> => {
    return api.delete<void>(`/messages/${messageId}`);
  },

  /**
   * Mark messages as read
   */
  markAsRead: (projectId: string): Promise<void> => {
    return api.post<void>(`/projects/${projectId}/messages/mark-read`);
  },
};
