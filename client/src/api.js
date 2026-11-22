export class ApiError extends Error {
  constructor(message, { status, field } = {}) {
    super(message)
    this.status = status
    this.field = field
  }
}

async function request(method, path, body) {
  let res
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'same-origin',
    })
  } catch {
    throw new ApiError('Could not reach the server. Check your connection and try again.')
  }

  if (res.status === 204) return null
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new ApiError(data.error || 'Something went wrong. Please try again.', {
      status: res.status,
      field: data.field,
    })
  }
  return data
}

const query = (params) => {
  const search = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null)
  )
  return search.toString() ? `?${search}` : ''
}

export const api = {
  me: () => request('GET', '/auth/me'),
  login: (body) => request('POST', '/auth/login', body),
  register: (body) => request('POST', '/auth/register', body),
  logout: () => request('POST', '/auth/logout'),

  listReadings: (params = {}) => request('GET', `/readings${query(params)}`),
  createReading: (body) => request('POST', '/readings', body),
  updateReading: (id, body) => request('PUT', `/readings/${id}`, body),
  deleteReading: (id) => request('DELETE', `/readings/${id}`),

  report: (kind, date) => request('GET', `/reports/${kind}${query({ date })}`),
}
