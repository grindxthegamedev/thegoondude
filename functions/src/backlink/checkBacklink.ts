/**
 * Check Backlink Cloud Function
 * Verifies if a site has a backlink to TheGoonDude
 * Rate limited: 1 check per URL per 60 seconds
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import { verifyBacklink } from './backlinkVerifier';

const RATE_LIMIT_SECONDS = 60;
const COLLECTION = 'backlink_checks';

interface CheckRequest {
    url: string;
}

interface CheckResponse {
    eligible: boolean;
    backlinkFound: boolean;
    backlinkUrl?: string;
    message: string;
    retryAfter?: number;
}

/**
 * Sanitize and normalize URL
 */
function sanitizeUrl(url: string): string | null {
    try {
        let cleaned = url.trim().toLowerCase();
        if (!cleaned.startsWith('http')) {
            cleaned = 'https://' + cleaned;
        }
        const parsed = new URL(cleaned);
        return parsed.origin; // Just the origin, no path
    } catch {
        return null;
    }
}

/**
 * Check if URL was recently checked (rate limiting)
 */
async function getRecentCheck(urlHash: string): Promise<{
    isLimited: boolean;
    cachedResult?: CheckResponse;
    retryAfter?: number;
}> {
    const db = getFirestore();
    const doc = await db.collection(COLLECTION).doc(urlHash).get();

    if (!doc.exists) {
        return { isLimited: false };
    }

    const data = doc.data();
    const checkedAt = data?.checkedAt?.toDate();

    if (!checkedAt) {
        return { isLimited: false };
    }

    const secondsAgo = (Date.now() - checkedAt.getTime()) / 1000;

    if (secondsAgo < RATE_LIMIT_SECONDS) {
        return {
            isLimited: true,
            retryAfter: Math.ceil(RATE_LIMIT_SECONDS - secondsAgo),
            cachedResult: data?.result as CheckResponse
        };
    }

    return { isLimited: false };
}

/**
 * Store check result for rate limiting
 */
async function storeCheckResult(urlHash: string, result: CheckResponse): Promise<void> {
    const db = getFirestore();
    await db.collection(COLLECTION).doc(urlHash).set({
        checkedAt: Timestamp.now(),
        result
    });
}

/**
 * Cloud Function: Check if site has backlink
 */
export const checkBacklink = onCall<CheckRequest>(
    { cors: true, maxInstances: 10, memory: '1GiB', timeoutSeconds: 120 },
    async (request): Promise<CheckResponse> => {
        const { url } = request.data;

        if (!url) {
            throw new HttpsError('invalid-argument', 'URL is required');
        }

        const sanitizedUrl = sanitizeUrl(url);
        if (!sanitizedUrl) {
            throw new HttpsError('invalid-argument', 'Invalid URL format');
        }

        // Create hash for rate limiting
        const urlHash = Buffer.from(sanitizedUrl).toString('base64').replace(/[^a-zA-Z0-9]/g, '');

        // Check rate limit
        const { isLimited, cachedResult, retryAfter } = await getRecentCheck(urlHash);

        if (isLimited && cachedResult) {
            logger.info(`Rate limited: ${sanitizedUrl}, returning cached result`);
            return { ...cachedResult, retryAfter };
        }

        // Perform backlink verification
        logger.info(`Checking backlink for: ${sanitizedUrl}`);
        const verifyResult = await verifyBacklink(sanitizedUrl);

        const response: CheckResponse = {
            eligible: verifyResult.found,
            backlinkFound: verifyResult.found,
            backlinkUrl: verifyResult.backlinkUrl,
            message: verifyResult.found
                ? 'Backlink verified! You can now submit your site.'
                : verifyResult.error || 'Backlink not found. Please add a link to thegoondude.com on your site.'
        };

        // Store result for rate limiting
        await storeCheckResult(urlHash, response);

        return response;
    }
);
