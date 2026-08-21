/**
 * Centralized WebSocket connection URL generator for FleetFlow.
 * Automatically resolves development and production WebSocket endpoints (ws:// or wss://).
 */
export const getWebSocketUrl = (path = '') => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  // 1. Explicit WebSocket URL from environment variable
  if (import.meta.env.VITE_WS_URL) {
    const baseUrl = import.meta.env.VITE_WS_URL.replace(/\/+$/, '');
    return `${baseUrl}${cleanPath}`;
  }

  // 2. Derive from API URL if provided
  if (import.meta.env.VITE_API_URL) {
    const apiUrl = import.meta.env.VITE_API_URL.replace(/\/+$/, '');
    const wsBase = apiUrl.replace(/^http(s?):\/\//i, (match, s) => (s ? 'wss://' : 'ws://'));
    return `${wsBase}${cleanPath}`;
  }

  // 3. Fallback dynamically based on browser location
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const wsProtocol = isHttps ? 'wss:' : 'ws:';
  const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const port = typeof window !== 'undefined' && window.location.port === '5173' ? '8000' : (typeof window !== 'undefined' ? window.location.port : '8000');
  
  const hostPort = port ? `${host}:${port}` : host;
  return `${wsProtocol}//${hostPort}${cleanPath}`;
};

export default getWebSocketUrl;
