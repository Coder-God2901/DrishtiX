import React from 'react'
import { io, Socket } from 'socket.io-client'
import { CLIENT_CONFIG } from '../config/client'

type HeatCell = {
  cellId: string
  coordinates: [number, number][]
  count: number
  updatedAt?: string
}

type AlertItem = {
  alertId: string
  eventId: string
  type: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  zoneId?: string
  confidence?: number
  summary?: string
  detectedAt?: string
  status?: string
}

type TeamLocation = {
  userId: string
  lat: number
  lng: number
  timestamp: string
  role?: string
}

type ForecastPoint = {
  zoneId?: string
  timeHorizonMinutes: number
  predictedCount: number
  confidence?: number
}

type State = {
  eventId: string
  heatgrid: HeatCell[]
  alerts: AlertItem[]
  teamLocations: TeamLocation[]
  forecasts: ForecastPoint[]
}

const RealtimeContext = React.createContext<{
  state: State
  socket?: Socket
  setEvent: (eventId: string) => void
} | null>(null)

const initialState: State = {
  eventId: (import.meta as any).env?.VITE_DEFAULT_EVENT_ID ?? 'evt_101',
  heatgrid: [],
  alerts: [],
  teamLocations: [],
  forecasts: [],
}

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = React.useState<State>(initialState)
  const socketRef = React.useRef<Socket | undefined>(undefined)

  React.useEffect(() => {
    const socket = io(CLIENT_CONFIG.socketUrl, { transports: ['websocket'] })
    socketRef.current = socket

    const joinRooms = (eventId: string) => {
      socket.emit('join:event', eventId)
      socket.emit('subscribe:anomalies', eventId)
      socket.emit('subscribe:predictions', eventId)
    }

    socket.on('connect', () => {
      joinRooms(state.eventId)
    })

    socket.on('crowd:update', (cells: HeatCell[]) => {
      setState(s => ({ ...s, heatgrid: cells }))
    })

    socket.on('anomaly:detected', (alert: AlertItem) => {
      setState(s => ({ ...s, alerts: [alert, ...s.alerts].slice(0, 200) }))
    })

    socket.on('dispatch:teamLocations', (locs: TeamLocation[]) => {
      setState(s => ({ ...s, teamLocations: locs }))
    })

    socket.on('prediction:new', (point: ForecastPoint) => {
      setState(s => ({ ...s, forecasts: [point, ...s.forecasts].slice(0, 200) }))
    })

    return () => {
      socket.disconnect()
    }
  }, [state.eventId])

  const setEvent = (eventId: string) => {
    setState(s => ({ ...s, eventId }))
    if (socketRef.current?.connected) {
      socketRef.current.emit('join:event', eventId)
      socketRef.current.emit('subscribe:anomalies', eventId)
      socketRef.current.emit('subscribe:predictions', eventId)
    }
  }

  return (
    <RealtimeContext.Provider value= {{ state, socket: socketRef.current, setEvent }}>
  { children }
  </RealtimeContext.Provider>
  )
}

export const useRealtime = () => {
  const ctx = React.useContext(RealtimeContext)
  if (!ctx) throw new Error('useRealtime must be used within RealtimeProvider')
  return ctx
}

export const useRealtimeInit = () => {
  // ensure provider is mounted; no-op here
}
