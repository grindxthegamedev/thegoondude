/**
 * LustList 411 / TheGoonDude - Cloud Functions
 * Main entry point for all Cloud Functions
 */

import { setGlobalOptions } from 'firebase-functions';
import { onRequest, HttpsOptions } from 'firebase-functions/https';
import * as logger from 'firebase-functions/logger';

// ==========================================
// GLOBAL OPTIONS
// ==========================================
// Applied to all functions unless overridden
setGlobalOptions({
    maxInstances: 10,        // Limit concurrent executions (cost control)
    region: 'us-central1',   // Default region
});

// ==========================================
// FUNCTION EXPORTS
// ==========================================

// AI Review Pipeline
export { generateSiteReview, processFullReview } from './ai/endpoints';

// Admin Operations
export { adminDeleteSite, adminUpdateSite, adminGetDashboard, adminGetSites } from './admin';

// Backlink Verification
export { checkBacklink } from './backlink/checkBacklink';

// Payment Processing
export { createPayment, ipnWebhook } from './payments';

// Batch Processing
export { adminStartBatchReview, adminStopBatchReview, adminGetBatchStatus } from './batch/batchEndpoints';
export { adminSeedSites } from './batch/seedSites';

// ==========================================
// UTILITY ENDPOINTS
// ==========================================

const utilityConfig: HttpsOptions = {
    memory: '128MiB',
    timeoutSeconds: 10,
    cors: true,
};

/**
 * Health check endpoint for monitoring
 */
export const health = onRequest(utilityConfig, (request, response) => {
    logger.info('Health check called');
    response.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        region: 'us-central1',
    });
});

/**
 * Rate limit status check (for debugging)
 */
export const rateLimitStatus = onRequest(utilityConfig, async (request, response) => {
    response.set('Access-Control-Allow-Origin', '*');

    if (request.method === 'OPTIONS') {
        response.status(204).send('');
        return;
    }

    // This endpoint just confirms rate limiting is active
    response.json({
        enabled: true,
        limits: {
            submission: '5 per hour',
            review: '10 per hour',
            aiGeneration: '3 per hour',
            vote: '30 per minute',
        },
    });
});
