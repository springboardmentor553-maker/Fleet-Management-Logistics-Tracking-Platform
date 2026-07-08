import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ff_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const data = err.response?.data
    let msg = err.message
    if (data) {
      if (typeof data.detail === 'string') {
        msg = data.detail
      } else if (Array.isArray(data.detail)) {
        // Pydantic validation errors — join all messages
        msg = data.detail.map((e) => `${e.loc?.slice(1).join('.')}: ${e.msg}`).join(' | ')
      }
    }
    // Token expired — clear session and reload to login
    if (err.response?.status === 401) {
      localStorage.removeItem('ff_token')
      window.location.reload()
    }
    return Promise.reject(new Error(msg))
  }
)

export default api
