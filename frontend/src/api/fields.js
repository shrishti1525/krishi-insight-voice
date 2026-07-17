import apiClient from './client'

export const getFields = () => apiClient.get('/fields')
export const getFieldHistory = (id) => apiClient.get(`/fields/${id}/history`)