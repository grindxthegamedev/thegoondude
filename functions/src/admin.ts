/**
 * Admin Endpoints
 * Cloud Functions for admin operations (uses Admin SDK to bypass rules)
 */

import { onRequest } from 'firebase-functions/https';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

// Initialize Firebase Admin if not already
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

// Admin password hash (same as frontend)
const ADMIN_PASSWORD_HASH = process.env.ADMIN_HASH ||
    'b2b2f104d32c638903e151a9b20d6e27b41d8c0c84cf8458738f83ca2f1dd744';

/**
 * Verify admin password
 */
function verifyPassword(password: string): boolean {
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    return hash === ADMIN_PASSWORD_HASH;
}

/**
 * Delete a site (admin only)
 */
export const adminDeleteSite = onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
    if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

    try {
        const { siteId, adminPassword } = req.body;

        if (!siteId) {
            res.status(400).json({ error: 'Missing siteId' });
            return;
        }

        if (!adminPassword || !verifyPassword(adminPassword)) {
            res.status(401).json({ error: 'Invalid admin password' });
            return;
        }

        // Check site exists
        const siteDoc = await db.collection('sites').doc(siteId).get();
        if (!siteDoc.exists) {
            res.status(404).json({ error: 'Site not found' });
            return;
        }

        // Delete the site
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
export const adminUpdateSite = onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
    if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

    try {
        const { siteId, adminPassword, updates } = req.body;

        if (!siteId || !updates) {
            res.status(400).json({ error: 'Missing siteId or updates' });
            return;
        }

        if (!adminPassword || !verifyPassword(adminPassword)) {
            res.status(401).json({ error: 'Invalid admin password' });
            return;
        }

        // Check site exists
        const siteDoc = await db.collection('sites').doc(siteId).get();
        if (!siteDoc.exists) {
            res.status(404).json({ error: 'Site not found' });
            return;
        }

        // Update the site
        await db.collection('sites').doc(siteId).update(updates);
        logger.info('Site updated by admin:', siteId);

        res.json({ success: true, message: 'Site updated' });
    } catch (error) {
        logger.error('Admin update error:', error);
        res.status(500).json({ error: 'Failed to update site' });
    }
});
