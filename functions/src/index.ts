/**
 * LustList 411 - Cloud Functions
 */

import { setGlobalOptions } from 'firebase-functions';
import { onRequest } from 'firebase-functions/https';
import * as logger from 'firebase-functions/logger';

// Import endpoints
export { createPayment, ipnWebhook } from './payments';
export { generateSiteReview, processFullReview } from './ai/endpoints';

// Set global options for cost control
setGlobalOptions({ maxInstances: 10 });

// Health check endpoint
export const health = onRequest((request, response) => {
    logger.info('Health check called');
    response.json({ status: 'ok', timestamp: new Date().toISOString() });
});
