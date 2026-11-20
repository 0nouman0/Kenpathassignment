import api from './axios'

export const getDaily = (date) => api.get('/api/reports/daily', { params: { date } })
export const getMonthToDate = (date) => api.get('/api/reports/month-to-date', { params: { date } })
export const getMonthly = (date) => api.get('/api/reports/monthly', { params: { date } })
