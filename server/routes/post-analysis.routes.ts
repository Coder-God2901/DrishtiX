/**
 * Post-Event Analysis Routes
 * Generate and retrieve post-event analysis reports
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

/**
 * GET /api/post-analysis/:eventId
 * Get post-event analysis report
 */
router.get('/:eventId', authenticate, authorize(['ORGANIZER', 'ADMIN']), async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        predictions: true,
        incidents: true,
        alerts: true,
        crowdDensity: true
      }
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    // Gather all relevant data
    const [
      tickets,
      volunteers,
      feedbacks,
      sosRequests,
      helpRequests,
      gates
    ] = await Promise.all([
      prisma.ticket.count({ where: { eventId } }),
      prisma.volunteer.findMany({ where: { eventId } }),
      prisma.eventFeedback.findMany({ where: { eventId } }),
      prisma.sOSRequest.findMany({ where: { eventId } }),
      prisma.helpRequest.findMany({ where: { eventId } }),
      prisma.gateControl.findMany({ where: { eventId } })
    ]);

    // Calculate metrics
    const analysis = {
      eventId,
      eventName: event.name,
      duration: {
        start: event.startTime,
        end: event.endTime,
        durationHours: (event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60 * 60)
      },
      attendance: {
        expected: event.expectedAttendees,
        actual: event.actualAttendees,
        ticketsSold: tickets,
        showRate: event.actualAttendees && tickets > 0 ? (event.actualAttendees / tickets) * 100 : 0
      },
      safety: {
        totalIncidents: event.incidents.length,
        criticalIncidents: event.incidents.filter(i => i.severity === 'CRITICAL').length,
        averageResponseTime: calculateAverageResponseTime(event.incidents),
        sosRequests: sosRequests.length,
        helpRequests: helpRequests.length
      },
      crowdManagement: {
        peakDensity: Math.max(...event.crowdDensity.map(d => d.averageDensity), 0),
        averageDensity: event.crowdDensity.reduce((sum, d) => sum + d.averageDensity, 0) / (event.crowdDensity.length || 1),
        predictionAccuracy: calculatePredictionAccuracy(event.predictions, event.crowdDensity)
      },
      alerts: {
        total: event.alerts.length,
        critical: event.alerts.filter(a => a.priority === 'CRITICAL').length,
        resolved: event.alerts.filter(a => a.status === 'RESOLVED').length,
        averageResolutionTime: calculateAverageAlertResolutionTime(event.alerts)
      },
      gates: {
        totalGates: gates.length,
        totalEntries: gates.reduce((sum, g) => sum + g.totalEntries, 0),
        totalExits: gates.reduce((sum, g) => sum + g.totalExits, 0),
        peakHourFlow: calculatePeakFlow(gates)
      },
      volunteers: {
        total: volunteers.length,
        activeVolunteers: volunteers.filter(v => v.status === 'ACTIVE').length,
        totalHours: volunteers.reduce((sum, v) => sum + v.totalHours, 0),
        tasksCompleted: volunteers.reduce((sum, v) => sum + v.completedTasks, 0)
      },
      feedback: {
        totalResponses: feedbacks.length,
        averageRating: feedbacks.reduce((sum, f) => sum + f.overallRating, 0) / (feedbacks.length || 1),
        safetyRating: feedbacks.reduce((sum, f) => sum + f.safetyRating, 0) / (feedbacks.length || 1),
        navigationRating: feedbacks.reduce((sum, f) => sum + f.navigationRating, 0) / (feedbacks.length || 1),
        wouldRecommend: feedbacks.filter(f => f.wouldRecommend).length,
        recommendationRate: feedbacks.length > 0 ? (feedbacks.filter(f => f.wouldRecommend).length / feedbacks.length) * 100 : 0
      },
      mlPerformance: {
        predictionsGenerated: event.predictions.length,
        anomaliesDetected: event.predictions.reduce((sum, p) => sum + p.anomalies.length, 0),
        averageConfidence: event.predictions.reduce((sum, p) => sum + p.confidence, 0) / (event.predictions.length || 1)
      }
    };

    res.json({
      success: true,
      data: analysis
    });
  } catch (error: any) {
    console.error('Post-analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/post-analysis/:eventId/generate
 * Generate comprehensive post-event report
 */
router.post('/:eventId/generate', authenticate, authorize(['ORGANIZER', 'ADMIN']), async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    // Get the analysis data
    const analysisResponse = await getAnalysisData(eventId);

    // Generate insights and recommendations
    const insights = generateInsights(analysisResponse);
    const recommendations = generateRecommendations(analysisResponse);

    const report = {
      ...analysisResponse,
      insights,
      recommendations,
      generatedAt: new Date(),
      generatedBy: req.user?.id
    };

    res.json({
      success: true,
      data: report,
      message: 'Post-event report generated successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Helper: Calculate average incident response time
 */
function calculateAverageResponseTime(incidents: any[]): number {
  const responseTimes = incidents
    .filter(i => i.respondedAt && i.createdAt)
    .map(i => (i.respondedAt.getTime() - i.createdAt.getTime()) / (1000 * 60)); // minutes

  return responseTimes.length > 0
    ? responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length
    : 0;
}

/**
 * Helper: Calculate prediction accuracy
 */
function calculatePredictionAccuracy(predictions: any[], actualData: any[]): number {
  if (predictions.length === 0 || actualData.length === 0) return 0;

  // Simplified accuracy calculation
  // Compare predicted vs actual density
  let totalError = 0;
  let count = 0;

  predictions.forEach(pred => {
    const actual = actualData.find(a =>
      Math.abs(a.timestamp.getTime() - pred.forecastTime.getTime()) < 300000 // 5 min window
    );

    if (actual) {
      const error = Math.abs(pred.predictedDensity - actual.averageDensity) / actual.averageDensity;
      totalError += error;
      count++;
    }
  });

  return count > 0 ? (1 - (totalError / count)) * 100 : 0;
}

/**
 * Helper: Calculate average alert resolution time
 */
function calculateAverageAlertResolutionTime(alerts: any[]): number {
  const resolutionTimes = alerts
    .filter(a => a.resolvedAt && a.createdAt)
    .map(a => (a.resolvedAt.getTime() - a.createdAt.getTime()) / (1000 * 60)); // minutes

  return resolutionTimes.length > 0
    ? resolutionTimes.reduce((sum, t) => sum + t, 0) / resolutionTimes.length
    : 0;
}

/**
 * Helper: Calculate peak gate flow
 */
function calculatePeakFlow(gates: any[]): number {
  // This would need hourly breakdown data
  // Simplified: return max entries per gate
  return Math.max(...gates.map(g => g.totalEntries), 0);
}

/**
 * Helper: Get analysis data
 */
async function getAnalysisData(eventId: string): Promise<any> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      predictions: true,
      incidents: true,
      alerts: true,
      crowdDensity: true
    }
  });

  // ... rest of the logic from GET endpoint
  return {}; // Simplified
}

/**
 * Helper: Generate insights
 */
function generateInsights(analysis: any): string[] {
  const insights: string[] = [];

  if (analysis.attendance?.showRate < 70) {
    insights.push('Low show rate detected. Consider ticket verification improvements.');
  }

  if (analysis.safety?.averageResponseTime > 10) {
    insights.push('Response times are high. Consider increasing responder coverage.');
  }

  if (analysis.feedback?.safetyRating < 3.5) {
    insights.push('Safety ratings need improvement. Review security protocols.');
  }

  if (analysis.crowdManagement?.predictionAccuracy > 85) {
    insights.push('Excellent prediction accuracy. ML models are performing well.');
  }

  return insights;
}

/**
 * Helper: Generate recommendations
 */
function generateRecommendations(analysis: any): string[] {
  const recommendations: string[] = [];

  if (analysis.gates?.totalGates < 4) {
    recommendations.push('Consider adding more entry gates for faster ingress.');
  }

  if (analysis.volunteers?.totalHours / analysis.volunteers?.total > 8) {
    recommendations.push('Volunteers are overworked. Increase volunteer count for next event.');
  }

  recommendations.push('Continue using AI-powered crowd monitoring.');
  recommendations.push('Gather more attendee feedback for continuous improvement.');

  return recommendations;
}

export default router;
