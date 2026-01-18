/**
 * Rate Limiter Module
 * Centralized rate limiting for Cloud Functions
 */

import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const db = getFirestore();
const COLLECTION = 'rateLimits';

interface RateLimitConfig {
    maxRequests: number;      // Max requests allowed
    windowMs: number;         // Time window in milliseconds
    blockDurationMs?: number; // How long to block after limit exceeded
}

interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: Date;
    blocked?: boolean;
}

// Default limits for different actions
export const RATE_LIMITS = {
    submission: { maxRequests: 5, windowMs: 60 * 60 * 1000 },        // 5 per hour
    review: { maxRequests: 10, windowMs: 60 * 60 * 1000 },           // 10 per hour
    vote: { maxRequests: 30, windowMs: 60 * 1000 },                  // 30 per minute
    search: { maxRequests: 60, windowMs: 60 * 1000 },                // 60 per minute
    aiGeneration: { maxRequests: 100, windowMs: 60 * 60 * 1000 },    // 100 per hour (increased for batch)
} as const;

// Keys that bypass rate limiting entirely (e.g., batch processor, admin)
export const BYPASS_KEYS = ['batch-processor', 'admin-internal'] as const;

/**
 * Check and update rate limit for a given key
 * @param key Unique identifier (e.g., IP address, user ID)
 * @param action Type of action being rate limited
 * @param config Optional custom config
 */
export async function checkRateLimit(
    key: string,
    action: keyof typeof RATE_LIMITS,
    config?: Partial<RateLimitConfig>
): Promise<RateLimitResult> {
    // Allow bypass for admin/batch operations
    if (BYPASS_KEYS.includes(key as any)) {
        return {
            allowed: true,
            remaining: 9999,
            resetAt: new Date(Date.now() + 60 * 60 * 1000),
        };
    }

    const limits = { ...RATE_LIMITS[action], ...config };
    const docId = `${action}:${key}`;
    const docRef = db.collection(COLLECTION).doc(docId);

    const now = Date.now();
    const windowStart = now - limits.windowMs;

    try {
        const result = await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(docRef);
            const data = doc.data();

            // Check if blocked
            if (data?.blockedUntil && data.blockedUntil.toMillis() > now) {
                return {
                    allowed: false,
                    remaining: 0,
                    resetAt: data.blockedUntil.toDate(),
                    blocked: true,
                };
            }

            // Filter requests within window
            const requests: number[] = (data?.requests || [])
                .filter((ts: number) => ts > windowStart);

            if (requests.length >= limits.maxRequests) {
                // Rate limit exceeded
                const resetAt = new Date(requests[0] + limits.windowMs);

                // Optionally block for longer
                if (limits.blockDurationMs) {
                    transaction.set(docRef, {
                        requests,
                        blockedUntil: new Date(now + limits.blockDurationMs),
                        updatedAt: FieldValue.serverTimestamp(),
                    }, { merge: true });
                }

                return {
                    allowed: false,
                    remaining: 0,
                    resetAt,
                    blocked: false,
                };
            }

            // Allow request and record it
            requests.push(now);
            transaction.set(docRef, {
                requests,
                blockedUntil: null,
                updatedAt: FieldValue.serverTimestamp(),
            }, { merge: true });

            return {
                allowed: true,
                remaining: limits.maxRequests - requests.length,
                resetAt: new Date(requests[0] + limits.windowMs),
            };
        });

        return result;
    } catch (error) {
        // On error, allow request but log warning
        console.warn('Rate limit check failed:', error);
        return {
            allowed: true,
            remaining: limits.maxRequests,
            resetAt: new Date(now + limits.windowMs),
        };
    }
}

/**
 * Get client IP from request headers
 */
export function getClientIP(request: { headers: Record<string, string | string[] | undefined> }): string {
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) {
        const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
        return ip.trim();
    }
    return request.headers['x-real-ip'] as string || 'unknown';
}
