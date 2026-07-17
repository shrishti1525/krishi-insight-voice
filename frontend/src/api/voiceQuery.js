import apiClient from './client'

export const sendVoiceQuery = (formData) =>
  apiClient.post('/voice-query', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })