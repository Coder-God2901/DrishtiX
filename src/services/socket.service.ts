import { io, Socket } from 'socket.io-client';
import type { Message, Channel } from '@/store/useMessagingStore';
import { Incident } from './realtime-incident.service';

class SocketService {
  private socket: Socket | null = null;
  private isInitialized = false;

  initialize(url: string = import.meta.env.VITE_WS_URL || 'http://localhost:3000') {
    if (this.isInitialized) return;

    this.socket = io(url, {
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.setupEventListeners();
    this.isInitialized = true;
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('error', (error: Error) => {
      console.error('Socket error:', error);
    });
  }

  connect(userId: string) {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }

    this.socket.auth = { userId };
    this.socket.connect();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  // Event subscriptions
  subscribeToEvent(eventId: string) {
    if (!this.socket) return;
    this.socket.emit('join:event', eventId);
    this.socket.emit('subscribe:incidents', eventId);
    this.socket.emit('subscribe:predictions', eventId);
    this.socket.emit('subscribe:alerts', eventId);
  }

  // Venue & Event Updates
  onEventCreated(callback: (event: any) => void) {
    if (!this.socket) return;
    this.socket.on('event:created', callback);
  }

  onEventConfigUpdated(callback: (data: { eventId: string; dynamicFields: any }) => void) {
    if (!this.socket) return;
    this.socket.on('event:config:updated', callback);
  }

  onVenueUpdated(callback: (data: { eventId: string; boundary: any; zones: any[] }) => void) {
    if (!this.socket) return;
    this.socket.on('venue:updated', callback);
  }

  onGeofenceAlert(callback: (data: { userId: string; location: any; alerts: any[] }) => void) {
    if (!this.socket) return;
    this.socket.on('geofence:alert', callback);
  }

  // Incident events
  onIncidentCreated(callback: (incident: Incident) => void) {
    if (!this.socket) return;
    this.socket.on('incident:created', callback);
  }

  onIncidentUpdated(callback: (incident: Incident) => void) {
    if (!this.socket) return;
    this.socket.on('incident:updated', callback);
  }

  onIncidentResolved(callback: (incident: Incident) => void) {
    if (!this.socket) return;
    this.socket.on('incident:resolved', callback);
  }

  // Alert events
  onAlertNew(callback: (alert: any) => void) {
    if (!this.socket) return;
    this.socket.on('alert:new', callback);
  }

  onAlertDismissed(callback: (alert: any) => void) {
    if (!this.socket) return;
    this.socket.on('alert:dismissed', callback);
  }

  // Prediction events
  onPredictionNew(callback: (prediction: any) => void) {
    if (!this.socket) return;
    this.socket.on('prediction:new', callback);
  }

  // Crowd updates
  onCrowdUpdate(callback: (data: any) => void) {
    if (!this.socket) return;
    this.socket.on('crowd:update', callback);
  }

  // Anomaly events
  onAnomalyDetected(callback: (anomaly: any) => void) {
    if (!this.socket) return;
    this.socket.on('anomaly:detected', callback);
  }

  // Message events
  sendMessage(message: Omit<Message, 'id' | 'timestamp'>) {
    if (!this.socket) return;
    this.socket.emit('message:send', message);
  }

  onMessageReceived(callback: (message: Message) => void) {
    if (!this.socket) return;
    this.socket.on('message:received', callback);
  }

  onMessageUpdated(callback: (messageId: string, updates: Partial<Message>) => void) {
    if (!this.socket) return;
    this.socket.on('message:updated', callback);
  }

  onMessageDeleted(callback: (messageId: string) => void) {
    if (!this.socket) return;
    this.socket.on('message:deleted', callback);
  }

  // Typing indicators
  sendTyping(channelId: string) {
    if (!this.socket) return;
    this.socket.emit('typing:start', { channelId });
  }

  sendStoppedTyping(channelId: string) {
    if (!this.socket) return;
    this.socket.emit('typing:stop', { channelId });
  }

  onUserTyping(callback: (data: { channelId: string; userId: string; userName: string }) => void) {
    if (!this.socket) return;
    this.socket.on('typing:user', callback);
  }

  onUserStoppedTyping(callback: (data: { channelId: string; userId: string }) => void) {
    if (!this.socket) return;
    this.socket.on('typing:stopped', callback);
  }

  // Channel events
  joinChannel(channelId: string) {
    if (!this.socket) return;
    this.socket.emit('channel:join', { channelId });
  }

  leaveChannel(channelId: string) {
    if (!this.socket) return;
    this.socket.emit('channel:leave', { channelId });
  }

  createChannel(channel: Omit<Channel, 'id' | 'createdAt'>) {
    if (!this.socket) return;
    this.socket.emit('channel:create', channel);
  }

  onChannelCreated(callback: (channel: Channel) => void) {
    if (!this.socket) return;
    this.socket.on('channel:created', callback);
  }

  onChannelUpdated(callback: (channelId: string, updates: Partial<Channel>) => void) {
    if (!this.socket) return;
    this.socket.on('channel:updated', callback);
  }

  onChannelDeleted(callback: (channelId: string) => void) {
    if (!this.socket) return;
    this.socket.on('channel:deleted', callback);
  }

  // User presence
  onUserOnline(callback: (userId: string) => void) {
    if (!this.socket) return;
    this.socket.on('user:online', callback);
  }

  onUserOffline(callback: (userId: string) => void) {
    if (!this.socket) return;
    this.socket.on('user:offline', callback);
  }

  // File upload
  uploadFile(file: File, channelId: string, _onProgress?: (progress: number) => void) {
    return new Promise<{ url: string; fileName: string; fileSize: number }>((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not initialized'));
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        this.socket!.emit(
          'file:upload',
          {
            file: reader.result,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            channelId,
          },
          (response: { success: boolean; url?: string; error?: string }) => {
            if (response.success && response.url) {
              resolve({
                url: response.url,
                fileName: file.name,
                fileSize: file.size,
              });
            } else {
              reject(new Error(response.error || 'Upload failed'));
            }
          }
        );
      };
      reader.onerror = () => reject(new Error('File read failed'));
      reader.readAsArrayBuffer(file);
    });
  }

  // Generic event listeners
  on(event: string, callback: (...args: any[]) => void) {
    if (!this.socket) return;
    this.socket.on(event, callback);
  }

  off(event: string, callback?: (...args: any[]) => void) {
    if (!this.socket) return;
    if (callback) {
      this.socket.off(event, callback);
    } else {
      this.socket.off(event);
    }
  }

  emit(event: string, ...args: any[]) {
    if (!this.socket) return;
    this.socket.emit(event, ...args);
  }

  // Cleanup
  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }
}

export const socketService = new SocketService();
