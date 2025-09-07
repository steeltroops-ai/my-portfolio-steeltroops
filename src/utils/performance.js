/**
 * Performance Monitoring Utilities
 * Optimized for Bun + Vite React Portfolio
 */

// Performance metrics collection
export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = new Map();
    this.isEnabled = typeof window !== 'undefined' && 'performance' in window;
  }

  // Start timing a operation
  startTiming(label) {
    if (!this.isEnabled) return;
    
    const startTime = performance.now();
    this.metrics.set(label, { startTime, endTime: null, duration: null });
    
    // Also use Performance API mark if available
    if (performance.mark) {
      performance.mark(`${label}-start`);
    }
  }

  // End timing and calculate duration
  endTiming(label) {
    if (!this.isEnabled) return null;
    
    const endTime = performance.now();
    const metric = this.metrics.get(label);
    
    if (metric) {
      metric.endTime = endTime;
      metric.duration = endTime - metric.startTime;
      
      // Use Performance API measure if available
      if (performance.mark && performance.measure) {
        performance.mark(`${label}-end`);
        performance.measure(label, `${label}-start`, `${label}-end`);
      }
      
      return metric.duration;
    }
    
    return null;
  }

  // Get timing for a specific label
  getTiming(label) {
    return this.metrics.get(label);
  }

  // Get all timings
  getAllTimings() {
    return Object.fromEntries(this.metrics);
  }

  // Monitor Core Web Vitals
  observeWebVitals(callback) {
    if (!this.isEnabled) return;

    // Largest Contentful Paint (LCP)
    this.observeMetric('largest-contentful-paint', (entry) => {
      callback({
        name: 'LCP',
        value: entry.startTime,
        rating: entry.startTime <= 2500 ? 'good' : entry.startTime <= 4000 ? 'needs-improvement' : 'poor'
      });
    });

    // First Input Delay (FID)
    this.observeMetric('first-input', (entry) => {
      callback({
        name: 'FID',
        value: entry.processingStart - entry.startTime,
        rating: entry.processingStart - entry.startTime <= 100 ? 'good' : 
                entry.processingStart - entry.startTime <= 300 ? 'needs-improvement' : 'poor'
      });
    });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    this.observeMetric('layout-shift', (entry) => {
      if (!entry.hadRecentInput) {
        clsValue += entry.value;
        callback({
          name: 'CLS',
          value: clsValue,
          rating: clsValue <= 0.1 ? 'good' : clsValue <= 0.25 ? 'needs-improvement' : 'poor'
        });
      }
    });
  }

  // Generic metric observer
  observeMetric(type, callback) {
    if (!this.isEnabled || !window.PerformanceObserver) return;

    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(callback);
      });
      
      observer.observe({ type, buffered: true });
      this.observers.set(type, observer);
    } catch (error) {
      console.warn(`Failed to observe ${type}:`, error);
    }
  }

  // Monitor resource loading performance
  observeResourceTiming(callback) {
    if (!this.isEnabled) return;

    this.observeMetric('resource', (entry) => {
      const resourceType = this.getResourceType(entry.name);
      const loadTime = entry.responseEnd - entry.startTime;
      
      callback({
        name: entry.name,
        type: resourceType,
        loadTime,
        size: entry.transferSize || 0,
        cached: entry.transferSize === 0 && entry.decodedBodySize > 0
      });
    });
  }

  // Determine resource type from URL
  getResourceType(url) {
    if (url.match(/\.(js|mjs)$/)) return 'script';
    if (url.match(/\.css$/)) return 'stylesheet';
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp|avif)$/)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|otf)$/)) return 'font';
    if (url.includes('/api/') || url.includes('supabase')) return 'api';
    return 'other';
  }

  // Log performance summary
  logSummary() {
    if (!this.isEnabled) return;

    console.group('🚀 Performance Summary');
    
    // Navigation timing
    if (performance.timing) {
      const timing = performance.timing;
      const loadTime = timing.loadEventEnd - timing.navigationStart;
      const domReady = timing.domContentLoadedEventEnd - timing.navigationStart;
      
      console.log(`📊 Page Load Time: ${loadTime}ms`);
      console.log(`📊 DOM Ready Time: ${domReady}ms`);
    }

    // Custom timings
    const timings = this.getAllTimings();
    Object.entries(timings).forEach(([label, metric]) => {
      if (metric.duration) {
        console.log(`⏱️ ${label}: ${metric.duration.toFixed(2)}ms`);
      }
    });

    console.groupEnd();
  }

  // Clean up observers
  disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.metrics.clear();
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for performance monitoring
export const usePerformanceMonitor = () => {
  return performanceMonitor;
};

// Utility functions for common performance tasks
export const measureAsync = async (label, asyncFn) => {
  performanceMonitor.startTiming(label);
  try {
    const result = await asyncFn();
    return result;
  } finally {
    performanceMonitor.endTiming(label);
  }
};

export const measureSync = (label, syncFn) => {
  performanceMonitor.startTiming(label);
  try {
    return syncFn();
  } finally {
    performanceMonitor.endTiming(label);
  }
};

// Initialize performance monitoring in development
if (process.env.NODE_ENV === 'development') {
  // Log performance summary after page load
  window.addEventListener('load', () => {
    setTimeout(() => performanceMonitor.logSummary(), 1000);
  });

  // Monitor Core Web Vitals
  performanceMonitor.observeWebVitals((metric) => {
    console.log(`📈 ${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`);
  });
}
