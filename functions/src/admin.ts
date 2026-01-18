/**
 * Admin Endpoints
 * Cloud Functions for admin operations
 * Uses Admin SDK to bypass Firestore rules
 */

import { onRequest, HttpsOptions } from 'firebase-functions/https';
import { defineSecret } from 'firebase-functions/params';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

// Initialize Firebase Admin if not already
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

// Admin password from Secret Manager (production) or env (dev)
const adminHashSecret = defineSecret('ADMIN_HASH');

// Fallback hash for development
const DEV_ADMIN_HASH = 'b2b2f104d32c638903e151a9b20d6e27b41d8c0c84cf8458738f83ca2f1dd744';

// Lightweight function config
const adminConfig: HttpsOptions = {
    memory: '256MiB',
    timeoutSeconds: 30,
    cors: true,
    secrets: [adminHashSecret],
};

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Verify admin password
 */
function verifyPassword(password: string, secretHash?: string): boolean {
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    const expectedHash = secretHash || DEV_ADMIN_HASH;
    return hash === expectedHash;
}

/**
 * Delete a site (admin only)
 */
export const adminDeleteSite = onRequest(adminConfig, async (req, res) => {
    res.set(corsHeaders);

    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
    if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

    try {
        const { siteId, adminPassword } = req.body;

        if (!siteId) {
            res.status(400).json({ error: 'Missing siteId' });
            return;
        }

        // Get secret value (empty string in emulator)
        const secretValue = adminHashSecret.value() || undefined;
        if (!adminPassword || !verifyPassword(adminPassword, secretValue)) {
            res.status(401).json({ error: 'Invalid admin password' });
            return;
        }

        const siteDoc = await db.collection('sites').doc(siteId).get();
        if (!siteDoc.exists) {
            res.status(404).json({ error: 'Site not found' });
            return;
        }

        await db.collection('sites').doc(siteId).delete();
        logger.info('Site deleted by admin:', siteId);

        res.json({ success: true, message: 'Site deleted' });
    } catch (error) {
        logger.error('Admin delete error:', error);
        res.status(500).json({ error: 'Failed to delete site' });
    }
});

/**
 * Update a site (admin only)
 */
export const adminUpdateSite = onRequest(adminConfig, async (req, res) => {
    res.set(corsHeaders);

    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
    if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

    try {
        const { siteId, adminPassword, updates } = req.body;

        if (!siteId || !updates) {
            res.status(400).json({ error: 'Missing siteId or updates' });
            return;
        }

        const secretValue = adminHashSecret.value() || undefined;
        if (!adminPassword || !verifyPassword(adminPassword, secretValue)) {
            res.status(401).json({ error: 'Invalid admin password' });
            return;
        }

        const siteDoc = await db.collection('sites').doc(siteId).get();
        if (!siteDoc.exists) {
            res.status(404).json({ error: 'Site not found' });
            return;
        }

        await db.collection('sites').doc(siteId).update(updates);
        logger.info('Site updated by admin:', siteId);

        res.json({ success: true, message: 'Site updated' });
    } catch (error) {
        logger.error('Admin update error:', error);
        res.status(500).json({ error: 'Failed to update site' });
    }
});

/**
 * Get admin dashboard data (stats & pending sites)
 */
export const adminGetDashboard = onRequest(adminConfig, async (req, res) => {
    res.set(corsHeaders);

    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
    if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

    try {
        const { adminPassword } = req.body;

        const secretValue = adminHashSecret.value() || undefined;
        if (!adminPassword || !verifyPassword(adminPassword, secretValue)) {
            res.status(401).json({ error: 'Invalid admin password' });
            return;
        }

        // Parallel fetch for speed
        const sitesSnapshot = await db.collection('sites').get();
        // Note: For large DBs, this should be optimized. For now (MVP), fetching all is okay-ish or we verify separate queries.

        let pendingCount = 0;
        let publishedCount = 0;
        const emails = new Set<string>();
        const pendingSites: any[] = [];

        sitesSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.status === 'pending') {
                pendingCount++;
                pendingSites.push({ id: doc.id, ...data });
            } else if (data.status === 'published') {
                publishedCount++;
            }
            if (data.submitterEmail) emails.add(data.submitterEmail);
        });

        // Sort pending by date desc
        pendingSites.sort((a, b) => {
            const da = a.submittedAt?.toDate?.() || new Date(0);
            const db = b.submittedAt?.toDate?.() || new Date(0);
            return db.getTime() - da.getTime();
        });

        const stats = {
            pendingCount,
            publishedCount,
            totalSubmitters: emails.size,
            totalRevenue: publishedCount * 20,
        };

        res.json({ success: true, stats, pendingSites });
    } catch (error) {
        logger.error('Admin dashboard error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
});
