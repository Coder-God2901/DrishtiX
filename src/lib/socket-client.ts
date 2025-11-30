/**
 * Socket.IO Client Wrapper
 * Real-time communication with backend server
 */

import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';

class SocketClient {
  private socket: Socket | null = null;
  private eventHandlers: Map<string, Set<Function>> = new Map();

  connect() {
    if (this.socket?.connected) {
      return this.socket;
    }

    const authStorage = localStorage.getItem('auth-storage');
    let token = '';

    if (authStorage) {
      try {
        const { state } = JSON.parse(authStorage);
        token = state?.token || '';
      } catch (error) {
        console.error('Failed to parse auth storage:', error);
      }
    }

    this.socket = io(SOCKET_URL, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket.IO connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket.IO disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
    });

    this.socket.on('error', (error) => {
      console.error('Socket.IO error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.eventHandlers.clear();
    }
  }

  /**
   * Subscribe to an event
   */
  on<T = any>(event: string, handler: (data: T) => void) {
    if (!this.socket) {
      this.connect();
    }

    this.socket?.on(event, handler);

    // Track handler for cleanup
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)?.add(handler);

    return () => this.off(event, handler);
  }

  /**
   * Unsubscribe from an event
   */
  off(event: string, handler?: Function) {
    if (handler) {
      this.socket?.off(event, handler as any);
      this.eventHandlers.get(event)?.delete(handler);
    } else {
      this.socket?.off(event);
      this.eventHandlers.delete(event);
    }
  }

  /**
   * Emit an event to server
   */
  emit(event: string, data?: any) {
    if (!this.socket) {
      this.connect();
    }
    this.socket?.emit(event, data);
  }

  /**
   * Join a room
   */
  joinRoom(room: string) {
    this.emit('join-room', room);
  }

  /**
   * Leave a room
   */
  leaveRoom(room: string) {
    this.emit('leave-room', room);
  }

  /**
   * Subscribe to event-specific rooms
   */
  subscribeToEvent(eventId: string) {
    this.joinRoom(`event:${eventId}`);
    this.joinRoom(`predictions:${eventId}`);
    this.joinRoom(`incidents:${eventId}`);
    this.joinRoom(`alerts:${eventId}`);
  }

  /**
   * Unsubscribe from event-specific rooms
   */
  unsubscribeFromEvent(eventId: string) {
    this.leaveRoom(`event:${eventId}`);
    this.leaveRoom(`predictions:${eventId}`);
    this.leaveRoom(`incidents:${eventId}`);
    this.leaveRoom(`alerts:${eventId}`);
  }

  /**
   * Get socket instance
   */
  getSocket() {
    return this.socket;
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this.socket?.connected || false;
  }
}

export const socketClient = new SocketClient();

// Auto-connect on module load
if (typeof window !== 'undefined') {
  socketClient.connect();
}

export default socketClient;
