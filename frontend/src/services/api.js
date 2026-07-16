import axios from 'axios'

export const API_BASE_URL = 'http://127.0.0.1:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fleetflow_token')

  if (token) {
    if (typeof config.headers?.set === 'function') {
      config.headers.set('Authorization', `Bearer ${token}`)
    } else {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error),
)

export const authService = {
  login(payload) {
    return api.post('/auth/login', payload)
  },
  register(payload) {
    return api.post('/auth/register', payload)
  },
  logout() {
    clearStoredAuth()
  },
}

export function clearStoredAuth() {
  localStorage.removeItem('fleetflow_token')
  localStorage.removeItem('fleetflow_user')
}

export const driverService = {
  getAll() {
    return api.get('/drivers/')
  },
  getById(id) {
    return api.get(`/drivers/${id}`)
  },
  create(payload) {
    return api.post('/drivers/', payload)
  },
  update(id, payload) {
    return api.put(`/drivers/${id}`, payload)
  },
  remove(id) {
    return api.delete(`/drivers/${id}`)
  },
}

export const vehicleService = {
  getAll() {
    return api.get('/vehicles/')
  },
  getById(id) {
    return api.get(`/vehicles/${id}`)
  },
  create(payload) {
    return api.post('/vehicles/', payload)
  },
  update(id, payload) {
    return api.put(`/vehicles/${id}`, payload)
  },
  remove(id) {
    return api.delete(`/vehicles/${id}`)
  },
}

export const shipmentService = {
  getAll() {
    return api.get('/shipments/')
  },
  getById(id) {
    return api.get(`/shipments/${id}`)
  },
  create(payload) {
    return api.post('/shipments/', payload)
  },
  update(id, payload) {
    return api.put(`/shipments/${id}`, payload)
  },
  remove(id) {
    return api.delete(`/shipments/${id}`)
  },
}

export const tripService = {
  getAll() {
    return api.get('/trips/')
  },
  getById(id) {
    return api.get(`/trips/${id}`)
  },
  create(payload) {
    return api.post('/trips/', payload)
  },
  update(id, payload) {
    return api.put(`/trips/${id}`, payload)
  },
  remove(id) {
    return api.delete(`/trips/${id}`)
  },
}

export const userService = {
  getAll() {
    return api.get('/users/')
  },
  update(id, payload) {
    return api.put(`/users/${id}`, payload)
  },
  remove(id) {
    return api.delete(`/users/${id}`)
  },
}



export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('fleetflow_token', token)
    return
  }

  localStorage.removeItem('fleetflow_token')
}

export function getAuthToken() {
  return localStorage.getItem('fleetflow_token')
}

export function getStoredUser() {
  const rawUser = localStorage.getItem('fleetflow_user')

  if (!rawUser) {
    return null
  }

  try {
    return JSON.parse(rawUser)
  } catch {
    return null
  }
}

export function setStoredUser(user) {
  if (user) {
    localStorage.setItem('fleetflow_user', JSON.stringify(user))
    return
  }

  localStorage.removeItem('fleetflow_user')
}

export function getApiErrorMessage(error, fallbackMessage = 'Request failed.') {
  const detail = error?.response?.data?.detail || error?.response?.data?.message || fallbackMessage

  return Array.isArray(detail) ? detail[0] : detail
}

export default api