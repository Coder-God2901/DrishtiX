import { apiClient } from '@/lib/api-client';

interface VoiceCommand {
  text: string;
  language: string;
  eventId?: string;
  userId?: string;
}

interface VoiceResponse {
  text: string;
  action?: {
    type: 'SHOW_MAP' | 'SHOW_ALERTS' | 'SHOW_PREDICTIONS' | 'DISPATCH' | 'QUERY' | 'UPDATE';
    parameters: Record<string, any>;
  };
  data?: any;
  visualData?: {
    type: 'HEATMAP' | 'ROUTE' | 'ALERT_LIST' | 'PREDICTION_CHART';
    data: any;
  };
  timestamp: Date;
}

interface TranslateRequest {
  text: string;
  targetLanguage: string;
}

interface TranslateResponse {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

class VoiceAIService {
  /**
   * Process voice command
   */
  async processCommand(
    command: VoiceCommand,
    contextData?: any
  ): Promise<VoiceResponse> {
    const response = await apiClient.post<{ success: boolean; data: VoiceResponse }>(
      '/voice/command',
      {
        command,
        contextData,
      }
    );
    return response.data;
  }

  /**
   * Translate command to different language
   */
  async translateCommand(request: TranslateRequest): Promise<TranslateResponse> {
    const response = await apiClient.post<{ success: boolean; data: TranslateResponse }>(
      '/voice/translate',
      request
    );
    return response.data;
  }

  /**
   * Clear conversation history
   */
  async clearHistory(sessionId: string): Promise<void> {
    await apiClient.delete(`/voice/history/${sessionId}`);
  }

  /**
   * Transcribe audio to text
   */
  async transcribeAudio(
    audioBlob: Blob,
    language: string = 'en-US'
  ): Promise<string> {
    const formData = new FormData();
    formData.append('audio', audioBlob);
    formData.append('language', language);

    const response = await apiClient.post<{ success: boolean; data: { transcript: string } }>(
      '/voice/transcribe',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.transcript;
  }
}

export const voiceAIService = new VoiceAIService();
export type { VoiceCommand, VoiceResponse, TranslateRequest, TranslateResponse };
