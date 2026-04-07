import { apiClient } from './client';

export interface UploadFileResponse {
  url: string;
  filename: string;
  size: number;
  mimetype: string;
}

export const uploadApi = {
  uploadFile: async (file: File): Promise<UploadFileResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post<UploadFileResponse>('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};
