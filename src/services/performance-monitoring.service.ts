/**
 * Performance Monitoring Service
 * 
 * Provides comprehensive performance monitoring, error tracking, and analytics
 * integration for EventSphere application.
 */

import * as Sentry from '@sentry/react';

// Performance metrics interface
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  tags?: Record<string, string>;
}

// Error tracking
export interface ErrorLog {
  message: string;
  stack?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
  timestamp: Date;
  userId?: string;
  url: string;
}

// Analytics event
export interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
  timestamp: Date;
}

class PerformanceMonitoringService {
  private metrics: PerformanceMetric[] = [];
  private errors: ErrorLog[] = [];
  private isInitialized = false;

  /**
   * Initialize performance monitoring
   */
  initialize(config: {
    sentryDsn?: string;
    googleAnalyticsId?: string;
    enableRUM?: boolean; // Real User Monitoring
    sampleRate?: number;
  }) {
    if (this.isInitialized) return;

    // Initialize Sentry for error tracking
    if (config.sentryDsn) {
      Sentry.init({
        dsn: config.sentryDsn,
        integrations: [
          Sentry.browserTracingIntegration(),
          Sentry.replayIntegration(),
        ],
        tracesSampleRate: config.sampleRate || 0.1,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
        environment: import.meta.env.MODE,
      });
    }

    // Initialize Google Analytics
    if (config.googleAnalyticsId) {
      this.initGoogleAnalytics(config.googleAnalyticsId);
    }

    // Setup performance observers
    if (config.enableRUM !== false) {
      this.setupPerformanceObservers();
    }

    // Track initial page load
    this.trackPageLoad();

    this.isInitialized = true;
  }

  /**
   * Initialize Google Analytics
   */
  private initGoogleAnalytics(measurementId: string) {
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    script.async = true;
    document.head.appendChild(script);

    (window as any).dataLayer = (window as any).dataLayer || [];
    function gtag(...args: any[]) {
      (window as any).dataLayer.push(args);
    }
    (window as any).gtag = gtag;

    gtag('js', new Date());
    gtag('config', measurementId);
  }

  /**
   * Setup performance observers
   */
  private setupPerformanceObservers() {
    // Observe Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;

          this.recordMetric({
            name: 'LCP',
            value: lastEntry.renderTime || lastEntry.loadTime,
            unit: 'ms',
            timestamp: new Date(),
          });
        });

        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        console.warn('LCP observer not supported');
      }

      // Observe First Input Delay (FID)
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.recordMetric({
              name: 'FID',
              value: entry.processingStart - entry.startTime,
              unit: 'ms',
              timestamp: new Date(),
            });
          });
        });

        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        console.warn('FID observer not supported');
      }

      // Observe Cumulative Layout Shift (CLS)
      try {
        let clsScore = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsScore += entry.value;
            }
          });

          this.recordMetric({
            name: 'CLS',
            value: clsScore,
            unit: 'score',
            timestamp: new Date(),
          });
        });

        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        console.warn('CLS observer not supported');
      }

      // Observe long tasks
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            this.recordMetric({
              name: 'Long Task',
              value: entry.duration,
              unit: 'ms',
              timestamp: new Date(),
              tags: { name: entry.name },
            });
          });
        });

        longTaskObserver.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        console.warn('Long task observer not supported');
      }
    }
  }

  /**
   * Track page load performance
   */
  private trackPageLoad() {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

        if (perfData) {
          this.recordMetric({
            name: 'DNS Lookup',
            value: perfData.domainLookupEnd - perfData.domainLookupStart,
            unit: 'ms',
            timestamp: new Date(),
          });

          this.recordMetric({
            name: 'TCP Connection',
            value: perfData.connectEnd - perfData.connectStart,
            unit: 'ms',
            timestamp: new Date(),
          });

          this.recordMetric({
            name: 'TTFB',
            value: perfData.responseStart - perfData.requestStart,
            unit: 'ms',
            timestamp: new Date(),
          });

          this.recordMetric({
            name: 'DOM Content Loaded',
            value: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
            unit: 'ms',
            timestamp: new Date(),
          });

          this.recordMetric({
            name: 'Page Load Complete',
            value: perfData.loadEventEnd - perfData.loadEventStart,
            unit: 'ms',
            timestamp: new Date(),
          });
        }
      }, 0);
    });
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);

    // Send to analytics
    if ((window as any).gtag) {
      (window as any).gtag('event', metric.name, {
        value: metric.value,
        metric_value: metric.value,
        metric_unit: metric.unit,
        ...metric.tags,
      });
    }

    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  /**
   * Track custom timing
   */
  trackTiming(name: string, startTime: number) {
    const duration = performance.now() - startTime;

    this.recordMetric({
      name,
      value: duration,
      unit: 'ms',
      timestamp: new Date(),
    });
  }

  /**
   * Start timing measurement
   */
  startTiming(name: string): () => void {
    const startTime = performance.now();

    return () => {
      this.trackTiming(name, startTime);
    };
  }

  /**
   * Track error
   */
  trackError(error: Error | string, severity: ErrorLog['severity'] = 'medium', context?: Record<string, any>) {
    const errorLog: ErrorLog = {
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      severity,
      context,
      timestamp: new Date(),
      url: window.location.href,
    };

    this.errors.push(errorLog);

    // Send to Sentry
    if (typeof error === 'object') {
      Sentry.captureException(error, {
        level: severity === 'critical' ? 'fatal' : severity === 'high' ? 'error' : 'warning',
        contexts: { custom: context },
      });
    } else {
      Sentry.captureMessage(error, {
        level: severity === 'critical' ? 'fatal' : severity === 'high' ? 'error' : 'warning',
        contexts: { custom: context },
      });
    }

    // Keep only last 100 errors
    if (this.errors.length > 100) {
      this.errors = this.errors.slice(-100);
    }
  }

  /**
   * Track analytics event
   */
  trackEvent(event: AnalyticsEvent) {
    if ((window as any).gtag) {
      (window as any).gtag('event', event.action, {
        event_category: event.category,
        event_label: event.label,
        value: event.value,
      });
    }
  }

  /**
   * Track page view
   */
  trackPageView(path: string, title?: string) {
    if ((window as any).gtag) {
      (window as any).gtag('event', 'page_view', {
        page_path: path,
        page_title: title || document.title,
      });
    }
  }

  /**
   * Set user context
   */
  setUser(userId: string, email?: string, username?: string) {
    Sentry.setUser({
      id: userId,
      email,
      username,
    });
  }

  /**
   * Clear user context
   */
  clearUser() {
    Sentry.setUser(null);
  }

  /**
   * Get metrics
   */
  getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.filter((m) => m.name === name);
    }
    return this.metrics;
  }

  /**
   * Get errors
   */
  getErrors(): ErrorLog[] {
    return this.errors;
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    const metricsByName: Record<string, number[]> = {};

    this.metrics.forEach((metric) => {
      if (!metricsByName[metric.name]) {
        metricsByName[metric.name] = [];
      }
      metricsByName[metric.name].push(metric.value);
    });

    const summary: Record<string, { avg: number; min: number; max: number; count: number }> = {};

    Object.entries(metricsByName).forEach(([name, values]) => {
      summary[name] = {
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length,
      };
    });

    return summary;
  }
}

export const performanceMonitor = new PerformanceMonitoringService();
