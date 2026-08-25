const TOKEN_KEY = 'token'
const USER_KEY = 'user'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY)
}

export function saveAuth(token, user, remember) {
  const storage = remember ? localStorage : sessionStorage
  const otherStorage = remember ? sessionStorage : localStorage
  otherStorage.removeItem(TOKEN_KEY)
  otherStorage.removeItem(USER_KEY)
  storage.setItem(TOKEN_KEY, token)
  storage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(USER_KEY)
}

export function getCurrentUser() {
  const raw = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY)
  return raw ? JSON.parse(raw) : null
}

export function updateCurrentUser(user) {
  const storage = localStorage.getItem(TOKEN_KEY) ? localStorage : sessionStorage
  storage.setItem(USER_KEY, JSON.stringify(user))
}
