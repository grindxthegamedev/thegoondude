/**
 * Crawler Agent
 * Uses Puppeteer to capture multiple screenshots with realistic browsing
 */

import puppeteer, { Browser } from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import * as logger from 'firebase-functions/logger';
import { delay, dismissPopups, extractSEO, captureMultipleScreenshots } from './crawlerHelpers';
import { isAuthEnabled, injectAuthCookies, attemptGoogleAuth } from './crawlerAuth';

export interface SEOData {
    title: string;
    description: string;
    keywords: string[];
    h1: string;
    canonical: string;
}

export interface PerformanceData {
    loadTimeMs: number;
    pageSize: number;
}

export interface CrawlResult {
    screenshots: Buffer[];
    seo: SEOData;
    performance: PerformanceData;
    faviconUrl: string;
    authenticated?: boolean;
}

export interface CrawlOptions {
    useAuth?: boolean;
}



/**
 * Validate URL is safe to crawl
 */
function isValidUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
        return false;
    }
}

/**
 * Launch browser with optimized settings
 */
async function launchBrowser(): Promise<Browser> {
    return puppeteer.launch({
        args: [
            ...chromium.args,
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu'
        ],
        defaultViewport: { width: 1280, height: 800 },
        executablePath: await chromium.executablePath(),
        headless: true,
    });
}

/**
 * Crawl a website with realistic browsing behavior
 */
export async function crawlSite(url: string, options: CrawlOptions = {}): Promise<CrawlResult> {
    if (!isValidUrl(url)) {
        throw new Error('Invalid URL');
    }

    const { useAuth = false } = options;
    logger.info('Starting crawl:', url, useAuth ? '(with auth)' : '');
    const startTime = Date.now();
    const browser = await launchBrowser();
    let authenticated = false;

    try {
        const page = await browser.newPage();
        page.setDefaultNavigationTimeout(45000);

        // Inject auth cookies if enabled
        if (useAuth && await isAuthEnabled()) {
            authenticated = await injectAuthCookies(page);
            logger.info('Auth injection:', authenticated ? 'success' : 'failed');
        }

        // Navigate to homepage
        logger.info('Navigating to homepage...');
        const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
        await delay(2000);

        // Try Google auth if we see a login gate
        if (useAuth && !authenticated) {
            authenticated = await attemptGoogleAuth(page);
        }

        const loadTimeMs = Date.now() - startTime;
        logger.info('Page loaded in', loadTimeMs, 'ms');

        // Extract SEO and favicon
        const { seo, faviconUrl } = await extractSEO(page);
        logger.info('SEO extracted:', seo.title);

        // Dismiss popups/overlays
        await dismissPopups(page);

        // Capture screenshots with browsing behavior
        const screenshots = await captureMultipleScreenshots(page, url);
        logger.info(`Total screenshots captured: ${screenshots.length}`);

        const pageSize = parseInt(response?.headers()['content-length'] || '0', 10);

        return {
            screenshots,
            seo,
            performance: { loadTimeMs, pageSize },
            faviconUrl,
            authenticated,
        };
    } finally {
        await browser.close();
        logger.info('Browser closed');
    }
}

// Re-export for backward compatibility
export { launchBrowser };
