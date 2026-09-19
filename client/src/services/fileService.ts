import { api } from '../api/client';
import { ProjectFile } from '../screens/Files/FilesScreen';

export const fileService = {
  /**
   * Get all files for a project
   */
  getProjectFiles: (projectId: string): Promise<ProjectFile[]> => {
    return api.get<ProjectFile[]>(`/projects/${projectId}/files`);
  },

  /**
   * Upload a file to a project
   * Note: Use FormData for file upload in the component
   */
  uploadFile: (projectId: string, formData: FormData): Promise<ProjectFile> => {
    return api.post<ProjectFile>(`/projects/${projectId}/files`, formData);
  },

  /**
   * Delete a file
   */
  deleteFile: (fileId: string): Promise<void> => {
    return api.delete<void>(`/files/${fileId}`);
  },

  /**
   * Get file download URL
   */
  getDownloadUrl: (fileId: string): Promise<{ url: string }> => {
    return api.get<{ url: string }>(`/files/${fileId}/download`);
  },
};
