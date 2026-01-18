/**
 * Crawler Network - Request Interception
 * Blocks ads, tracking, and heavy resources to speed up crawling
 */

import { Page } from 'puppeteer-core';
import * as logger from 'firebase-functions/logger';

/** URL patterns to block (ads, tracking, analytics) */
const BLOCKED_PATTERNS = [
    // Advertising
    'doubleclick', 'googlesyndication', 'adserver', 'adsystem',
    'adnxs', 'advertising', 'adform', 'adtech', 'pubmatic',
    'rubiconproject', 'openx', 'criteo', 'taboola', 'outbrain',
    // Tracking & Analytics
    'google-analytics', 'googletagmanager', 'facebook.net',
    'connect.facebook', 'analytics', 'tracking', 'pixel',
    'hotjar', 'clarity.ms', 'segment.io', 'mixpanel',
    // Heavy media (not needed for screenshots)
    'youtube.com/embed', 'player.vimeo',
];

/** Resource types to block (only heavy media) */
const BLOCKED_RESOURCE_TYPES = new Set(['media']); // Removed 'font' - affects layout

/**
 * Check if URL matches any blocked pattern
 */
function isBlockedUrl(url: string): boolean {
    const lower = url.toLowerCase();
    return BLOCKED_PATTERNS.some(pattern => lower.includes(pattern));
}

/**
 * Setup request interception on a page
 * Blocks ads and tracking only - keeps styles/fonts for proper rendering
 */
export async function setupRequestInterception(page: Page): Promise<void> {
    await page.setRequestInterception(true);

    page.on('request', (request) => {
        const url = request.url();
        const resourceType = request.resourceType();

        // Block known ad/tracking URLs
        if (isBlockedUrl(url)) {
            request.abort();
            return;
        }

        // Block heavy media (videos, large files)
        if (BLOCKED_RESOURCE_TYPES.has(resourceType)) {
            request.abort();
            return;
        }

        // Allow everything else (including stylesheets and fonts)
        request.continue();
    });

    logger.info('Request interception enabled (ads/tracking blocked)');
}

/**
 * Disable request interception (cleanup)
 */
export async function disableRequestInterception(page: Page): Promise<void> {
    try {
        await page.setRequestInterception(false);
    } catch {
        // Page may already be closed
    }
}
