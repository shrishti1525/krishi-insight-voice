import apiClient from './client'

export const updateSettings = (data) => apiClient.post('/settings', data)