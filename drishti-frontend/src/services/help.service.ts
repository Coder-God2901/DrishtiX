/**
 * Help & Support Service
 * Handles help requests, FAQ, and emergency assistance
 */

import { apiClient } from './api.client';
import { wsService } from './websocket.service';
import { API_ENDPOINTS } from '../config/api.config';

export interface HelpRequest {
  id: string;
  userId: string;
  eventId: string;
  type: 'MEDICAL' | 'LOST_PERSON' | 'GENERAL' | 'EMERGENCY' | 'INFORMATION';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  description: string;
  location?: string;
  coordinates?: { lat: number; lng: number };
  status: 'PENDING' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED';
  assignedTo?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  helpful: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string | Date;
}

class HelpService {
  /**
   * Submit a help request
   */
  async submitHelpRequest(requestData: Partial<HelpRequest>) {
    return await apiClient.post<HelpRequest>(API_ENDPOINTS.help.request, requestData);
  }

  /**
   * Get FAQs
   */
  async getFAQs(category?: string) {
    return await apiClient.get<FAQItem[]>(API_ENDPOINTS.help.faq, { category });
  }

  /**
   * Send chat message to AI assistant
   */
  async sendChatMessage(message: string, eventId?: string) {
    return await apiClient.post<ChatMessage>(API_ENDPOINTS.help.chat, {
      message,
      eventId,
    });
  }

  /**
   * Request emergency assistance
   */
  async requestEmergencyHelp(data: {
    type: string;
    location?: string;
    description?: string;
  }) {
    return await apiClient.post(API_ENDPOINTS.help.emergency, data);
  }

  /**
   * Subscribe to help request updates
   */
  subscribeToHelpRequests(userId: string, callback: (request: HelpRequest) => void) {
    wsService.on(`help:${userId}`, callback);
    return () => {
      wsService.off(`help:${userId}`, callback);
    };
  }
}

export const helpService = new HelpService();
