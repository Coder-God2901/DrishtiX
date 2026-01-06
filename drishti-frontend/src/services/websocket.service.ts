/**
 * WebSocket Service
 * Real-time communication with backend using Socket.IO
 */

// @ts-ignore - socket.io-client types
import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '../config/api.config';

export interface SocketEventHandler<T = any> {
  (data: T): void;
}

class WebSocketService {
  private socket: Socket | null = null;
  private connected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor() {
    this.connect();
  }

  public connect(): void {
    if (this.socket?.connected) return;

    this.socket = io(API_CONFIG.wsURL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      this.connected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('❌ WebSocket disconnected:', reason);
      this.connected = false;
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
    });

    this.socket.on('reconnect', (attemptNumber: number) => {
      console.log(`✅ WebSocket reconnected after ${attemptNumber} attempts`);
      this.connected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('reconnect_error', (error: Error) => {
      console.error('WebSocket reconnection error:', error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('WebSocket reconnection failed after max attempts');
    });
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  public isConnected(): boolean {
    return this.connected && this.socket?.connected === true;
  }

  public joinRoom(room: string): void {
    if (this.socket) {
      this.socket.emit('join', room);
    }
  }

  public leaveRoom(room: string): void {
    if (this.socket) {
      this.socket.emit('leave', room);
    }
  }

  public joinEvent(eventId: string): void {
    if (this.socket) {
      this.socket.emit('join:event', eventId);
    }
  }

  public leaveEvent(eventId: string): void {
    if (this.socket) {
      this.socket.emit('leave:event', eventId);
    }
  }

  public on<T = any>(event: string, handler: SocketEventHandler<T>): void {
    if (this.socket) {
      this.socket.on(event, handler);
    }
  }

  public off(event: string, handler?: SocketEventHandler): void {
    if (this.socket) {
      if (handler) {
        this.socket.off(event, handler);
      } else {
        this.socket.off(event);
      }
    }
  }

  public emit(event: string, data?: any): void {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  public once<T = any>(event: string, handler: SocketEventHandler<T>): void {
    if (this.socket) {
      this.socket.once(event, handler);
    }
  }
}

export const wsService = new WebSocketService();
