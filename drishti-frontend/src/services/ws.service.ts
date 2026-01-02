/**
 * WebSocket Service
 * Real-time communication with backend via Socket.IO
 */

import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '../config/api.config';

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private eventHandlers: Map<string, Set<Function>> = new Map();

  constructor() {
    this.connect();
  }

  private connect(): void {
    if (this.socket?.connected) {
      return;
    }

    const wsURL = API_CONFIG.wsURL || 'ws://localhost:3000';

    this.socket = io(wsURL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      auth: {
        token: localStorage.getItem('auth_token'),
      },
    });

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      this.reconnectAttempts = 0;
      // Re-subscribe to all events after reconnection
      this.resubscribeAll();
    });

    this.socket.on('disconnect', (reason: string) => {
      console.warn('⚠️ WebSocket disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        this.socket?.connect();
      }
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('❌ WebSocket connection error:', error);
      this.reconnectAttempts++;
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
      }
    });

    this.socket.on('error', (error: Error) => {
      console.error('❌ WebSocket error:', error);
    });
  }

  /**
   * Register an event handler
   */
  public on(event: string, callback: (data: any) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(callback);

    // Register with socket
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  /**
   * Unregister an event handler
   */
  public off(event: string, callback: (data: any) => void): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(callback);
      if (handlers.size === 0) {
        this.eventHandlers.delete(event);
      }
    }

    // Unregister from socket
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  /**
   * Emit an event to the server
   */
  public emit(event: string, data?: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn(`Cannot emit event "${event}": WebSocket not connected`);
    }
  }

  /**
   * Re-subscribe to all registered events after reconnection
   */
  private resubscribeAll(): void {
    this.eventHandlers.forEach((handlers, event) => {
      handlers.forEach(callback => {
        if (this.socket) {
          this.socket.on(event, callback as (...args: any[]) => void);
        }
      });
    });
  }

  /**
   * Disconnect the WebSocket
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Check if WebSocket is connected
   */
  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get the socket instance
   */
  public getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Update authentication token
   */
  public updateAuth(token: string): void {
    if (this.socket) {
      this.socket.auth = { token };
      if (this.socket.connected) {
        this.socket.disconnect();
        this.socket.connect();
      }
    }
  }
}

// Export singleton instance
export const wsService = new WebSocketService();
export default wsService;
