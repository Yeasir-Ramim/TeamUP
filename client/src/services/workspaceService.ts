import { api } from '../api/client';

export interface WorkspaceMember {
  id: string;
  userId: string;
  userName: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  joinedAt: string;
}

export interface WorkspaceProject {
  id: string;
  title: string;
  description: string;
  domain: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';
  members: WorkspaceMember[];
  stats: {
    totalTasks: number;
    completedTasks: number;
    todoTasks: number;
    inProgressTasks: number;
    unreadMessages: number;
    filesCount: number;
  };
}

export const workspaceService = {
  /**
   * Get workspace overview for a project
   */
  getWorkspaceOverview: (projectId: string): Promise<WorkspaceProject> => {
    return api.get<WorkspaceProject>(`/projects/${projectId}/workspace`);
  },

  /**
   * Get all team members
   */
  getTeamMembers: (projectId: string): Promise<WorkspaceMember[]> => {
    return api.get<WorkspaceMember[]>(`/projects/${projectId}/members`);
  },

  /**
   * Update member role (admin only)
   */
  updateMemberRole: (
    projectId: string,
    memberId: string,
    role: 'ADMIN' | 'MEMBER'
  ): Promise<void> => {
    return api.patch<void>(`/projects/${projectId}/members/${memberId}`, { role });
  },

  /**
   * Remove team member (admin only)
   */
  removeMember: (projectId: string, memberId: string): Promise<void> => {
    return api.delete<void>(`/projects/${projectId}/members/${memberId}`);
  },
};
