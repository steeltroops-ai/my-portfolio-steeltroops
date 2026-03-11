import { useEffect, useCallback, useRef } from "react";
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
  const heartbeatRef = useRef(null);
  const handlersRef = useRef({});
  const isFirstRender = useRef(true);

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
    const initTracking = async () => {
      try {
        if (localStorage.getItem("portfolio_admin_bypass") === "true") return;

        const { getForensicData, hashFingerprint } =
          await import("./forensics");

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

        // Behavioral Entropy Trackers
        let mouseEvents = [];
        let keyIntervals = [];
        let lastKeyTime = Date.now();
        let totalClicks = 0;

        const handleMouseMove = (e) => {
          mouseEvents.push({ x: e.clientX, y: e.clientY, t: Date.now() });
          if (mouseEvents.length > 50) mouseEvents.shift(); // Keep last 50
        };

        const handleKeyDown = () => {
          const now = Date.now();
          if (now - lastKeyTime < 2000) keyIntervals.push(now - lastKeyTime);
          if (keyIntervals.length > 50) keyIntervals.shift();
          lastKeyTime = now;
        };

        const handleMouseClick = () => {
          totalClicks++;
        };

        // Store handler refs so the cleanup function can remove them
        handlersRef.current = {
          handleMouseMove,
          handleKeyDown,
          handleMouseClick,
        };

        window.addEventListener("mousemove", handleMouseMove, {
          passive: true,
        });
        window.addEventListener("keydown", handleKeyDown, { passive: true });
        window.addEventListener("click", handleMouseClick, { passive: true });

        // Heartbeat every 15s for real-time fidelity
        heartbeatRef.current = setInterval(async () => {
          try {
            // Calculate Current Behavioral Entropy
            let mouse_velocity = 0;
            if (mouseEvents.length > 1) {
              let totalDist = 0;
              let totalTime =
                mouseEvents[mouseEvents.length - 1].t - mouseEvents[0].t;
              for (let i = 1; i < mouseEvents.length; i++) {
                const dx = mouseEvents[i].x - mouseEvents[i - 1].x;
                const dy = mouseEvents[i].y - mouseEvents[i - 1].y;
                totalDist += Math.sqrt(dx * dx + dy * dy);
              }
              mouse_velocity =
                totalTime > 0 ? (totalDist / totalTime) * 1000 : 0; // px per sec
            }

            let typing_cadence_ms = 0;
            if (keyIntervals.length > 0) {
              typing_cadence_ms =
                keyIntervals.reduce((a, b) => a + b, 0) / keyIntervals.length;
            }

            // High entropy if moving mouse uniquely and clicking
            let entropy_score = Math.min(
              mouseEvents.length * 0.5 + totalClicks * 10,
              100
            );

            await fetch("/api/analytics/track?action=heartbeat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                sessionId,
                visitorId: localStorage.getItem("portfolio_visitor_id"), // Ensure latest ID is sent
                biometrics: {
                  mouse_velocity,
                  typing_cadence_ms,
                  entropy_score,
                },
              }),
            });

            // Reset trackers for next interval
            mouseEvents = [];
            keyIntervals = [];
            totalClicks = 0;
          } catch (err) {
            /* ignore */
          }
        }, 15000);
      } catch (err) {
        // Silent fail if initialization or tracking fails
        console.warn(
          "Analytics initialization failed (could be blocked):",
          err
        );
      }
    };

    onIdle(() => {
      initTracking();
    });

    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
      const { handleMouseMove, handleKeyDown, handleMouseClick } =
        handlersRef.current;
      if (handleMouseMove)
        window.removeEventListener("mousemove", handleMouseMove);
      if (handleKeyDown) window.removeEventListener("keydown", handleKeyDown);
      if (handleMouseClick)
        window.removeEventListener("click", handleMouseClick);
      handlersRef.current = {};
    };
  }, []); // Run only once on mount

  // Track page views on location change
  // Skip the first render: the `init` action already records the initial page_view,
  // firing here too would double-count it.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

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
