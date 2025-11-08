/**
 * Error tracking and performance monitoring utilities
 */

class ErrorTracker {
  constructor() {
    this.errors = [];
    this.maxErrors = 100;
    this.isProduction = import.meta.env.PROD;

    // Initialize error tracking
    this.init();
  }

  init() {
    // Global error handler
    window.addEventListener("error", (event) => {
      this.logError({
        type: "javascript",
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener("unhandledrejection", (event) => {
      this.logError({
        type: "promise",
        message: event.reason?.message || "Unhandled promise rejection",
        stack: event.reason?.stack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      });
    });

    // React error boundary integration
    window.__REACT_ERROR_OVERLAY_GLOBAL_HOOK__ = {
      onBuildError: (error) => {
        this.logError({
          type: "build",
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString(),
        });
      },
    };
  }

  logError(errorInfo) {
    // Add to local storage for debugging
    this.errors.push(errorInfo);

    // Keep only the last maxErrors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Store in localStorage for persistence
    try {
      localStorage.setItem(
        "app_errors",
        JSON.stringify(this.errors.slice(-10))
      );
    } catch (e) {
      // localStorage might be full
      console.warn("Could not store error in localStorage:", e);
    }

    // Log to console in development
    if (!this.isProduction) {
      console.error("Error tracked:", errorInfo);
    }

    // In production, you would send to error tracking service
    if (this.isProduction) {
      this.sendToErrorService(errorInfo);
    }
  }

  sendToErrorService(errorInfo) {
    // This would integrate with services like Sentry, LogRocket, etc.
    // For now, we'll just log it
    try {
      // Only send to error service if endpoint is configured
      // Disable in production unless you have a real error reporting endpoint
      if (!this.isProduction) {
        // Example: Send to a logging endpoint
        fetch("/api/errors", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(errorInfo),
        }).catch(() => {
          // Silently fail if error reporting fails
        });
      }
    } catch (e) {
      // Don't let error reporting break the app
    }
  }

  getErrors() {
    return this.errors;
  }

  clearErrors() {
    this.errors = [];
    localStorage.removeItem("app_errors");
  }

  // Manual error logging
  captureException(error, context = {}) {
    this.logError({
      type: "manual",
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    });
  }

  // Performance tracking
  trackPerformance(name, duration, metadata = {}) {
    const performanceData = {
      name,
      duration,
      metadata,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    };

    if (!this.isProduction) {
      console.log("Performance tracked:", performanceData);
    }

    // Store performance data
    try {
      const perfData = JSON.parse(
        localStorage.getItem("app_performance") || "[]"
      );
      perfData.push(performanceData);

      // Keep only last 50 entries
      const recentPerfData = perfData.slice(-50);
      localStorage.setItem("app_performance", JSON.stringify(recentPerfData));
    } catch (e) {
      console.warn("Could not store performance data:", e);
    }
  }

  // Web Vitals tracking
  trackWebVitals() {
    // Track Core Web Vitals if available
    try {
      // Use native Performance Observer API if available
      if ("PerformanceObserver" in window) {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === "navigation") {
              this.trackPerformance("navigation", entry.duration, {
                type: entry.type,
                redirectCount: entry.redirectCount,
              });
            } else if (entry.entryType === "paint") {
              this.trackPerformance(`paint-${entry.name}`, entry.startTime, {
                entryType: entry.entryType,
              });
            }
          }
        });

        observer.observe({ entryTypes: ["navigation", "paint"] });
      }
    } catch (error) {
      // Performance Observer not available
      console.warn("Performance tracking not available:", error);
    }
  }

  onWebVital(metric) {
    this.trackPerformance(`web-vital-${metric.name}`, metric.value, {
      id: metric.id,
      delta: metric.delta,
      rating: this.getWebVitalRating(metric.name, metric.value),
    });
  }

  getWebVitalRating(name, value) {
    const thresholds = {
      CLS: { good: 0.1, poor: 0.25 },
      FID: { good: 100, poor: 300 },
      FCP: { good: 1800, poor: 3000 },
      LCP: { good: 2500, poor: 4000 },
      TTFB: { good: 800, poor: 1800 },
    };

    const threshold = thresholds[name];
    if (!threshold) return "unknown";

    if (value <= threshold.good) return "good";
    if (value <= threshold.poor) return "needs-improvement";
    return "poor";
  }

  // User session tracking
  trackUserSession() {
    const sessionData = {
      sessionId: this.generateSessionId(),
      startTime: new Date().toISOString(),
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      connection: navigator.connection
        ? {
            effectiveType: navigator.connection.effectiveType,
            downlink: navigator.connection.downlink,
          }
        : null,
    };

    localStorage.setItem("app_session", JSON.stringify(sessionData));
    return sessionData;
  }

  generateSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Get debug information
  getDebugInfo() {
    return {
      errors: this.getErrors(),
      performance: JSON.parse(localStorage.getItem("app_performance") || "[]"),
      session: JSON.parse(localStorage.getItem("app_session") || "{}"),
      timestamp: new Date().toISOString(),
    };
  }
}

// Create singleton instance
const errorTracker = new ErrorTracker();

// Initialize Web Vitals tracking
errorTracker.trackWebVitals();

// Initialize user session
errorTracker.trackUserSession();

export default errorTracker;

// Utility functions for React components
export const withErrorTracking = (WrappedComponent) => {
  return function ErrorTrackedComponent(props) {
    try {
      // This would need to be used in a JSX context
      // For now, just return the component function
      return WrappedComponent(props);
    } catch (error) {
      errorTracker.captureException(error, {
        component: WrappedComponent.name || "Unknown",
        props: Object.keys(props),
      });
      throw error; // Re-throw to let error boundary handle it
    }
  };
};

export const trackAsyncOperation = async (name, operation, metadata = {}) => {
  const startTime = performance.now();

  try {
    const result = await operation();
    const duration = performance.now() - startTime;

    errorTracker.trackPerformance(name, duration, {
      ...metadata,
      status: "success",
    });

    return result;
  } catch (error) {
    const duration = performance.now() - startTime;

    errorTracker.trackPerformance(name, duration, {
      ...metadata,
      status: "error",
      error: error.message,
    });

    errorTracker.captureException(error, {
      operation: name,
      metadata,
    });

    throw error;
  }
};
