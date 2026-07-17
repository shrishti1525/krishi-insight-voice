import apiClient from './client'

export const analyzeCropImage = (formData) =>
  apiClient.post('/crop-health', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })