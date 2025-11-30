import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAlertStore } from '../store/useAlertStore';
import { useTeamStore } from '../store/useTeamStore';

interface UseWebSocketOptions {
  url?: string;
  autoConnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    url = process.env.VITE_WS_URL || 'http://localhost:3001',
    autoConnect = true,
    onConnect,
    onDisconnect,
    onError,
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const { addAlert, updateAlert } = useAlertStore();
  const { updateMemberLocation, updateMemberStatus } = useTeamStore();

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    const socket = io(url, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('WebSocket connected');
      onConnect?.();
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      onDisconnect?.();
    });

    socket.on('error', (error: Error) => {
      console.error('WebSocket error:', error);
      onError?.(error);
    });

    // Alert events
    socket.on('alert:new', (alert) => {
      addAlert(alert);
    });

    socket.on('alert:update', ({ id, updates }) => {
      updateAlert(id, updates);
    });

    // Team location updates
    socket.on('location:update', ({ memberId, location }) => {
      updateMemberLocation(memberId, location);
    });

    // Team status updates
    socket.on('status:update', ({ memberId, status }) => {
      updateMemberStatus(memberId, status);
    });

    socketRef.current = socket;
  }, [url, onConnect, onDisconnect, onError, addAlert, updateAlert, updateMemberLocation, updateMemberStatus]);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
  }, []);

  const emit = useCallback((event: string, data: any) => {
    socketRef.current?.emit(event, data);
  }, []);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected || false,
    connect,
    disconnect,
    emit,
  };
}
