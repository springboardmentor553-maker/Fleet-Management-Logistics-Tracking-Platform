/**
 * useTripWebSocket — frontend/src/hooks/useTripWebSocket.js
 *
 * Custom React hook for real-time trip tracking via WebSocket.
 *
 * Connects to:
 *   ws://localhost:8000/ws/tracking/{tripId}?token=<jwt>
 *
 * Features
 * --------
 * - Automatic reconnect with exponential back-off (up to 5 attempts)
 * - JWT taken from localStorage so no prop drilling is needed
 * - Calls onLocation(data) for type === "location_update"
 * - Calls onStatus(data)   for type === "status_update"
 * - Closes the socket on component unmount (no memory leaks)
 * - Reports connection state via the returned `wsState` string
 *
 * Usage
 * -----
 * const { wsState } = useTripWebSocket(trip.id, {
 *   onLocation: ({ latitude, longitude }) => setLivePos({ lat: latitude, lng: longitude }),
 *   onStatus:   (data) => updateShipmentStatus(data),
 * })
 */

import { useEffect, useRef, useCallback } from 'react'
import { API_BASE_URL } from '../services/api'

// Derive WebSocket base URL from the HTTP API base URL
const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws')

const MAX_RETRIES = 5
const BASE_DELAY_MS = 2000   // start with 2 s, doubles each attempt

/**
 * @param {number|null}  tripId          - Active trip ID (null = no connection)
 * @param {object}       handlers
 * @param {function}     handlers.onLocation  - Called with location_update payload
 * @param {function}     handlers.onStatus    - Called with status_update payload
 * @param {function}     [handlers.onStateChange] - Called with 'connecting'|'open'|'closed'
 */
export function useTripWebSocket(tripId, { onLocation, onStatus, onStateChange } = {}) {
  const wsRef        = useRef(null)   // current WebSocket instance
  const retriesRef   = useRef(0)      // reconnect attempt counter
  const timeoutRef   = useRef(null)   // reconnect timer handle
  const unmountedRef = useRef(false)  // guard against post-unmount state updates

  // Stable callback refs so we don't recreate the socket on every render
  const onLocationRef = useRef(onLocation)
  const onStatusRef   = useRef(onStatus)
  const onStateRef    = useRef(onStateChange)

  useEffect(() => { onLocationRef.current = onLocation }, [onLocation])
  useEffect(() => { onStatusRef.current   = onStatus   }, [onStatus])
  useEffect(() => { onStateRef.current    = onStateChange }, [onStateChange])

  const notifyState = useCallback((state) => {
    if (onStateRef.current) onStateRef.current(state)
  }, [])

  const connect = useCallback(() => {
    if (unmountedRef.current) return
    if (!tripId) return

    const token = localStorage.getItem('fleetflow_token')
    if (!token) {
      console.warn('[WS] No JWT token found — cannot connect')
      return
    }

    const url = `${WS_BASE_URL}/ws/tracking/${tripId}?token=${encodeURIComponent(token)}`
    console.info(`[WS] Connecting to ${url}`)
    notifyState('connecting')

    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      if (unmountedRef.current) { ws.close(); return }
      console.info(`[WS] Connected — trip=${tripId}`)
      retriesRef.current = 0   // reset back-off on successful connection
      notifyState('open')
    }

    ws.onmessage = (event) => {
      if (unmountedRef.current) return
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'location_update' && onLocationRef.current) {
          onLocationRef.current(data)
        } else if (data.type === 'status_update' && onStatusRef.current) {
          onStatusRef.current(data)
        }
      } catch (err) {
        console.error('[WS] Failed to parse message:', err)
      }
    }

    ws.onerror = (err) => {
      console.error('[WS] Error:', err)
    }

    ws.onclose = (event) => {
      if (unmountedRef.current) return
      console.info(`[WS] Closed — code=${event.code} reason=${event.reason}`)
      notifyState('closed')

      // Do not reconnect on auth failures (4001) or trip-not-found (4004)
      if (event.code === 4001 || event.code === 4004) {
        console.warn('[WS] Auth/not-found close code — not reconnecting')
        return
      }

      // Exponential back-off reconnect
      if (retriesRef.current < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, retriesRef.current)
        retriesRef.current += 1
        console.info(`[WS] Reconnecting in ${delay}ms (attempt ${retriesRef.current}/${MAX_RETRIES})`)
        timeoutRef.current = setTimeout(connect, delay)
      } else {
        console.warn('[WS] Max reconnect attempts reached')
      }
    }
  }, [tripId, notifyState])

  // Open socket when tripId changes; close + reopen if tripId switches
  useEffect(() => {
    unmountedRef.current = false
    retriesRef.current = 0

    if (tripId) {
      connect()
    }

    return () => {
      unmountedRef.current = true
      clearTimeout(timeoutRef.current)
      if (wsRef.current) {
        // Normal close — will NOT trigger reconnect (code 1000)
        wsRef.current.close(1000, 'component unmounted')
        wsRef.current = null
      }
    }
  }, [tripId, connect])
}
