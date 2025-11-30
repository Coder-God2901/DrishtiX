/**
 * Social Media Monitoring Service
 * Real-time Twitter/X API v2 integration with sentiment analysis
 * 
 * Features:
 * - Twitter API v2 streaming and search
 * - Gemini AI sentiment analysis
 * - Real-time panic level detection
 * - WebSocket broadcasting
 * - Pub/Sub integration
 * - BigQuery analytics storage
 */

import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { gcpConfig } from '../config/gcp.config';
import { pubSubService } from './pubsub.service';
import { bigQueryAnalyticsService } from './bigquery-analytics.service';
import { io } from '../index';
import { EventEmitter } from 'events';

// Twitter API v2 Configuration
const TWITTER_CONFIG = {
  apiKey: process.env.TWITTER_API_KEY || '',
  apiSecret: process.env.TWITTER_API_SECRET || '',
  bearerToken: process.env.TWITTER_BEARER_TOKEN || '',
  baseUrl: 'https://api.twitter.com/2',
};

export interface TwitterTweet {
  id: string;
  text: string;
  author_id: string;
  created_at: string;
  public_metrics?: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
  };
  geo?: {
    place_id: string;
    coordinates?: {
      type: string;
      coordinates: number[];
    };
  };
}

export interface SentimentAnalysis {
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'PANIC';
  confidence: number;
  panicLevel: number; // 0-1 scale
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  keywords: string[];
  emotions: string[];
  needsAttention: boolean;
}

export interface SocialSignal {
  id: string;
  source: 'twitter' | 'facebook' | 'instagram';
  text: string;
  authorId: string;
  timestamp: Date;
  location?: {
    lat: number;
    lon: number;
    placeName?: string;
  };
  sentiment: SentimentAnalysis;
  metrics: {
    engagement: number;
    reach: number;
  };
  eventId: string;
}

export interface MonitoringConfig {
  eventId: string;
  keywords: string[];
  hashtags: string[];
  location?: {
    lat: number;
    lon: number;
    radius: number; // in km
  };
  language?: string;
}

export interface AggregatedSentiment {
  eventId: string;
  timestamp: Date;
  totalTweets: number;
  sentimentDistribution: {
    positive: number;
    neutral: number;
    negative: number;
    panic: number;
  };
  averagePanicLevel: number;
  topKeywords: string[];
  needsAttention: boolean;
  alerts: string[];
}

class SocialMediaMonitoringService extends EventEmitter {
  private genAI: GoogleGenerativeAI;
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map();
  private sentimentCache: Map<string, SentimentAnalysis> = new Map();
  private initialized: boolean = false;

  constructor() {
    super();
    this.genAI = new GoogleGenerativeAI(gcpConfig.gemini.apiKey);
    this.initialized = !!TWITTER_CONFIG.bearerToken;

    if (!this.initialized) {
      console.warn('[Social Media] Twitter API credentials not configured');
    } else {
      console.log('✓ Social Media Monitoring Service initialized');
    }
  }

  /**
   * Start monitoring social media for an event
   */
  async startMonitoring(config: MonitoringConfig): Promise<void> {
    if (!this.initialized) {
      throw new Error('Twitter API not configured');
    }

    const { eventId } = config;

    // Stop existing monitoring if any
    this.stopMonitoring(eventId);

    console.log(`[Social Media] Starting monitoring for event ${eventId}`);

    // Initial fetch
    await this.fetchAndAnalyze(config);

    // Poll every 2 minutes
    const interval = setInterval(async () => {
      try {
        await this.fetchAndAnalyze(config);
      } catch (error) {
        console.error(`[Social Media] Error in monitoring interval:`, error);
      }
    }, 2 * 60 * 1000);

    this.monitoringIntervals.set(eventId, interval);
    console.log(`✓ Social media monitoring active for event ${eventId}`);
  }

  /**
   * Stop monitoring for an event
   */
  stopMonitoring(eventId: string): void {
    const interval = this.monitoringIntervals.get(eventId);
    if (interval) {
      clearInterval(interval);
      this.monitoringIntervals.delete(eventId);
      console.log(`✓ Stopped monitoring for event ${eventId}`);
    }
  }

  /**
   * Fetch and analyze tweets
   */
  private async fetchAndAnalyze(config: MonitoringConfig): Promise<void> {
    try {
      const tweets = await this.searchTweets(config);

      if (tweets.length === 0) {
        console.log(`[Social Media] No tweets found for event ${config.eventId}`);
        return;
      }

      // Analyze sentiment for each tweet
      const signals: SocialSignal[] = [];

      for (const tweet of tweets) {
        const sentiment = await this.analyzeSentiment(tweet.text);

        const signal: SocialSignal = {
          id: tweet.id,
          source: 'twitter',
          text: tweet.text,
          authorId: tweet.author_id,
          timestamp: new Date(tweet.created_at),
          sentiment,
          metrics: {
            engagement: this.calculateEngagement(tweet.public_metrics),
            reach: tweet.public_metrics?.retweet_count || 0,
          },
          eventId: config.eventId,
        };

        if (tweet.geo?.coordinates) {
          signal.location = {
            lat: tweet.geo.coordinates.coordinates[1],
            lon: tweet.geo.coordinates.coordinates[0],
            placeName: tweet.geo.place_id,
          };
        }

        signals.push(signal);
      }

      // Aggregate sentiment
      const aggregated = this.aggregateSentiment(config.eventId, signals);

      // Publish to Pub/Sub
      await pubSubService.publishMessage('social-signals', {
        eventId: config.eventId,
        signals,
        aggregated,
        timestamp: new Date().toISOString(),
      });

      // Broadcast via WebSocket
      io.to(`event:${config.eventId}`).emit('social:update', aggregated);
      io.to(`social:${config.eventId}`).emit('social:signals', signals);

      // Store in BigQuery
      await this.storeToBigQuery(config.eventId, signals, aggregated);

      // Check for alerts
      if (aggregated.needsAttention) {
        await this.triggerAlerts(config.eventId, aggregated);
      }

      console.log(`[Social Media] Analyzed ${signals.length} tweets for event ${config.eventId}, panic level: ${(aggregated.averagePanicLevel * 100).toFixed(1)}%`);

    } catch (error) {
      console.error('[Social Media] Error in fetch and analyze:', error);
      throw error;
    }
  }

  /**
   * Search tweets using Twitter API v2
   */
  private async searchTweets(config: MonitoringConfig): Promise<TwitterTweet[]> {
    try {
      // Build search query
      const query = this.buildSearchQuery(config);

      const response = await axios.get(`${TWITTER_CONFIG.baseUrl}/tweets/search/recent`, {
        headers: {
          'Authorization': `Bearer ${TWITTER_CONFIG.bearerToken}`,
        },
        params: {
          query,
          max_results: 100,
          'tweet.fields': 'created_at,public_metrics,geo,author_id',
          'expansions': 'geo.place_id',
        },
        timeout: 10000,
      });

      return response.data.data || [];
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.error('[Social Media] Twitter API authentication failed - check bearer token');
      } else if (error.response?.status === 429) {
        console.warn('[Social Media] Twitter API rate limit exceeded');
      } else {
        console.error('[Social Media] Error searching tweets:', error.message);
      }
      return [];
    }
  }

  /**
   * Build Twitter search query
   */
  private buildSearchQuery(config: MonitoringConfig): string {
    const parts: string[] = [];

    // Keywords
    if (config.keywords.length > 0) {
      parts.push(`(${config.keywords.join(' OR ')})`);
    }

    // Hashtags
    if (config.hashtags.length > 0) {
      const hashtags = config.hashtags.map(tag => `#${tag.replace('#', '')}`);
      parts.push(`(${hashtags.join(' OR ')})`);
    }

    // Location
    if (config.location) {
      // Twitter uses point_radius for geo search
      const { lat, lon, radius } = config.location;
      parts.push(`point_radius:[${lon} ${lat} ${radius}km]`);
    }

    // Language
    if (config.language) {
      parts.push(`lang:${config.language}`);
    }

    // Exclude retweets to avoid duplicates
    parts.push('-is:retweet');

    return parts.join(' ');
  }

  /**
   * Analyze sentiment using Gemini AI
   */
  private async analyzeSentiment(text: string): Promise<SentimentAnalysis> {
    // Check cache
    const cacheKey = text.substring(0, 100);
    if (this.sentimentCache.has(cacheKey)) {
      return this.sentimentCache.get(cacheKey)!;
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: gcpConfig.gemini.model });

      const prompt = `Analyze the sentiment and panic level of this social media post from a crowd safety perspective:

"${text}"

Return a JSON response with:
{
  "sentiment": "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "PANIC",
  "confidence": 0-1 (float),
  "panicLevel": 0-1 (float, where 1 is extreme panic),
  "urgency": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "keywords": [array of important safety-related keywords],
  "emotions": [array of detected emotions],
  "needsAttention": boolean (true if requires immediate attention)
}

Focus on detecting:
- Panic, fear, emergency situations
- Crowd-related safety concerns
- Fire, violence, crush, medical emergencies
- Evacuation needs

Return ONLY the JSON object, no markdown or explanation.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const textResponse = response.text();

      // Parse JSON from response
      const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse JSON response');
      }

      const analysis: SentimentAnalysis = JSON.parse(jsonMatch[0]);

      // Cache result
      this.sentimentCache.set(cacheKey, analysis);

      // Clear old cache entries (keep last 1000)
      if (this.sentimentCache.size > 1000) {
        const firstKey = this.sentimentCache.keys().next().value;
        if (firstKey) {
          this.sentimentCache.delete(firstKey);
        }
      }

      return analysis;

    } catch (error) {
      console.error('[Social Media] Sentiment analysis error:', error);

      // Fallback to basic keyword matching
      return this.fallbackSentimentAnalysis(text);
    }
  }

  /**
   * Fallback sentiment analysis using keywords
   */
  private fallbackSentimentAnalysis(text: string): SentimentAnalysis {
    const lowerText = text.toLowerCase();

    const panicKeywords = ['panic', 'stampede', 'crush', 'emergency', 'help', 'fire', 'evacuation', 'danger'];
    const negativeKeywords = ['crowded', 'packed', 'stuck', 'worried', 'scared', 'unsafe'];
    const positiveKeywords = ['safe', 'organized', 'good', 'great', 'amazing', 'awesome'];

    let panicLevel = 0;
    let sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'PANIC' = 'NEUTRAL';
    const keywords: string[] = [];

    // Check panic keywords
    panicKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        panicLevel += 0.3;
        keywords.push(keyword);
      }
    });

    // Check negative keywords
    negativeKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        panicLevel += 0.1;
        keywords.push(keyword);
      }
    });

    // Check positive keywords
    let positiveScore = 0;
    positiveKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        positiveScore += 0.2;
      }
    });

    panicLevel = Math.min(panicLevel, 1);

    if (panicLevel >= 0.5) {
      sentiment = 'PANIC';
    } else if (panicLevel >= 0.3 || positiveScore < 0.1) {
      sentiment = 'NEGATIVE';
    } else if (positiveScore >= 0.3) {
      sentiment = 'POSITIVE';
    }

    return {
      sentiment,
      confidence: 0.6, // Lower confidence for fallback
      panicLevel,
      urgency: panicLevel >= 0.7 ? 'CRITICAL' : panicLevel >= 0.5 ? 'HIGH' : panicLevel >= 0.3 ? 'MEDIUM' : 'LOW',
      keywords,
      emotions: [],
      needsAttention: panicLevel >= 0.5,
    };
  }

  /**
   * Calculate engagement score
   */
  private calculateEngagement(metrics?: TwitterTweet['public_metrics']): number {
    if (!metrics) return 0;

    return (
      (metrics.retweet_count || 0) * 3 +
      (metrics.reply_count || 0) * 2 +
      (metrics.like_count || 0) * 1 +
      (metrics.quote_count || 0) * 2
    );
  }

  /**
   * Aggregate sentiment from multiple signals
   */
  private aggregateSentiment(eventId: string, signals: SocialSignal[]): AggregatedSentiment {
    const distribution = {
      positive: 0,
      neutral: 0,
      negative: 0,
      panic: 0,
    };

    let totalPanicLevel = 0;
    const allKeywords: string[] = [];

    signals.forEach(signal => {
      const sentiment = signal.sentiment.sentiment.toLowerCase();
      if (sentiment === 'positive') distribution.positive++;
      else if (sentiment === 'neutral') distribution.neutral++;
      else if (sentiment === 'negative') distribution.negative++;
      else if (sentiment === 'panic') distribution.panic++;

      totalPanicLevel += signal.sentiment.panicLevel;
      allKeywords.push(...signal.sentiment.keywords);
    });

    const averagePanicLevel = signals.length > 0 ? totalPanicLevel / signals.length : 0;

    // Count keyword frequency
    const keywordCounts = new Map<string, number>();
    allKeywords.forEach(keyword => {
      keywordCounts.set(keyword, (keywordCounts.get(keyword) || 0) + 1);
    });

    // Get top 10 keywords
    const topKeywords = Array.from(keywordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([keyword]) => keyword);

    const needsAttention = averagePanicLevel >= 0.5 || distribution.panic >= 3;
    const alerts: string[] = [];

    if (needsAttention) {
      if (averagePanicLevel >= 0.7) {
        alerts.push('CRITICAL: High panic level detected in social media');
      } else if (averagePanicLevel >= 0.5) {
        alerts.push('WARNING: Elevated panic indicators on social media');
      }

      if (distribution.panic >= 5) {
        alerts.push(`WARNING: ${distribution.panic} panic-related posts detected`);
      }
    }

    return {
      eventId,
      timestamp: new Date(),
      totalTweets: signals.length,
      sentimentDistribution: distribution,
      averagePanicLevel,
      topKeywords,
      needsAttention,
      alerts,
    };
  }

  /**
   * Store social signals to BigQuery
   */
  private async storeToBigQuery(
    eventId: string,
    signals: SocialSignal[],
    aggregated: AggregatedSentiment
  ): Promise<void> {
    try {
      // Stream individual signals for detailed analytics
      for (const signal of signals) {
        await bigQueryAnalyticsService.streamSocialMediaData({
          eventId,
          platform: 'twitter',
          postId: signal.id,
          timestamp: signal.timestamp,
          content: signal.text,
          sentiment: signal.sentiment.sentiment === 'PANIC'
            ? 'negative'
            : signal.sentiment.sentiment.toLowerCase() as 'positive' | 'negative' | 'neutral',
          sentimentScore: signal.sentiment.confidence,
          panicLevel: signal.sentiment.panicLevel,
          keywords: signal.sentiment.keywords,
        });
      }

      console.log(`[Social Media] Streamed ${signals.length} signals to BigQuery`);
    } catch (error) {
      console.error('[Social Media] Error storing to BigQuery:', error);
    }
  }

  /**
   * Trigger alerts for high panic levels
   */
  private async triggerAlerts(eventId: string, aggregated: AggregatedSentiment): Promise<void> {
    try {
      // Publish alert to Pub/Sub
      await pubSubService.publishMessage('emergency-alerts', {
        eventId,
        type: 'SOCIAL_PANIC',
        severity: aggregated.averagePanicLevel >= 0.7 ? 'CRITICAL' : 'HIGH',
        source: 'social_media',
        alerts: aggregated.alerts,
        panicLevel: aggregated.averagePanicLevel,
        timestamp: new Date().toISOString(),
      });

      // Emit WebSocket alert
      io.to(`event:${eventId}`).emit('alert:social-panic', {
        severity: aggregated.averagePanicLevel >= 0.7 ? 'CRITICAL' : 'HIGH',
        message: aggregated.alerts[0],
        panicLevel: aggregated.averagePanicLevel,
        timestamp: new Date(),
      });

    } catch (error) {
      console.error('[Social Media] Error triggering alerts:', error);
    }
  }

  /**
   * Get real-time sentiment for an event
   */
  async getCurrentSentiment(eventId: string): Promise<AggregatedSentiment | null> {
    // This would typically query recent data from cache or database
    // For now, return null (would be populated by monitoring)
    return null;
  }

  /**
   * Manual sentiment analysis for a single text
   */
  async analyzeText(text: string): Promise<SentimentAnalysis> {
    return this.analyzeSentiment(text);
  }
}

export const socialMediaMonitoringService = new SocialMediaMonitoringService();
export default socialMediaMonitoringService;
