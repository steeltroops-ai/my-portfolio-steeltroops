import { useAnalytics } from "./useAnalytics";

/**
 * AnalyticsTracker component
 * This component handles the initialization of tracking and doesn't render anything visually.
 * It's placed at the root of the app to capture all page views and sessions.
 */
const AnalyticsTracker = () => {
  useAnalytics();
  return null;
};

export default AnalyticsTracker;
