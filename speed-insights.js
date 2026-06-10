/**
 * Vercel Speed Insights Integration
 * Automatically tracks web vitals and performance metrics
 */

import { injectSpeedInsights } from '@vercel/speed-insights';

// Initialize Speed Insights when the script loads
injectSpeedInsights({
  debug: false
});
