/**
 * Copyright Â© 2025 DrishtiX. All Rights Reserved.
 * 
 * PROPRIETARY AND CONFIDENTIAL
 * 
 * This software is the proprietary information of DrishtiX.
 * Unauthorized copying, distribution, modification, or use of this software,
 * via any medium, is strictly prohibited without the express written permission
 * of DrishtiX.
 * 
 * This software is provided "as is" without warranty of any kind, express or implied.
 * 
 * For licensing inquiries: licensing@drishtix.com
 * License: See LICENSE file in the project root
 */
/**
 * Voice AI Service
 * Hands-free command center interaction using Azure OpenAI and Azure Speech Services
 */

import { azureOpenAIService } from './azure-openai.service';
import { azureConfig } from '../config/azure.config';
import { io } from '../index';

export interface VoiceCommand {
  text: string;
  language: string;
  eventId?: string;
  userId?: string;
  timestamp: Date;
}

export interface VoiceResponse {
  text: string;
  action?: VoiceAction;
  data?: any;
  visualData?: VisualData;
  timestamp: Date;
}

export interface VoiceAction {
  type: 'SHOW_MAP' | 'SHOW_ALERTS' | 'SHOW_PREDICTIONS' | 'DISPATCH' | 'QUERY' | 'UPDATE';
  parameters: Record<string, any>;
}

export interface VisualData {
  type: 'HEATMAP' | 'ROUTE' | 'ALERT_LIST' | 'PREDICTION_CHART';
  data: any;
}

class VoiceAIService {
  private conversationHistory: Map<string, any[]>;
  private recognizeStream: any;

  constructor() {
    this.conversationHistory = new Map();
    console.log('âœ“ Voice AI Service initialized with Azure OpenAI and Azure Speech Services');
  }

  /**
   * System instruction for voice AI
   */
  private getSystemInstruction(): string {
    return `You are DrishtiX Voice AI, an intelligent assistant for crowd safety command centers.

CAPABILITIES:
- Answer questions about current crowd density, predictions, and alerts
- Execute commands to display maps, heatmaps, routes, and data visualizations
- Provide emergency dispatch support
- Offer tactical recommendations for crowd management
- Support multi-language queries (English, Hindi, Spanish, French, Arabic)

COMMAND TYPES YOU CAN HANDLE:
1. "Show risk zones near [location]" â†’ Display risk heatmap
2. "What's the crowd density at [location]?" â†’ Query current density
3. "Show predictions for next 15 minutes" â†’ Display forecast
4. "Dispatch emergency team to [location]" â†’ Initiate dispatch
5. "Show all active alerts" â†’ Display alert list
6. "What's the ETA for responder [ID]?" â†’ Query responder status
7. "Show evacuation routes from [location]" â†’ Display routes
8. "How many people at [gate/zone]?" â†’ Query crowd count

RESPONSE FORMAT:
Always respond in JSON with this structure:
{
  "text": "Natural language response",
  "action": {
    "type": "SHOW_MAP | SHOW_ALERTS | SHOW_PREDICTIONS | DISPATCH | QUERY | UPDATE",
    "parameters": { ... }
  },
  "visualData": {
    "type": "HEATMAP | ROUTE | ALERT_LIST | PREDICTION_CHART",
    "data": { ... }
  }
}

GUIDELINES:
- Be concise and action-oriented
- Prioritize safety-critical information
- Use clear, professional language
- Include visual data when applicable
- Support hands-free operation (voice-only responses)
- Handle ambiguity by asking clarifying questions`;
  }

  /**
   * Process voice command
   */
  async processCommand(
    command: VoiceCommand,
    contextData?: any
  ): Promise<VoiceResponse> {
    try {
      // Get or create conversation history for this session
      const sessionId = command.eventId || 'default';
      let history = this.conversationHistory.get(sessionId) || [];

      // Build prompt with context
      const prompt = this.buildPrompt(command, contextData);

      // Generate response using Azure OpenAI
      const messages = [
        {
          role: 'system' as const,
          content: this.getSystemInstruction(),
        },
        ...history,
        {
          role: 'user' as const,
          content: prompt,
        },
      ];

      const responseText = await azureOpenAIService.generateText(messages);

      // Parse response
      const parsedResponse = this.parseResponse(responseText, command.timestamp);

      // Update conversation history
      history.push(
        { role: 'user', content: prompt },
        { role: 'assistant', content: responseText }
      );

      // Keep only last 10 exchanges
      if (history.length > 20) {
        history = history.slice(-20);
      }
      this.conversationHistory.set(sessionId, history);

      return parsedResponse;
    } catch (error) {
      console.error('Voice AI processing error:', error);
      return {
        text: 'I apologize, I encountered an error processing your command. Please try again.',
        timestamp: command.timestamp,
      };
    }
  }

  /**
   * Build prompt with context
   */
  private buildPrompt(command: VoiceCommand, context?: any): string {
    let prompt = `User Command: "${command.text}"`;

    if (context) {
      prompt += `\n\nCurrent Context:`;

      if (context.eventInfo) {
        prompt += `\n- Event: ${context.eventInfo.name}`;
        prompt += `\n- Location: ${context.eventInfo.venue}`;
        prompt += `\n- Attendees: ${context.eventInfo.actualAttendees || context.eventInfo.expectedAttendees}`;
      }

      if (context.currentDensity) {
        prompt += `\n- Current Avg Density: ${(context.currentDensity * 100).toFixed(1)}%`;
      }

      if (context.activeAlerts) {
        prompt += `\n- Active Alerts: ${context.activeAlerts.length}`;
        if (context.activeAlerts.length > 0) {
          const critical = context.activeAlerts.filter((a: any) => a.severity === 'CRITICAL').length;
          const high = context.activeAlerts.filter((a: any) => a.severity === 'HIGH').length;
          prompt += ` (${critical} critical, ${high} high)`;
        }
      }

      if (context.predictions) {
        const nextPrediction = context.predictions[0];
        if (nextPrediction) {
          prompt += `\n- Next Prediction: ${nextPrediction.riskLevel} risk in ${nextPrediction.forecastHorizon} min`;
        }
      }

      if (context.responders) {
        const available = context.responders.filter((r: any) => r.status === 'AVAILABLE').length;
        prompt += `\n- Available Responders: ${available}/${context.responders.length}`;
      }
    }

    prompt += `\n\nProvide a helpful response with actionable information and visual data if applicable.`;

    return prompt;
  }

  /**
   * Parse AI response
   */
  private parseResponse(responseText: string, timestamp: Date): VoiceResponse {
    try {
      // Try to extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          text: parsed.text || responseText,
          action: parsed.action,
          data: parsed.data,
          visualData: parsed.visualData,
          timestamp,
        };
      }

      // If no JSON, return as plain text
      return {
        text: responseText,
        timestamp,
      };
    } catch (error) {
      // Fallback to plain text
      return {
        text: responseText,
        timestamp,
      };
    }
  }

  /**
   * Start real-time speech recognition stream
   * TODO: Implement Azure Speech SDK integration
   */
  async startSpeechRecognition(
    eventId: string,
    language: string = 'en-US',
    onTranscript?: (transcript: string) => void
  ): Promise<void> {
    try {
      // Note: Azure Speech SDK implementation needed
      // Use @azure/cognitiveservices-speech package
      console.log(`[Voice AI] Speech recognition not yet implemented for Azure`);
      console.log(`TODO: Implement Azure Speech SDK for event ${eventId}`);
    } catch (error) {
      console.error('[Voice AI] Failed to start speech recognition:', error);
      throw error;
    }
  }

  /**
   * Stop speech recognition stream
   */
  stopSpeechRecognition(): void {
    if (this.recognizeStream) {
      this.recognizeStream.destroy();
      this.recognizeStream = null;
      console.log('âœ“ Stopped speech recognition');
    }
  }

  /**
   * Transcribe audio buffer to text
   * TODO: Implement Azure Speech SDK integration
   */
  async transcribeAudio(
    audioBuffer: Buffer,
    language: string = 'en-US'
  ): Promise<string> {
    try {
      // Note: Azure Speech SDK implementation needed
      console.log('[Voice AI] Audio transcription not yet implemented for Azure');
      return '';
    } catch (error) {
      console.error('[Voice AI] Transcription error:', error);
      throw error;
    }
  }

  /**
   * Clear conversation history
   */
  clearHistory(sessionId?: string): void {
    if (sessionId) {
      this.conversationHistory.delete(sessionId);
    } else {
      this.conversationHistory.clear();
    }
  }

  /**
   * Translate command to different language
   */
  async translateCommand(text: string, targetLanguage: string): Promise<string> {
    try {
      const prompt = `Translate this crowd safety command to ${targetLanguage}: "${text}"`;
      const messages = [
        { role: 'user' as const, content: prompt },
      ];
      return await azureOpenAIService.generateText(messages);
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    }
  }
}

export const voiceAIService = new VoiceAIService();
export default voiceAIService;
