/**
 * Social Signals Service
 * 
 * Monitors social media (Twitter/X) for crowd sentiment analysis
 * Integrates with Gemini Pro for NLP sentiment detection
 * Publishes to Pub/Sub for real-time panic level tracking
 * 
 * Features:
 * - Twitter API v2 streaming and search
 * - Gemini Pro sentiment analysis
 * - Real-time panic level detection
 * - Keyword-based event monitoring
 * - Pub/Sub integration for alerts
 * - Historical sentiment trends
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { PubSubService } from './pubsub.service';

// Twitter API v2 types
interface TwitterTweet {
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

interface TwitterSearchResponse {
  data: TwitterTweet[];
  meta: {
    newest_id: string;
    oldest_id: string;
    result_count: number;
    next_token?: string;
  };
}

// Sentiment analysis types
export enum SentimentType {
  VERY_POSITIVE = 'very_positive',
  POSITIVE = 'positive',
  NEUTRAL = 'neutral',
  NEGATIVE = 'negative',
  VERY_NEGATIVE = 'very_negative',
  PANIC = 'panic'
}

export interface SentimentAnalysis {
  sentiment: SentimentType;
  confidence: number;
  panicLevel: number; // 0-100
  urgency: 'low' | 'medium' | 'high' | 'critical';
  keywords: string[];
  emotions: string[];
  needsAttention: boolean;
}

export interface SocialSignal {
  id: string;
  source: 'twitter' | 'facebook' | 'instagram' | 'manual';
  text: string;
  authorId: string;
  timestamp: Date;
  location?: {
    lat: number;
    lng: number;
    placeName?: string;
  };
  sentiment: SentimentAnalysis;
  metrics?: {
    engagement: number;
    reach: number;
  };
  eventId?: string;
}

interface MonitoringConfig {
  keywords: string[];
  hashtags: string[];
  geolocation?: {
    lat: number;
    lng: number;
    radius: string; // e.g., "5km"
  };
  language?: string;
}

export class SocialSignalsService {
  private genAI: GoogleGenerativeAI;
  private pubsubService: PubSubService;
  private twitterBearerToken: string;
  private monitoringActive: boolean = false;
  private streamController?: AbortController;

  // Twitter API endpoints
  private readonly TWITTER_API_BASE = 'https://api.twitter.com/2';

  // Panic detection keywords
  private readonly PANIC_KEYWORDS = [
    'help', 'emergency', 'danger', 'fire', 'fight', 'crush',
    'stampede', 'panic', 'scared', 'trapped', 'injured', 'ambulance',
    'police', 'evacuation', 'chaos', 'violence', 'attack'
  ];

  // Negative sentiment keywords
  private readonly NEGATIVE_KEYWORDS = [
    'crowded', 'stuck', 'slow', 'hot', 'uncomfortable', 'angry',
    'frustrated', 'disappointed', 'terrible', 'awful', 'horrible'
  ];

  constructor() {
    const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
    this.twitterBearerToken = import.meta.env.TWITTER_BEARER_TOKEN || '';

    if (!geminiApiKey) {
      console.warn('Gemini API key not found. Sentiment analysis will use fallback.');
    }

    if (!this.twitterBearerToken) {
      console.warn('Twitter Bearer Token not found. Social monitoring disabled.');
    }

    this.genAI = new GoogleGenerativeAI(geminiApiKey || '');
    this.pubsubService = new PubSubService();
  }

  /**
   * Start monitoring social media for an event
   */
  async startMonitoring(eventId: string, config: MonitoringConfig): Promise<void> {
    if (!this.twitterBearerToken) {
      throw new Error('Twitter Bearer Token not configured');
    }

    console.log(`Starting social media monitoring for event: ${eventId}`);
    this.monitoringActive = true;
    this.streamController = new AbortController();

    // Build search query
    const query = this.buildSearchQuery(config);

    // Start polling (Twitter API v2 filtered stream requires elevated access)
    // Using search instead for essential access tier
    await this.pollTwitterSearch(eventId, query, config);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    console.log('Stopping social media monitoring');
    this.monitoringActive = false;
    if (this.streamController) {
      this.streamController.abort();
    }
  }

  /**
   * Build Twitter search query
   */
  private buildSearchQuery(config: MonitoringConfig): string {
    const parts: string[] = [];

    // Add keywords
    if (config.keywords.length > 0) {
      const keywordQuery = config.keywords.map(k => `"${k}"`).join(' OR ');
      parts.push(`(${keywordQuery})`);
    }

    // Add hashtags
    if (config.hashtags.length > 0) {
      const hashtagQuery = config.hashtags.map(h => `#${h.replace('#', '')}`).join(' OR ');
      parts.push(`(${hashtagQuery})`);
    }

    // Add geolocation filter
    if (config.geolocation) {
      const { lat, lng, radius } = config.geolocation;
      parts.push(`point_radius:[${lng} ${lat} ${radius}]`);
    }

    // Exclude retweets for cleaner data
    parts.push('-is:retweet');

    // Language filter
    if (config.language) {
      parts.push(`lang:${config.language}`);
    }

    return parts.join(' ');
  }

  /**
   * Poll Twitter search API
   */
  private async pollTwitterSearch(
    eventId: string,
    query: string,
    config: MonitoringConfig
  ): Promise<void> {
    const pollInterval = 30000; // 30 seconds
    let sinceId: string | undefined;

    while (this.monitoringActive) {
      try {
        const tweets = await this.searchTweets(query, sinceId);

        if (tweets.data && tweets.data.length > 0) {
          // Update sinceId for next poll
          sinceId = tweets.meta.newest_id;

          // Process tweets
          for (const tweet of tweets.data) {
            await this.processTweet(tweet, eventId);
          }
        }

        // Wait before next poll
        await this.sleep(pollInterval);

      } catch (error) {
        console.error('Error polling Twitter:', error);
        await this.sleep(pollInterval * 2); // Back off on error
      }
    }
  }

  /**
   * Search tweets using Twitter API v2
   */
  private async searchTweets(
    query: string,
    sinceId?: string
  ): Promise<TwitterSearchResponse> {
    const params = new URLSearchParams({
      query,
      max_results: '100',
      'tweet.fields': 'created_at,author_id,public_metrics,geo',
      'user.fields': 'username,name',
      expansions: 'author_id,geo.place_id'
    });

    if (sinceId) {
      params.append('since_id', sinceId);
    }

    const response = await fetch(
      `${this.TWITTER_API_BASE}/tweets/search/recent?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${this.twitterBearerToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Twitter API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Process individual tweet
   */
  private async processTweet(tweet: TwitterTweet, eventId: string): Promise<void> {
    try {
      // Analyze sentiment
      const sentiment = await this.analyzeSentiment(tweet.text);

      // Create social signal
      const signal: SocialSignal = {
        id: tweet.id,
        source: 'twitter',
        text: tweet.text,
        authorId: tweet.author_id,
        timestamp: new Date(tweet.created_at),
        sentiment,
        metrics: tweet.public_metrics ? {
          engagement: (tweet.public_metrics.like_count || 0) +
            (tweet.public_metrics.retweet_count || 0) +
            (tweet.public_metrics.reply_count || 0),
          reach: tweet.public_metrics.retweet_count || 0
        } : undefined,
        eventId
      };

      // Extract location if available
      if (tweet.geo?.coordinates) {
        signal.location = {
          lng: tweet.geo.coordinates.coordinates[0],
          lat: tweet.geo.coordinates.coordinates[1]
        };
      }

      // Publish to Pub/Sub if needs attention
      if (sentiment.needsAttention) {
        await this.publishSignal(signal);
      }

      // Store in database (would integrate with backend)
      console.log('Processed social signal:', {
        id: signal.id,
        sentiment: sentiment.sentiment,
        panicLevel: sentiment.panicLevel,
        urgency: sentiment.urgency
      });

    } catch (error) {
      console.error('Error processing tweet:', tweet.id, error);
    }
  }

  /**
   * Analyze sentiment using Gemini Pro
   */
  async analyzeSentiment(text: string): Promise<SentimentAnalysis> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = `Analyze the sentiment and urgency of this social media post from an event attendee.

Post: "${text}"

Provide analysis in this JSON format (respond with ONLY valid JSON, no markdown):
{
  "sentiment": "very_positive|positive|neutral|negative|very_negative|panic",
  "confidence": 0.0-1.0,
  "panicLevel": 0-100,
  "urgency": "low|medium|high|critical",
  "keywords": ["keyword1", "keyword2"],
  "emotions": ["emotion1", "emotion2"],
  "needsAttention": true/false
}

Guidelines:
- sentiment: Overall emotional tone
- confidence: How confident you are in the assessment (0.0-1.0)
- panicLevel: 0=calm, 100=extreme panic
- urgency: How quickly this needs attention
- keywords: Important words indicating sentiment
- emotions: Detected emotional states
- needsAttention: true if requires immediate review (panic, emergency, safety concern)`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let analysisText = response.text().trim();

      // Remove markdown code blocks if present
      analysisText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      const analysis = JSON.parse(analysisText);

      return {
        sentiment: analysis.sentiment as SentimentType,
        confidence: analysis.confidence,
        panicLevel: analysis.panicLevel,
        urgency: analysis.urgency,
        keywords: analysis.keywords || [],
        emotions: analysis.emotions || [],
        needsAttention: analysis.needsAttention
      };

    } catch (error) {
      console.error('Error analyzing sentiment with Gemini:', error);
      return this.fallbackSentimentAnalysis(text);
    }
  }

  /**
   * Fallback sentiment analysis using keywords
   */
  private fallbackSentimentAnalysis(text: string): SentimentAnalysis {
    const lowerText = text.toLowerCase();

    // Check for panic keywords
    const panicMatches = this.PANIC_KEYWORDS.filter(k => lowerText.includes(k));
    const negativeMatches = this.NEGATIVE_KEYWORDS.filter(k => lowerText.includes(k));

    let sentiment: SentimentType = SentimentType.NEUTRAL;
    let panicLevel = 0;
    let urgency: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let needsAttention = false;

    if (panicMatches.length > 0) {
      sentiment = SentimentType.PANIC;
      panicLevel = Math.min(100, panicMatches.length * 30 + 40);
      urgency = 'critical';
      needsAttention = true;
    } else if (negativeMatches.length >= 3) {
      sentiment = SentimentType.VERY_NEGATIVE;
      panicLevel = Math.min(60, negativeMatches.length * 15);
      urgency = 'high';
      needsAttention = true;
    } else if (negativeMatches.length > 0) {
      sentiment = SentimentType.NEGATIVE;
      panicLevel = negativeMatches.length * 10;
      urgency = 'medium';
    }

    return {
      sentiment,
      confidence: 0.6, // Lower confidence for fallback
      panicLevel,
      urgency,
      keywords: [...panicMatches, ...negativeMatches],
      emotions: sentiment === SentimentType.PANIC ? ['fear', 'panic'] :
        sentiment === SentimentType.VERY_NEGATIVE ? ['anger', 'frustration'] : [],
      needsAttention
    };
  }

  /**
   * Publish social signal to Pub/Sub
   */
  private async publishSignal(signal: SocialSignal): Promise<void> {
    try {
      await this.pubsubService.publishSocialSignal({
        signalId: signal.id,
        source: signal.source,
        text: signal.text,
        sentiment: signal.sentiment.sentiment,
        panicLevel: signal.sentiment.panicLevel,
        urgency: signal.sentiment.urgency,
        location: signal.location,
        timestamp: signal.timestamp.toISOString(),
        metadata: {
          authorId: signal.authorId,
          keywords: signal.sentiment.keywords,
          emotions: signal.sentiment.emotions,
          engagement: signal.metrics?.engagement || 0
        }
      });

      console.log('Published social signal to Pub/Sub:', signal.id);

    } catch (error) {
      console.error('Error publishing social signal:', error);
    }
  }

  /**
   * Analyze sentiment trends over time
   */
  async analyzeSentimentTrends(
    signals: SocialSignal[],
    timeWindow: number = 300000 // 5 minutes
  ): Promise<{
    averagePanicLevel: number;
    trendDirection: 'increasing' | 'stable' | 'decreasing';
    criticalSignals: number;
    recommendation: string;
  }> {
    const now = Date.now();
    const recentSignals = signals.filter(
      s => now - s.timestamp.getTime() <= timeWindow
    );

    if (recentSignals.length === 0) {
      return {
        averagePanicLevel: 0,
        trendDirection: 'stable',
        criticalSignals: 0,
        recommendation: 'No recent social signals'
      };
    }

    // Calculate average panic level
    const averagePanicLevel = recentSignals.reduce(
      (sum, s) => sum + s.sentiment.panicLevel, 0
    ) / recentSignals.length;

    // Count critical signals
    const criticalSignals = recentSignals.filter(
      s => s.sentiment.urgency === 'critical'
    ).length;

    // Determine trend
    const halfPoint = Math.floor(recentSignals.length / 2);
    const firstHalf = recentSignals.slice(0, halfPoint);
    const secondHalf = recentSignals.slice(halfPoint);

    const firstAvg = firstHalf.reduce((sum, s) => sum + s.sentiment.panicLevel, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, s) => sum + s.sentiment.panicLevel, 0) / secondHalf.length;

    let trendDirection: 'increasing' | 'stable' | 'decreasing';
    if (secondAvg > firstAvg + 10) {
      trendDirection = 'increasing';
    } else if (secondAvg < firstAvg - 10) {
      trendDirection = 'decreasing';
    } else {
      trendDirection = 'stable';
    }

    // Generate recommendation
    let recommendation = '';
    if (criticalSignals >= 3) {
      recommendation = 'URGENT: Multiple critical signals detected. Immediate intervention required.';
    } else if (averagePanicLevel > 60) {
      recommendation = 'HIGH: Elevated panic levels. Increase monitoring and prepare response.';
    } else if (trendDirection === 'increasing' && averagePanicLevel > 40) {
      recommendation = 'MEDIUM: Panic levels trending upward. Monitor closely.';
    } else {
      recommendation = 'LOW: Sentiment within normal parameters.';
    }

    return {
      averagePanicLevel,
      trendDirection,
      criticalSignals,
      recommendation
    };
  }

  /**
   * Get sentiment statistics
   */
  getSentimentStats(signals: SocialSignal[]): {
    total: number;
    byType: Record<SentimentType, number>;
    averagePanicLevel: number;
    needsAttention: number;
  } {
    const stats = {
      total: signals.length,
      byType: {
        [SentimentType.VERY_POSITIVE]: 0,
        [SentimentType.POSITIVE]: 0,
        [SentimentType.NEUTRAL]: 0,
        [SentimentType.NEGATIVE]: 0,
        [SentimentType.VERY_NEGATIVE]: 0,
        [SentimentType.PANIC]: 0
      },
      averagePanicLevel: 0,
      needsAttention: 0
    };

    if (signals.length === 0) return stats;

    let totalPanic = 0;

    signals.forEach(signal => {
      stats.byType[signal.sentiment.sentiment]++;
      totalPanic += signal.sentiment.panicLevel;
      if (signal.sentiment.needsAttention) {
        stats.needsAttention++;
      }
    });

    stats.averagePanicLevel = totalPanic / signals.length;

    return stats;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default SocialSignalsService;
