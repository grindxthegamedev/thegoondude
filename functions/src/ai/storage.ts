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
 * Upload a screenshot buffer to Firebase Storage
 * Returns the public URL
 */
export async function uploadScreenshot(
    buffer: Buffer,
    siteId: string
): Promise<string> {
    const filename = `screenshots/${siteId}/${uuidv4()}.png`;

    logger.info('Uploading screenshot:', filename);

    const file = bucket.file(filename);

    await file.save(buffer, {
        contentType: 'image/png',
        metadata: {
            cacheControl: 'public, max-age=31536000',
        },
    });

    // Make file public
    await file.makePublic();

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
    logger.info('Screenshot uploaded:', publicUrl);

    return publicUrl;
}
