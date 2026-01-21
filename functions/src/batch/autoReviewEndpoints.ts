/**
 * Auto-Review Endpoints
 * Trigger endpoints for automatic site review
 */

import { onRequest, HttpsOptions } from 'firebase-functions/https';
import { defineSecret } from 'firebase-functions/params';
import * as logger from 'firebase-functions/logger';
import * as crypto from 'crypto';
import { runAutoReview } from './autoReviewScheduler';

const adminHashSecret = defineSecret('ADMIN_HASH');
const DEV_ADMIN_HASH = 'b2b2f104d32c638903e151a9b20d6e27b41d8c0c84cf8458738f83ca2f1dd744';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

const autoReviewConfig: HttpsOptions = {
    memory: '2GiB',
    timeoutSeconds: 540,
    cors: true,
    secrets: [adminHashSecret],
};

function verifyPassword(password: string): boolean {
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    const expected = adminHashSecret.value() || DEV_ADMIN_HASH;
    return hash === expected;
}

/**
 * Trigger auto-review manually (admin endpoint)
 * Can be called after deploy to start the auto-review process
 */
export const triggerAutoReview = onRequest(autoReviewConfig, async (req, res) => {
    res.set(corsHeaders);

    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
    if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

    const { adminPassword } = req.body;
    if (!adminPassword || !verifyPassword(adminPassword)) {
        res.status(401).json({ error: 'Invalid admin password' });
        return;
    }

    logger.info('Auto-review triggered by admin');

    try {
        // Run the auto-review (this will take a while)
        const result = await runAutoReview();

        res.json({
            ...result,
            message: 'Auto-review completed',
        });

    } catch (error) {
        logger.error('Auto-review error:', error);
        res.status(500).json({ error: 'Auto-review failed' });
    }
});
