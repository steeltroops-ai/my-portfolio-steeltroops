import { useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";

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

export const useAnalytics = () => {
  const location = useLocation();

  const trackEvent = useCallback(async (type, label = "", value = "") => {
    try {
      if (localStorage.getItem("portfolio_admin_bypass") === "true") return;

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
    } catch (err) {
      // Silent fail
    }
  }, []);

  useEffect(() => {
    const initTracking = async () => {
      // Skip if admin
      if (localStorage.getItem("portfolio_admin_bypass") === "true") return;

      const visitorId = getVisitorId();
      const sessionId = getSessionId();

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
          path: location.pathname,
        }),
      });

      // Heartbeat every 45s
      const heartbeatInterval = setInterval(async () => {
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

      return () => clearInterval(heartbeatInterval);
    };

    initTracking();
  }, [location.pathname]);

  return { trackEvent };
};
