/**
 * Voice AI Service
 * Hands-free command center interaction using Gemini and Google Cloud Speech-to-Text
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { gcpConfig } from '../config/gcp.config';
import { SpeechClient } from '@google-cloud/speech';
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
  private genAI: GoogleGenerativeAI;
  private conversationModel: any;
  private conversationHistory: Map<string, any[]>;
  private speechClient: SpeechClient;
  private recognizeStream: any;

  constructor() {
    this.genAI = new GoogleGenerativeAI(gcpConfig.gemini.apiKey);
    this.conversationHistory = new Map();
    this.speechClient = new SpeechClient({
      keyFilename: gcpConfig.credentials,
    });
    this.initializeModel();
    console.log('✓ Voice AI Service initialized with Google Cloud Speech-to-Text');
  }

  /**
   * Initialize conversational AI model
   */
  private initializeModel() {
    this.conversationModel = this.genAI.getGenerativeModel({
      model: gcpConfig.gemini.model,
      systemInstruction: this.getSystemInstruction(),
    });
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
1. "Show risk zones near [location]" → Display risk heatmap
2. "What's the crowd density at [location]?" → Query current density
3. "Show predictions for next 15 minutes" → Display forecast
4. "Dispatch emergency team to [location]" → Initiate dispatch
5. "Show all active alerts" → Display alert list
6. "What's the ETA for responder [ID]?" → Query responder status
7. "Show evacuation routes from [location]" → Display routes
8. "How many people at [gate/zone]?" → Query crowd count

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

      // Generate response
      const chat = this.conversationModel.startChat({
        history: history,
      });

      const result = await chat.sendMessage(prompt);
      const responseText = await result.response.text();

      // Parse response
      const parsedResponse = this.parseResponse(responseText, command.timestamp);

      // Update conversation history
      history.push(
        { role: 'user', parts: [{ text: prompt }] },
        { role: 'model', parts: [{ text: responseText }] }
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
   */
  async startSpeechRecognition(
    eventId: string,
    language: string = 'en-US',
    onTranscript?: (transcript: string) => void
  ): Promise<void> {
    try {
      const request = {
        config: {
          encoding: 'LINEAR16' as const,
          sampleRateHertz: 16000,
          languageCode: language,
          enableAutomaticPunctuation: true,
          model: 'command_and_search',
          useEnhanced: true,
        },
        interimResults: true,
      };

      this.recognizeStream = this.speechClient
        .streamingRecognize(request)
        .on('error', (error: Error) => {
          console.error('[Voice AI] Speech recognition error:', error);
        })
        .on('data', (data: any) => {
          const transcript = data.results[0]?.alternatives[0]?.transcript;
          if (transcript) {
            // Broadcast to WebSocket
            io.to(`voice:${eventId}`).emit('voice:transcript', {
              transcript,
              isFinal: data.results[0]?.isFinal,
              confidence: data.results[0]?.alternatives[0]?.confidence,
              timestamp: new Date(),
            });

            // Call callback if provided
            if (onTranscript && data.results[0]?.isFinal) {
              onTranscript(transcript);
            }
          }
        });

      console.log(`✓ Started speech recognition for event ${eventId}`);
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
      console.log('✓ Stopped speech recognition');
    }
  }

  /**
   * Transcribe audio buffer to text
   */
  async transcribeAudio(
    audioBuffer: Buffer,
    language: string = 'en-US'
  ): Promise<string> {
    try {
      const audio = {
        content: audioBuffer.toString('base64'),
      };

      const config = {
        encoding: 'LINEAR16' as const,
        sampleRateHertz: 16000,
        languageCode: language,
        enableAutomaticPunctuation: true,
      };

      const request = {
        audio: audio,
        config: config,
      };

      const [response] = await this.speechClient.recognize(request);
      const transcription = response.results
        ?.map((result: any) => result.alternatives?.[0]?.transcript)
        .join('\n');

      return transcription || '';
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
      const result = await this.conversationModel.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    }
  }
}

export const voiceAIService = new VoiceAIService();
export default voiceAIService;
