/**
 * Gemini Vision Service
 * Real-time anomaly detection using Gemini Vision AI
 * Hardware-free panic, fire, violence, and surge detection
 */

import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';
import { gcpConfig } from '../config/gcp.config';
import { drishtiXConfig } from '../config/drishtix.config';

export interface VisionInput {
  eventId: string;
  timestamp: Date;
  imageData?: string; // Base64 encoded image
  videoFrames?: string[]; // Array of base64 frames
  simulationFeed?: SimulationFeedData;
  contextData?: ContextData;
}

export interface SimulationFeedData {
  sceneType: 'concert' | 'marathon' | 'religious' | 'stadium' | 'transport';
  crowdDensity: number;
  location: { lat: number; lon: number };
  weatherCondition: string;
}

export interface ContextData {
  eventType: string;
  expectedCrowd: number;
  currentCrowd: number;
  timeOfDay: string;
  location: string;
}

export interface AnomalyDetectionResult {
  timestamp: Date;
  anomalies: Anomaly[];
  overallSeverity: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  detectionMetrics: DetectionMetrics;
  recommendations: string[];
}

export interface Anomaly {
  type: 'PANIC' | 'FIRE' | 'VIOLENCE' | 'SURGE' | 'STAGNATION' | 'UNUSUAL_PATTERN';
  confidence: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  location?: { lat: number; lon: number; region?: string };
  description: string;
  indicators: string[];
  timestamp: Date;
}

export interface DetectionMetrics {
  panicLevel: number; // 0-1
  fireDetected: boolean;
  fireConfidence: number;
  violenceDetected: boolean;
  violenceConfidence: number;
  surgeDetected: boolean;
  surgeConfidence: number;
  crowdBehavior: 'NORMAL' | 'AGITATED' | 'PANIC' | 'CHAOTIC';
  movementPattern: 'FLOWING' | 'STAGNANT' | 'SURGING' | 'DISPERSING';
}

class GeminiVisionService {
  private genAI: GoogleGenerativeAI;
  private visionModel: any;

  constructor() {
    this.genAI = new GoogleGenerativeAI(gcpConfig.gemini.apiKey);
    this.initializeModel();
  }

  /**
   * Initialize Gemini Vision model
   */
  private initializeModel() {
    this.visionModel = this.genAI.getGenerativeModel({
      model: gcpConfig.gemini.visionModel,
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
      ],
    });
  }

  /**
   * Detect anomalies in crowd scenes
   */
  async detectAnomalies(input: VisionInput): Promise<AnomalyDetectionResult> {
    try {
      // Use simulation if no real image provided
      const imageToAnalyze = input.imageData ||
        (input.simulationFeed ? await this.generateSimulationFrame(input.simulationFeed) : null);

      if (!imageToAnalyze && !input.videoFrames) {
        throw new Error('No visual data provided for analysis');
      }

      // Analyze single image or video frames
      const analysisResults = input.videoFrames
        ? await this.analyzeVideoFrames(input.videoFrames, input.contextData)
        : await this.analyzeSingleImage(imageToAnalyze!, input.contextData);

      // Parse and structure results
      const anomalies = this.parseAnomalies(analysisResults, input.timestamp);
      const metrics = this.extractMetrics(analysisResults);
      const severity = this.calculateOverallSeverity(anomalies);
      const recommendations = this.generateRecommendations(anomalies, metrics);

      return {
        timestamp: input.timestamp,
        anomalies,
        overallSeverity: severity,
        detectionMetrics: metrics,
        recommendations,
      };
    } catch (error) {
      console.error('Gemini Vision anomaly detection error:', error);
      throw new Error(`Anomaly detection failed: ${error}`);
    }
  }

  /**
   * Analyze a single image
   */
  private async analyzeSingleImage(
    imageData: string,
    context?: ContextData
  ): Promise<any> {
    const prompt = this.buildAnalysisPrompt(context);

    const imageParts = [
      {
        inlineData: {
          data: imageData.replace(/^data:image\/\w+;base64,/, ''),
          mimeType: 'image/jpeg',
        },
      },
    ];

    const result = await this.visionModel.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    return response.text();
  }

  /**
   * Analyze video frames
   */
  private async analyzeVideoFrames(
    frames: string[],
    context?: ContextData
  ): Promise<any> {
    // Analyze every 3rd frame to reduce API calls
    const sampled = frames.filter((_, i) => i % 3 === 0);

    const results = await Promise.all(
      sampled.map(frame => this.analyzeSingleImage(frame, context))
    );

    // Aggregate results
    return this.aggregateFrameAnalysis(results);
  }

  /**
   * Build comprehensive analysis prompt
   */
  private buildAnalysisPrompt(context?: ContextData): string {
    const basePrompt = `
You are an expert crowd safety AI analyzer for the DrishtiX platform. Analyze this crowd scene image and provide a detailed safety assessment.

**CRITICAL DETECTION PRIORITIES:**
1. **PANIC DETECTION**: Identify signs of panic, stampede risk, or chaotic crowd behavior
   - Rapid, uncontrolled movement
   - Falling individuals
   - Pushing, shoving, or compression
   - Facial expressions of fear or distress
   - People running away from a central point

2. **FIRE DETECTION**: Look for any signs of fire, smoke, or burning
   - Visible flames
   - Smoke plumes
   - People fleeing from a specific area
   - Emergency response activity

3. **VIOLENCE DETECTION**: Identify physical altercations or dangerous behavior
   - Fighting or physical confrontations
   - Aggressive gestures
   - Weapons visible
   - Security personnel intervention

4. **CROWD SURGE DETECTION**: Analyze crowd movement patterns
   - High-density waves moving in one direction
   - Bottlenecks forming at exits or entrances
   - Crowd compression against barriers
   - Uneven density distribution

5. **UNUSUAL PATTERNS**: Any other safety concerns
   - Medical emergencies
   - Structural issues
   - Unauthorized access
   - Suspicious objects

**ANALYSIS REQUIREMENTS:**
- Provide confidence scores (0-100%) for each detection
- Describe specific visual indicators observed
- Assess crowd density and movement patterns
- Rate overall severity: NONE, LOW, MEDIUM, HIGH, or CRITICAL
- Classify crowd behavior: NORMAL, AGITATED, PANIC, or CHAOTIC
- Classify movement: FLOWING, STAGNANT, SURGING, or DISPERSING

**OUTPUT FORMAT (JSON):**
{
  "panic": {
    "detected": boolean,
    "confidence": number,
    "indicators": string[],
    "severity": string
  },
  "fire": {
    "detected": boolean,
    "confidence": number,
    "indicators": string[]
  },
  "violence": {
    "detected": boolean,
    "confidence": number,
    "indicators": string[]
  },
  "surge": {
    "detected": boolean,
    "confidence": number,
    "indicators": string[],
    "direction": string
  },
  "crowdBehavior": string,
  "movementPattern": string,
  "crowdDensity": number,
  "unusualPatterns": [
    {
      "type": string,
      "description": string,
      "confidence": number
    }
  ],
  "overallAssessment": string
}
`;

    if (context) {
      return `${basePrompt}

**EVENT CONTEXT:**
- Event Type: ${context.eventType}
- Expected Crowd: ${context.expectedCrowd}
- Current Crowd: ${context.currentCrowd}
- Time: ${context.timeOfDay}
- Location: ${context.location}

Use this context to inform your analysis.`;
    }

    return basePrompt;
  }

  /**
   * Generate simulation frame (hardware-free mode)
   */
  private async generateSimulationFrame(simulation: SimulationFeedData): Promise<string> {
    // In production, this would integrate with Earth Engine or generate synthetic frames
    // For now, return a placeholder that indicates simulation mode

    const prompt = `
Generate a detailed textual description of a ${simulation.sceneType} crowd scene with:
- Crowd density: ${simulation.crowdDensity * 100}%
- Weather: ${simulation.weatherCondition}
- Location: ${simulation.location.lat}, ${simulation.location.lon}

Describe what a camera would see in this scenario, including:
- Crowd distribution and movement
- Environmental conditions
- Potential safety concerns based on density
- Key visual features
`;

    const result = await this.visionModel.generateContent(prompt);
    const response = await result.response;

    // Return simulation marker with description
    return `SIMULATION:${response.text()}`;
  }

  /**
   * Parse anomalies from AI response
   */
  private parseAnomalies(analysisText: string, timestamp: Date): Anomaly[] {
    const anomalies: Anomaly[] = [];

    try {
      // Extract JSON from response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn('Could not parse JSON from Gemini response');
        return anomalies;
      }

      const analysis = JSON.parse(jsonMatch[0]);

      // Panic detection
      if (analysis.panic?.detected && analysis.panic.confidence >= drishtiXConfig.anomalyDetection.thresholds.panic * 100) {
        anomalies.push({
          type: 'PANIC',
          confidence: analysis.panic.confidence / 100,
          severity: analysis.panic.severity || 'MEDIUM',
          description: 'Panic behavior detected in crowd',
          indicators: analysis.panic.indicators || [],
          timestamp,
        });
      }

      // Fire detection
      if (analysis.fire?.detected && analysis.fire.confidence >= drishtiXConfig.anomalyDetection.thresholds.fire * 100) {
        anomalies.push({
          type: 'FIRE',
          confidence: analysis.fire.confidence / 100,
          severity: 'CRITICAL',
          description: 'Fire or smoke detected',
          indicators: analysis.fire.indicators || [],
          timestamp,
        });
      }

      // Violence detection
      if (analysis.violence?.detected && analysis.violence.confidence >= drishtiXConfig.anomalyDetection.thresholds.violence * 100) {
        anomalies.push({
          type: 'VIOLENCE',
          confidence: analysis.violence.confidence / 100,
          severity: 'HIGH',
          description: 'Violent behavior or altercation detected',
          indicators: analysis.violence.indicators || [],
          timestamp,
        });
      }

      // Surge detection
      if (analysis.surge?.detected && analysis.surge.confidence >= drishtiXConfig.anomalyDetection.thresholds.surge * 100) {
        anomalies.push({
          type: 'SURGE',
          confidence: analysis.surge.confidence / 100,
          severity: 'HIGH',
          description: `Crowd surge detected moving ${analysis.surge.direction || 'unknown direction'}`,
          indicators: analysis.surge.indicators || [],
          timestamp,
        });
      }

      // Unusual patterns
      if (analysis.unusualPatterns) {
        for (const pattern of analysis.unusualPatterns) {
          if (pattern.confidence >= 60) {
            anomalies.push({
              type: 'UNUSUAL_PATTERN',
              confidence: pattern.confidence / 100,
              severity: 'MEDIUM',
              description: pattern.description,
              indicators: [pattern.type],
              timestamp,
            });
          }
        }
      }
    } catch (error) {
      console.error('Error parsing anomalies:', error);
    }

    return anomalies;
  }

  /**
   * Extract detection metrics
   */
  private extractMetrics(analysisText: string): DetectionMetrics {
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return this.getDefaultMetrics();
      }

      const analysis = JSON.parse(jsonMatch[0]);

      return {
        panicLevel: analysis.panic?.confidence ? analysis.panic.confidence / 100 : 0,
        fireDetected: analysis.fire?.detected || false,
        fireConfidence: analysis.fire?.confidence ? analysis.fire.confidence / 100 : 0,
        violenceDetected: analysis.violence?.detected || false,
        violenceConfidence: analysis.violence?.confidence ? analysis.violence.confidence / 100 : 0,
        surgeDetected: analysis.surge?.detected || false,
        surgeConfidence: analysis.surge?.confidence ? analysis.surge.confidence / 100 : 0,
        crowdBehavior: analysis.crowdBehavior || 'NORMAL',
        movementPattern: analysis.movementPattern || 'FLOWING',
      };
    } catch (error) {
      return this.getDefaultMetrics();
    }
  }

  /**
   * Get default metrics
   */
  private getDefaultMetrics(): DetectionMetrics {
    return {
      panicLevel: 0,
      fireDetected: false,
      fireConfidence: 0,
      violenceDetected: false,
      violenceConfidence: 0,
      surgeDetected: false,
      surgeConfidence: 0,
      crowdBehavior: 'NORMAL',
      movementPattern: 'FLOWING',
    };
  }

  /**
   * Aggregate analysis from multiple frames
   */
  private aggregateFrameAnalysis(results: any[]): any {
    // Combine all results and take the maximum severity/confidence
    const aggregated: any = {
      panic: { detected: false, confidence: 0, indicators: [], severity: 'NONE' },
      fire: { detected: false, confidence: 0, indicators: [] },
      violence: { detected: false, confidence: 0, indicators: [] },
      surge: { detected: false, confidence: 0, indicators: [], direction: '' },
      crowdBehavior: 'NORMAL',
      movementPattern: 'FLOWING',
      unusualPatterns: [],
    };

    for (const result of results) {
      try {
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (!jsonMatch) continue;

        const analysis = JSON.parse(jsonMatch[0]);

        // Take max confidence for each category
        if (analysis.panic?.confidence > aggregated.panic.confidence) {
          aggregated.panic = analysis.panic;
        }
        if (analysis.fire?.confidence > aggregated.fire.confidence) {
          aggregated.fire = analysis.fire;
        }
        if (analysis.violence?.confidence > aggregated.violence.confidence) {
          aggregated.violence = analysis.violence;
        }
        if (analysis.surge?.confidence > aggregated.surge.confidence) {
          aggregated.surge = analysis.surge;
        }

        // Escalate crowd behavior if worse
        const behaviorPriority = ['NORMAL', 'AGITATED', 'PANIC', 'CHAOTIC'];
        if (behaviorPriority.indexOf(analysis.crowdBehavior) > behaviorPriority.indexOf(aggregated.crowdBehavior)) {
          aggregated.crowdBehavior = analysis.crowdBehavior;
        }

        // Collect unusual patterns
        if (analysis.unusualPatterns) {
          aggregated.unusualPatterns.push(...analysis.unusualPatterns);
        }
      } catch (error) {
        console.error('Error aggregating frame:', error);
      }
    }

    return JSON.stringify(aggregated);
  }

  /**
   * Calculate overall severity
   */
  private calculateOverallSeverity(anomalies: Anomaly[]): 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (anomalies.length === 0) return 'NONE';

    const hasCritical = anomalies.some(a => a.severity === 'CRITICAL');
    const hasHigh = anomalies.some(a => a.severity === 'HIGH');
    const hasMedium = anomalies.some(a => a.severity === 'MEDIUM');

    if (hasCritical) return 'CRITICAL';
    if (hasHigh) return 'HIGH';
    if (hasMedium) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(anomalies: Anomaly[], metrics: DetectionMetrics): string[] {
    const recommendations: string[] = [];

    // Fire response
    if (metrics.fireDetected) {
      recommendations.push('IMMEDIATE: Activate fire emergency protocol');
      recommendations.push('Evacuate area immediately via designated emergency exits');
      recommendations.push('Alert fire department and on-site emergency response team');
    }

    // Panic response
    if (metrics.panicLevel > 0.7) {
      recommendations.push('Deploy crowd management teams to affected areas');
      recommendations.push('Use PA systems to calm crowd and provide clear instructions');
      recommendations.push('Open additional exit routes to reduce pressure');
    }

    // Violence response
    if (metrics.violenceDetected) {
      recommendations.push('Dispatch security personnel to incident location');
      recommendations.push('Isolate affected area and reroute crowd flow');
      recommendations.push('Prepare medical assistance for potential casualties');
    }

    // Surge response
    if (metrics.surgeDetected) {
      recommendations.push('Create counter-flow barriers to break surge momentum');
      recommendations.push('Close entry points to prevent additional crowd influx');
      recommendations.push('Monitor for potential stampede conditions');
    }

    // General crowd management
    if (metrics.crowdBehavior === 'AGITATED' || metrics.crowdBehavior === 'CHAOTIC') {
      recommendations.push('Increase visible security presence');
      recommendations.push('Provide clear wayfinding and communication');
      recommendations.push('Consider temporary event pause if conditions worsen');
    }

    if (recommendations.length === 0) {
      recommendations.push('Continue standard monitoring protocols');
      recommendations.push('Maintain preventive crowd management measures');
    }

    return recommendations;
  }
}

export const geminiVisionService = new GeminiVisionService();
export default geminiVisionService;
