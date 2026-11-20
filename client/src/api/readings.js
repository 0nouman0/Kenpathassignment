import api from './axios'

export const getReadings = (params) => api.get('/api/readings', { params })
export const createReading = (data) => api.post('/api/readings', data)
export const updateReading = (id, data) => api.put(`/api/readings/${id}`, data)
export const deleteReading = (id) => api.delete(`/api/readings/${id}`)
