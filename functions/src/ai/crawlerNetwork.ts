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

/** Resource types to block or limit */
const BLOCKED_RESOURCE_TYPES = new Set(['media', 'font']);

/** Track stylesheets to only allow first one */
let stylesheetCount = 0;
const MAX_STYLESHEETS = 2;

/**
 * Check if URL matches any blocked pattern
 */
function isBlockedUrl(url: string): boolean {
    const lower = url.toLowerCase();
    return BLOCKED_PATTERNS.some(pattern => lower.includes(pattern));
}

/**
 * Setup request interception on a page
 * Blocks ads, tracking, and limits heavy resources
 */
export async function setupRequestInterception(page: Page): Promise<void> {
    stylesheetCount = 0; // Reset counter for each page

    await page.setRequestInterception(true);

    page.on('request', (request) => {
        const url = request.url();
        const resourceType = request.resourceType();

        // Block known ad/tracking URLs
        if (isBlockedUrl(url)) {
            logger.info(`Blocked: ${url.substring(0, 60)}...`);
            request.abort();
            return;
        }

        // Block heavy resource types
        if (BLOCKED_RESOURCE_TYPES.has(resourceType)) {
            request.abort();
            return;
        }

        // Limit stylesheets (allow first 2)
        if (resourceType === 'stylesheet') {
            stylesheetCount++;
            if (stylesheetCount > MAX_STYLESHEETS) {
                request.abort();
                return;
            }
        }

        // Allow everything else
        request.continue();
    });

    logger.info('Request interception enabled');
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
