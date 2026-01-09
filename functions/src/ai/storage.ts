/**
 * Storage Utilities
 * Upload screenshots to Firebase Storage
 */

import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { v4 as uuidv4 } from 'uuid';

// Initialize if needed
if (!admin.apps.length) {
    admin.initializeApp();
}

const bucket = admin.storage().bucket();

/**
 * Upload a single screenshot buffer to Firebase Storage
 */
export async function uploadScreenshot(
    buffer: Buffer,
    siteId: string
): Promise<string> {
    const filename = `screenshots/${siteId}/${uuidv4()}.png`;

    logger.info('Uploading screenshot:', filename, { size: buffer.length });

    const file = bucket.file(filename);
    await file.save(buffer, {
        contentType: 'image/png',
        metadata: { cacheControl: 'public, max-age=31536000' },
    });
    await file.makePublic();

    return `https://storage.googleapis.com/${bucket.name}/${filename}`;
}

/**
 * Upload multiple screenshots to Firebase Storage
 * Returns array of public URLs
 */
export async function uploadScreenshots(
    buffers: Buffer[],
    siteId: string
): Promise<string[]> {
    logger.info(`Uploading ${buffers.length} screenshots for site:`, siteId);

    const urls: string[] = [];

    for (let i = 0; i < buffers.length; i++) {
        try {
            const url = await uploadScreenshot(buffers[i], siteId);
            urls.push(url);
            logger.info(`Screenshot ${i + 1}/${buffers.length} uploaded`);
        } catch (err) {
            logger.error(`Failed to upload screenshot ${i + 1}:`, err);
        }
    }

    logger.info(`Successfully uploaded ${urls.length} screenshots`);
    return urls;
}
