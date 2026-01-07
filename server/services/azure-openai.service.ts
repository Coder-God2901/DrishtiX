/**
 * Azure OpenAI Service
 * AI-powered text generation, vision analysis, and embeddings
 * 
 * Features:
 * - Text generation (GPT-4, GPT-3.5)
 * - Vision analysis (GPT-4 Vision)
 * - Text embeddings
 * - Conversation and chat completion
 * - Function calling
 * 
 * Replaces: Google Gemini AI
 */

import { OpenAIClient, AzureKeyCredential } from '@azure/openai';
import { azureConfig } from '../config/azure.config';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionRequest {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  functions?: ChatFunction[];
}

interface ChatFunction {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

interface ChatCompletionResponse {
  content: string;
  finishReason: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  functionCall?: {
    name: string;
    arguments: string;
  };
}

interface VisionAnalysisRequest {
  imageUrl: string;
  prompt: string;
  maxTokens?: number;
}

interface VisionAnalysisResponse {
  description: string;
  objects: DetectedObject[];
  anomalies: Anomaly[];
  insights: string[];
}

interface DetectedObject {
  label: string;
  confidence: number;
  boundingBox?: { x: number; y: number; width: number; height: number };
}

interface Anomaly {
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  confidence: number;
  location?: { x: number; y: number };
}

interface EmbeddingRequest {
  text: string | string[];
  model?: string;
}

class AzureOpenAIService {
  private client: OpenAIClient;
  private readonly chatDeployment: string;
  private readonly embeddingDeployment: string;
  private readonly visionDeployment: string;

  constructor() {
    this.client = new OpenAIClient(
      azureConfig.openai.endpoint,
      new AzureKeyCredential(azureConfig.openai.apiKey)
    );

    this.chatDeployment = azureConfig.openai.deployment.chat;
    this.embeddingDeployment = azureConfig.openai.deployment.embedding;
    this.visionDeployment = azureConfig.openai.deployment.vision;

    console.log('[Azure OpenAI Service] Initialized');
  }

  /**
   * Generate chat completion
   */
  async chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    try {
      const response = await this.client.getChatCompletions(
        this.chatDeployment,
        request.messages,
        {
          temperature: request.temperature ?? 0.7,
          maxTokens: request.maxTokens ?? 1000,
          topP: request.topP ?? 0.95,
          frequencyPenalty: request.frequencyPenalty ?? 0,
          presencePenalty: request.presencePenalty ?? 0,
          functions: request.functions,
        }
      );

      const choice = response.choices[0];

      return {
        content: choice.message?.content || '',
        finishReason: choice.finishReason || 'stop',
        usage: {
          promptTokens: response.usage?.promptTokens || 0,
          completionTokens: response.usage?.completionTokens || 0,
          totalTokens: response.usage?.totalTokens || 0,
        },
        functionCall: choice.message?.functionCall
          ? {
            name: choice.message.functionCall.name,
            arguments: choice.message.functionCall.arguments,
          }
          : undefined,
      };
    } catch (error) {
      console.error('Error in chat completion:', error);
      throw error;
    }
  }

  /**
   * Analyze image using GPT-4 Vision
   */
  async analyzeVision(request: VisionAnalysisRequest): Promise<VisionAnalysisResponse> {
    try {
      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: `You are an AI assistant specialized in analyzing crowd images for event safety. 
          Detect people, objects, anomalies, and safety concerns. 
          Respond in JSON format with: description, objects (label, confidence), anomalies (type, severity, description), and insights.`,
        },
        {
          role: 'user',
          content: `${request.prompt}\n\nImage URL: ${request.imageUrl}`,
        },
      ];

      const response = await this.client.getChatCompletions(this.visionDeployment, messages, {
        maxTokens: request.maxTokens ?? 1500,
        temperature: 0.3, // Lower temperature for more factual responses
      });

      const content = response.choices[0]?.message?.content || '{}';

      // Parse the response
      try {
        const parsed = JSON.parse(content);
        return {
          description: parsed.description || 'No description available',
          objects: parsed.objects || [],
          anomalies: parsed.anomalies || [],
          insights: parsed.insights || [],
        };
      } catch (parseError) {
        // Fallback if response is not JSON
        return {
          description: content,
          objects: [],
          anomalies: [],
          insights: [content],
        };
      }
    } catch (error) {
      console.error('Error in vision analysis:', error);
      throw error;
    }
  }

  /**
   * Detect anomalies in crowd images
   */
  async detectAnomalies(
    imageUrl: string,
    context: { eventId: string; zoneId: string; timestamp: Date }
  ): Promise<Anomaly[]> {
    try {
      const prompt = `Analyze this crowd image for safety anomalies. Look for:
      - Unusual crowd densities or formations
      - Potential bottlenecks or crowd surges
      - Unauthorized access attempts
      - Suspicious objects or behaviors
      - Emergency situations
      
      Event ID: ${context.eventId}
      Zone: ${context.zoneId}
      Time: ${context.timestamp.toISOString()}
      
      Return anomalies in JSON format with: type, severity (LOW/MEDIUM/HIGH/CRITICAL), description, confidence (0-1).`;

      const result = await this.analyzeVision({
        imageUrl,
        prompt,
        maxTokens: 1000,
      });

      return result.anomalies;
    } catch (error) {
      console.error('Error detecting anomalies:', error);
      return [];
    }
  }

  /**
   * Generate text embeddings for semantic search
   */
  async generateEmbeddings(request: EmbeddingRequest): Promise<number[][]> {
    try {
      const texts = Array.isArray(request.text) ? request.text : [request.text];

      const response = await this.client.getEmbeddings(
        this.embeddingDeployment,
        texts
      );

      return response.data.map(item => item.embedding);
    } catch (error) {
      console.error('Error generating embeddings:', error);
      throw error;
    }
  }

  /**
   * Analyze crowd sentiment from text (social media, feedback)
   */
  async analyzeSentiment(text: string): Promise<{
    sentiment: 'positive' | 'negative' | 'neutral';
    score: number;
    topics: string[];
  }> {
    try {
      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: `Analyze the sentiment of event-related feedback. 
          Return JSON with: sentiment (positive/negative/neutral), score (0-1), and topics (array of main themes).`,
        },
        {
          role: 'user',
          content: text,
        },
      ];

      const response = await this.chatCompletion({
        messages,
        temperature: 0.3,
        maxTokens: 200,
      });

      const parsed = JSON.parse(response.content);
      return parsed;
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      return {
        sentiment: 'neutral',
        score: 0.5,
        topics: [],
      };
    }
  }

  /**
   * Generate incident report summary
   */
  async generateIncidentSummary(incidentData: any): Promise<string> {
    try {
      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: `You are an AI assistant that generates concise incident reports for event safety teams.
          Summarize the key details, severity, actions taken, and recommendations.`,
        },
        {
          role: 'user',
          content: `Generate an incident report summary for:\n${JSON.stringify(incidentData, null, 2)}`,
        },
      ];

      const response = await this.chatCompletion({
        messages,
        temperature: 0.5,
        maxTokens: 500,
      });

      return response.content;
    } catch (error) {
      console.error('Error generating incident summary:', error);
      return 'Unable to generate summary';
    }
  }

  /**
   * Generate predictive insights based on historical data
   */
  async generatePredictiveInsights(eventData: any): Promise<string[]> {
    try {
      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: `You are an AI assistant specialized in crowd management and event safety.
          Analyze patterns and generate predictive insights for potential issues.
          Return insights as a JSON array of strings.`,
        },
        {
          role: 'user',
          content: `Analyze this event data and provide predictive insights:\n${JSON.stringify(eventData, null, 2)}`,
        },
      ];

      const response = await this.chatCompletion({
        messages,
        temperature: 0.7,
        maxTokens: 800,
      });

      const parsed = JSON.parse(response.content);
      return Array.isArray(parsed) ? parsed : [response.content];
    } catch (error) {
      console.error('Error generating predictive insights:', error);
      return [];
    }
  }

  /**
   * AI-powered event planning assistant
   */
  async eventPlanningAssistant(query: string, context: any): Promise<string> {
    try {
      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: `You are an AI event planning assistant for DrishtiX crowd management platform.
          Provide helpful, actionable advice for event organizers based on their queries and event context.`,
        },
        {
          role: 'user',
          content: `Context: ${JSON.stringify(context, null, 2)}\n\nQuery: ${query}`,
        },
      ];

      const response = await this.chatCompletion({
        messages,
        temperature: 0.8,
        maxTokens: 1000,
      });

      return response.content;
    } catch (error) {
      console.error('Error in event planning assistant:', error);
      return 'I apologize, but I encountered an error processing your request.';
    }
  }

  /**
   * Generate safety recommendations based on event conditions
   */
  async generateSafetyRecommendations(eventConditions: {
    crowdDensity: number;
    weather: any;
    time: Date;
    location: string;
  }): Promise<string[]> {
    try {
      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: `You are a safety expert AI. Generate specific, actionable safety recommendations
          based on current event conditions. Return recommendations as a JSON array of strings.`,
        },
        {
          role: 'user',
          content: `Event conditions:\n${JSON.stringify(eventConditions, null, 2)}`,
        },
      ];

      const response = await this.chatCompletion({
        messages,
        temperature: 0.6,
        maxTokens: 600,
      });

      const parsed = JSON.parse(response.content);
      return Array.isArray(parsed) ? parsed : [response.content];
    } catch (error) {
      console.error('Error generating safety recommendations:', error);
      return [];
    }
  }

  /**
   * Stream chat completion (for real-time responses)
   */
  async *streamChatCompletion(
    request: ChatCompletionRequest
  ): AsyncGenerator<string, void, unknown> {
    try {
      const events = await this.client.streamChatCompletions(
        this.chatDeployment,
        request.messages,
        {
          temperature: request.temperature ?? 0.7,
          maxTokens: request.maxTokens ?? 1000,
        }
      );

      for await (const event of events) {
        for (const choice of event.choices) {
          const delta = choice.delta?.content;
          if (delta) {
            yield delta;
          }
        }
      }
    } catch (error) {
      console.error('Error in stream chat completion:', error);
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.chatCompletion({
        messages: [{ role: 'user', content: 'Hello' }],
        maxTokens: 10,
      });
      return response.content.length > 0;
    } catch (error) {
      console.error('Azure OpenAI health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const azureOpenAIService = new AzureOpenAIService();
export default azureOpenAIService;
