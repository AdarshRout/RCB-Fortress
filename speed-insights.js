/**
 * Vercel Speed Insights Integration
 * Automatically tracks web vitals and performance metrics
 */

import { injectSpeedInsights } from './node_modules/@vercel/speed-insights/dist/index.mjs';

// Initialize Speed Insights when the script loads
injectSpeedInsights({
  debug: false
});
