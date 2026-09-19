import { api } from '../api/client';
import { ProjectListing } from '../components/ProjectCard';

export interface CreateProjectPayload {
  title: string;
  description: string;
  domain: string;
  semester: string;
  requiredSkills: string[];
  techStack: string[];
  maxMembers: number;
}

export interface ProjectDetails extends ProjectListing {
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  members: {
    id: string;
    userId: string;
    userName: string;
    role: 'OWNER' | 'ADMIN' | 'MEMBER';
    joinedAt: string;
  }[];
}

export interface ProjectFilters {
  search?: string;
  domain?: string;
  techStack?: string[];
  status?: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';
  semester?: string;
}

export const marketplaceService = {
  /**
   * Search/browse projects with filters
   */
  searchProjects: (filters: ProjectFilters = {}): Promise<ProjectListing[]> => {
    return api.get<ProjectListing[]>('/projects/search', filters);
  },

  /**
   * Get detailed project information
   */
  getProjectDetails: (projectId: string): Promise<ProjectDetails> => {
    return api.get<ProjectDetails>(`/projects/${projectId}`);
  },

  /**
   * Create a new project
   */
  createProject: (payload: CreateProjectPayload): Promise<{ id: string }> => {
    return api.post<{ id: string }>('/projects', payload);
  },

  /**
   * Update project information (only by owner/admin)
   */
  updateProject: (projectId: string, payload: Partial<CreateProjectPayload>): Promise<void> => {
    return api.patch<void>(`/projects/${projectId}`, payload);
  },

  /**
   * Delete project (only by owner)
   */
  deleteProject: (projectId: string): Promise<void> => {
    return api.delete<void>(`/projects/${projectId}`);
  },

  /**
   * Request to join a project
   */
  requestToJoin: (projectId: string, message?: string): Promise<void> => {
    return api.post<void>(`/projects/${projectId}/join-request`, { message });
  },

  /**
   * Leave a project
   */
  leaveProject: (projectId: string): Promise<void> => {
    return api.post<void>(`/projects/${projectId}/leave`);
  },

  /**
   * Invite a user to join project (admin only)
   */
  inviteUser: (projectId: string, userId: string): Promise<void> => {
    return api.post<void>(`/projects/${projectId}/invite`, { userId });
  },

  /**
   * Get user's own projects
   */
  getMyProjects: (): Promise<ProjectListing[]> => {
    return api.get<ProjectListing[]>('/projects/my-projects');
  },
};
