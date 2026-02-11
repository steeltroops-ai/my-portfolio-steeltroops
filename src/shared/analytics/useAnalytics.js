import { useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { getForensicData, hashFingerprint } from "./forensics";

// Simple UID generator for visitor and session
const generateId = () =>
  Math.random().toString(36).substring(2, 15) +
  Math.random().toString(36).substring(2, 15);

const getVisitorId = () => {
  let id = localStorage.getItem("portfolio_visitor_id");
  if (!id) {
    id = generateId();
    localStorage.setItem("portfolio_visitor_id", id);
  }
  return id;
};

const getSessionId = () => {
  let id = sessionStorage.getItem("portfolio_session_id");
  if (!id) {
    id = generateId();
    sessionStorage.setItem("portfolio_session_id", id);
  }
  return id;
};

const getUTM = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    source: params.get("utm_source"),
    medium: params.get("utm_medium"),
    campaign: params.get("utm_campaign"),
  };
};

// Helper to safely run tasks during browser idle time to avoid blocking the main thread
const onIdle = (cb) => {
  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    window.requestIdleCallback(cb, { timeout: 2000 });
  } else {
    setTimeout(cb, 100);
  }
};

export const useAnalytics = () => {
  const location = useLocation();

  const trackEvent = useCallback(async (type, label = "", value = "") => {
    try {
      if (localStorage.getItem("portfolio_admin_bypass") === "true") return;

      onIdle(async () => {
        await fetch("/api/analytics/track?action=event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: getSessionId(),
            type,
            label,
            value,
            path: window.location.pathname,
          }),
        });
      });
    } catch (err) {
      // Silent fail
    }
  }, []);

  // One-time initialization on mount
  useEffect(() => {
    let heartbeatInterval;

    const initTracking = async () => {
      if (localStorage.getItem("portfolio_admin_bypass") === "true") return;

      const visitorId = getVisitorId();
      const sessionId = getSessionId();
      const forensicData = await getForensicData();
      const fingerprint = hashFingerprint(forensicData);

      await fetch("/api/analytics/track?action=init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitorId,
          sessionId,
          userAgent: navigator.userAgent,
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          referrer: document.referrer,
          utm: getUTM(),
          path: window.location.pathname,
          forensics: {
            ...forensicData,
            fingerprint,
          },
        }),
      });

      // Heartbeat every 45s
      heartbeatInterval = setInterval(async () => {
        try {
          await fetch("/api/analytics/track?action=heartbeat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ visitorId, sessionId }),
          });
        } catch (err) {
          /* ignore */
        }
      }, 45000);
    };

    onIdle(() => {
      initTracking();
    });

    return () => {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
    };
  }, []); // Run only once on mount

  // Track page views on location change
  useEffect(() => {
    const trackPageView = async () => {
      if (localStorage.getItem("portfolio_admin_bypass") === "true") return;

      try {
        await fetch("/api/analytics/track?action=pageview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: getSessionId(),
            path: location.pathname,
            referrer: document.referrer,
          }),
        });
      } catch (err) {
        // Silent fail
      }
    };

    onIdle(() => {
      trackPageView();
    });
  }, [location.pathname]); // Track on every path change

  return { trackEvent };
};
