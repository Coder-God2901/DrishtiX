/**
 * Cloud Monitoring Service
 * Integration with Google Cloud Monitoring for system health
 */


// Import only in Node.js environment, not in browser
let MetricServiceClient: any;
if (typeof window === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  MetricServiceClient = require('@google-cloud/monitoring').MetricServiceClient;
}


export class CloudMonitoringService {
  private client: any;
  private projectId: string;

  constructor() {
    if (typeof window === 'undefined' && MetricServiceClient) {
      this.client = new MetricServiceClient();
    } else {
      this.client = null;
    }
    // Support both Vite and Node.js env
    this.projectId =
      (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GOOGLE_CLOUD_PROJECT_ID) ||
      process.env.VITE_GOOGLE_CLOUD_PROJECT_ID ||
      process.env.GOOGLE_CLOUD_PROJECT ||
      '';
  }

  async recordMetric(metricType: string, value: number, labels: Record<string, string> = {}): Promise<void> {
    if (!this.client || !this.projectId) {
      // Not available in browser or missing config
      return;
    }
    const projectName = this.client.projectPath(this.projectId);

    const dataPoint = {
      interval: {
        endTime: { seconds: Math.floor(Date.now() / 1000) }
      },
      value: { doubleValue: value }
    };

    const timeSeries = {
      metric: {
        type: `custom.googleapis.com/${metricType}`,
        labels
      },
      resource: {
        type: 'global',
        labels: { project_id: this.projectId }
      },
      points: [dataPoint]
    };

    await this.client.createTimeSeries({
      name: projectName,
      timeSeries: [timeSeries]
    });
  }

  async getMetrics(metricType: string, hours: number = 24): Promise<any[]> {
    if (!this.client || !this.projectId) {
      return [];
    }
    // Example: fetch time series data for the given metricType in the last N hours
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000);
    const request = {
      name: this.client.projectPath(this.projectId),
      filter: `metric.type = "custom.googleapis.com/${metricType}"`,
      interval: {
        startTime: { seconds: Math.floor(startTime.getTime() / 1000) },
        endTime: { seconds: Math.floor(endTime.getTime() / 1000) }
      },
      view: 'FULL'
    };
    const [timeSeries] = await this.client.listTimeSeries(request);
    return timeSeries || [];
  }
}

export default CloudMonitoringService;
