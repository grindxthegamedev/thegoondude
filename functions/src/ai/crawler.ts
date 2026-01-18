/**
 * Crawler Agent - The Orchestrator
 * Implements Manus-style Observe → Decide → Act loop
 */

import puppeteer, { Browser } from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import * as logger from 'firebase-functions/logger';

import { getPageState } from './crawlerDOM';
import { detectBlocker, findBestAction, isContentPage } from './crawlerDecide';
import { delay, dismissBlocker, smartScroll, captureScreenshot, extractSEO, navigate, clickByText } from './crawlerAct';

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
}

const MAX_SCREENSHOTS = 5;

/** Validate URL is safe to crawl */
function isValidUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
        return false;
    }
}

/** Check if running locally (emulator) */
function isLocalDev(): boolean {
    return process.env.FUNCTIONS_EMULATOR === 'true' ||
        process.env.NODE_ENV === 'development';
}

/** Get local Chrome executable path */
function getLocalChromePath(): string | undefined {
    const paths = [
        // Windows
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
        // macOS
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        // Linux
        '/usr/bin/google-chrome',
        '/usr/bin/chromium-browser',
    ];

    const fs = require('fs');
    for (const p of paths) {
        if (p && fs.existsSync(p)) {
            return p;
        }
    }
    return undefined;
}

/** Launch browser with optimized settings */
async function launchBrowser(): Promise<Browser> {
    const isLocal = isLocalDev();

    if (isLocal) {
        // Local development - use local Chrome
        const localPath = getLocalChromePath();
        if (!localPath) {
            throw new Error('Chrome not found. Please install Chrome or set FUNCTIONS_EMULATOR=false to use serverless Chromium.');
        }
        logger.info('Using local Chrome:', localPath);

        return puppeteer.launch({
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
            ],
            defaultViewport: { width: 1280, height: 800 },
            executablePath: localPath,
            headless: true,
        });
    }

    // Production - use @sparticuz/chromium for Cloud Functions
    logger.info('Using serverless Chromium');
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
 * Main crawl function with Observe → Decide → Act loop
 */
export async function crawlSite(url: string): Promise<CrawlResult> {
    if (!isValidUrl(url)) throw new Error('Invalid URL');

    logger.info('Starting intelligent crawl:', url);
    const startTime = Date.now();
    const browser = await launchBrowser();
    const screenshots: Buffer[] = [];

    try {
        const page = await browser.newPage();
        page.setDefaultNavigationTimeout(45000);

        // Navigate to homepage
        await navigate(page, url);

        // PHASE 1: Handle Blockers (Age gates, Cookies, etc.)
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
            const pageState = await getPageState(page);
            const blocker = detectBlocker(pageState);

            if (!blocker) {
                logger.info('No blockers detected, proceeding...');
                break;
            }

            logger.info(`Blocker detected: ${blocker.type}`);
            const dismissed = await dismissBlocker(page, blocker);

            if (!dismissed) {
                logger.warn('Could not dismiss blocker, trying fallback...');
                // Fallback: try clicking any "Enter" or "Accept" button
                await clickByText(page, 'Enter') || await clickByText(page, 'Accept');
            }

            await delay(1500);
            attempts++;
        }

        // PHASE 2: Capture Homepage
        const homeShot = await captureScreenshot(page);
        if (homeShot) screenshots.push(homeShot);
        logger.info('Homepage captured');

        // PHASE 3: Find and capture Content
        const pageState = await getPageState(page);
        const action = findBestAction(pageState);

        if (action) {
            logger.info(`Best action found: ${action.targetText} (${action.reason})`);

            if (await clickByText(page, action.targetText)) {
                await delay(2000);

                // Check if we reached content
                const newState = await getPageState(page);
                if (isContentPage(newState)) {
                    logger.info('Content page reached!');
                    const contentShot = await captureScreenshot(page);
                    if (contentShot) screenshots.push(contentShot);
                }
            }
        }

        // PHASE 4: Scroll and capture more
        await smartScroll(page, async () => {
            if (screenshots.length < MAX_SCREENSHOTS) {
                const shot = await captureScreenshot(page);
                if (shot) screenshots.push(shot);
            }
        });

        // Extract SEO and performance data
        const { seo, faviconUrl } = await extractSEO(page);
        const loadTimeMs = Date.now() - startTime;

        logger.info(`Crawl complete: ${screenshots.length} screenshots`);

        return {
            screenshots,
            seo,
            performance: { loadTimeMs, pageSize: 0 },
            faviconUrl
        };
    } finally {
        await browser.close();
    }
}

export { launchBrowser };
