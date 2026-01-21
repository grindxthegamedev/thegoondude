/**
 * Migrate Descriptions
 * Fixes sites with "Automatically seeded" descriptions
 * Replaces with first line of AI review content
 */

import { onRequest } from 'firebase-functions/https';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';
import * as logger from 'firebase-functions/logger';

if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();
const adminHashSecret = defineSecret('ADMIN_HASH');
const DEV_ADMIN_HASH = 'b2b2f104d32c638903e151a9b20d6e27b41d8c0c84cf8458738f83ca2f1dd744';

function verifyPassword(password: string): boolean {
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    const expected = adminHashSecret.value() || DEV_ADMIN_HASH;
    return hash === expected;
}

/**
 * Extract first meaningful line from review content
 */
function extractFirstLine(content: string): string {
    if (!content) return '';

    const lines = content.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .filter(line => !line.startsWith('#'))      // Skip headers
        .filter(line => !line.startsWith('*'))      // Skip bold/italic lines
        .filter(line => !line.startsWith('-'))      // Skip list items
        .filter(line => line.length > 30);          // Need meaningful content

    if (lines.length === 0) return '';

    // Truncate to ~150 chars for description
    let firstLine = lines[0];
    if (firstLine.length > 150) {
        firstLine = firstLine.substring(0, 147) + '...';
    }

    return firstLine;
}

/**
 * Migrate descriptions endpoint
 * Replaces "Automatically seeded review for X" with actual review content
 */
export const migrateDescriptions = onRequest(
    { memory: '256MiB', timeoutSeconds: 300, cors: true, secrets: [adminHashSecret] },
    async (req, res) => {
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.set('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
        if (req.method !== 'POST') { res.status(405).send('Method Not Allowed'); return; }

        const { adminPassword } = req.body;
        if (!adminPassword || !verifyPassword(adminPassword)) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        logger.info('Starting description migration...');

        let updated = 0;
        let skipped = 0;
        let noReview = 0;

        try {
            const sitesSnapshot = await db.collection('sites').get();

            for (const doc of sitesSnapshot.docs) {
                const data = doc.data();
                const description = data.description || '';

                // Check if description matches the pattern
                const needsMigration = description.toLowerCase().includes('automatically seeded') ||
                    description.trim() === '';

                if (!needsMigration) {
                    skipped++;
                    continue;
                }

                // Try to extract from review content
                const reviewContent = data.review?.content || data.review?.excerpt || '';
                const newDescription = extractFirstLine(reviewContent);

                if (!newDescription) {
                    noReview++;
                    logger.warn(`No review content for: ${data.name}`);
                    continue;
                }

                // Update the description
                await doc.ref.update({ description: newDescription });
                updated++;
                logger.info(`Updated: ${data.name} -> "${newDescription.substring(0, 50)}..."`);
            }

            res.json({
                success: true,
                updated,
                skipped,
                noReview,
                total: sitesSnapshot.size
            });

        } catch (error) {
            logger.error('Migration error:', error);
            res.status(500).json({ error: 'Migration failed' });
        }
    }
);
