/**
 * Batch Admin Endpoints
 * Start/Stop/Status for batch review processing
 */

import { onRequest, HttpsOptions } from 'firebase-functions/https';
import { defineSecret } from 'firebase-functions/params';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import * as crypto from 'crypto';
import { runBatchProcessor } from './batchProcessor';

// Initialize if needed
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();
const adminHashSecret = defineSecret('ADMIN_HASH');
const DEV_ADMIN_HASH = 'b2b2f104d32c638903e151a9b20d6e27b41d8c0c84cf8458738f83ca2f1dd744';

const batchConfig: HttpsOptions = {
    memory: '2GiB',
    timeoutSeconds: 540, // Max timeout for heavy batch processing
    cors: true,
    secrets: [adminHashSecret],
};


const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

function verifyPassword(password: string): boolean {
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    const expected = adminHashSecret.value() || DEV_ADMIN_HASH;
    return hash === expected;
}

/**
 * Start batch review processing
 */
export const adminStartBatchReview = onRequest(batchConfig, async (req, res) => {
    res.set(corsHeaders);
    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
    if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

    try {
        const { adminPassword } = req.body;
        if (!adminPassword || !verifyPassword(adminPassword)) {
            res.status(401).json({ error: 'Invalid admin password' });
            return;
        }

        // Check for existing running job
        const existing = await db.collection('batchJobs')
            .where('status', '==', 'running')
            .limit(1)
            .get();

        if (!existing.empty) {
            res.status(400).json({
                error: 'Batch job already running',
                jobId: existing.docs[0].id
            });
            return;
        }

        // Create new job
        const jobRef = await db.collection('batchJobs').add({
            status: 'running',
            totalSites: 0,
            processedCount: 0,
            successCount: 0,
            errorCount: 0,
            currentSiteId: null,
            currentSiteName: null,
            skipList: [],
            errors: [],
            startedAt: FieldValue.serverTimestamp(),
            lastUpdatedAt: FieldValue.serverTimestamp(),
            stoppedAt: null,
        });

        logger.info('Batch job started:', jobRef.id);

        // IMPORTANT: Await the processor so it doesn't die when response is sent
        // This means the HTTP response will be delayed until batch completes/times out
        // For long jobs, consider using Cloud Tasks instead
        try {
            await runBatchProcessor(jobRef.id);
            logger.info('Batch processor completed for job:', jobRef.id);
        } catch (err) {
            logger.error('Batch processor error:', err);
        }

        res.json({ success: true, jobId: jobRef.id, message: 'Batch processing completed' });

    } catch (error) {
        logger.error('Start batch error:', error);
        res.status(500).json({ error: 'Failed to start batch job' });
    }
});

/**
 * Stop batch review processing
 */
export const adminStopBatchReview = onRequest(batchConfig, async (req, res) => {
    res.set(corsHeaders);
    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
    if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

    try {
        const { adminPassword, jobId } = req.body;
        if (!adminPassword || !verifyPassword(adminPassword)) {
            res.status(401).json({ error: 'Invalid admin password' });
            return;
        }

        // Find running job
        let targetJobId = jobId;
        if (!targetJobId) {
            const running = await db.collection('batchJobs')
                .where('status', '==', 'running')
                .limit(1)
                .get();

            if (running.empty) {
                res.status(404).json({ error: 'No running batch job found' });
                return;
            }
            targetJobId = running.docs[0].id;
        }

        // Set stop flag
        await db.collection('batchJobs').doc(targetJobId).update({
            status: 'stopped',
            stoppedAt: FieldValue.serverTimestamp(),
        });

        logger.info('Batch job stopped:', targetJobId);
        res.json({ success: true, jobId: targetJobId, message: 'Batch job stopping...' });

    } catch (error) {
        logger.error('Stop batch error:', error);
        res.status(500).json({ error: 'Failed to stop batch job' });
    }
});

/**
 * Get batch job status
 */
export const adminGetBatchStatus = onRequest(batchConfig, async (req, res) => {
    res.set(corsHeaders);
    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
    if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

    try {
        const { adminPassword, jobId } = req.body;
        if (!adminPassword || !verifyPassword(adminPassword)) {
            res.status(401).json({ error: 'Invalid admin password' });
            return;
        }

        // Get specific job or most recent
        let jobDoc;
        if (jobId) {
            jobDoc = await db.collection('batchJobs').doc(jobId).get();
        } else {
            const recent = await db.collection('batchJobs')
                .orderBy('startedAt', 'desc')
                .limit(1)
                .get();
            jobDoc = recent.docs[0];
        }

        if (!jobDoc?.exists) {
            res.json({ success: true, job: null, message: 'No batch jobs found' });
            return;
        }

        const data = jobDoc.data()!;
        res.json({
            success: true,
            job: {
                id: jobDoc.id,
                ...data,
                startedAt: data.startedAt?.toDate?.()?.toISOString(),
                lastUpdatedAt: data.lastUpdatedAt?.toDate?.()?.toISOString(),
                stoppedAt: data.stoppedAt?.toDate?.()?.toISOString(),
            }
        });

    } catch (error) {
        logger.error('Get batch status error:', error);
        res.status(500).json({ error: 'Failed to get batch status' });
    }
});
