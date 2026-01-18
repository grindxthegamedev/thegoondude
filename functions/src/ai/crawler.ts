/**
 * Crawler Agent - The Orchestrator
 * Implements Observe → Decide → Act loop with AI enhancements
 */

import puppeteer, { Browser, Page } from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import * as logger from 'firebase-functions/logger';

import { getPageState } from './crawlerDOM';
import { detectBlocker, findBestAction, isContentPage } from './crawlerDecide';
import { delay, dismissBlocker, captureScreenshot, extractSEO, clickByText } from './crawlerAct';
import { setupRequestInterception } from './crawlerNetwork';
import { retryableNavigate } from './crawlerRetry';
import { findBestActionWithAI, isContentPageWithAI, aiGuidedScroll } from './crawlerAI';

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
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/usr/bin/google-chrome',
    ];
    const fs = require('fs');
    return paths.find(p => p && fs.existsSync(p));
}

/** Launch browser with optimized settings */
async function launchBrowser(): Promise<Browser> {
    const isLocal = isLocalDev();

    if (isLocal) {
        const localPath = getLocalChromePath();
        if (!localPath) throw new Error('Chrome not found');
        logger.info('Using local Chrome:', localPath);

        return puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
            defaultViewport: { width: 1280, height: 800 },
            executablePath: localPath,
            headless: true,
        });
    }

    logger.info('Using serverless Chromium');
    return puppeteer.launch({
        args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        defaultViewport: { width: 1280, height: 800 },
        executablePath: await chromium.executablePath(),
        headless: true,
    });
}

/**
 * Main crawl function with AI enhancements
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

        // Enable request interception (blocks ads/tracking)
        await setupRequestInterception(page);

        // Navigate with retry
        const navigated = await retryableNavigate(page, url, { maxRetries: 3 });
        if (!navigated) throw new Error('Navigation failed after retries');

        // Handle blockers
        await handleBlockers(page);

        // Capture homepage
        const homeShot = await captureScreenshot(page);
        if (homeShot) screenshots.push(homeShot);
        logger.info('Homepage captured');

        // Find content with AI fallback
        await findAndCaptureContent(page, screenshots, homeShot);

        // AI-guided scrolling
        if (homeShot && screenshots.length < MAX_SCREENSHOTS) {
            await aiGuidedScroll(page, homeShot, async () => {
                if (screenshots.length < MAX_SCREENSHOTS) {
                    const shot = await captureScreenshot(page);
                    if (shot) screenshots.push(shot);
                }
            });
        }

        // Extract SEO data
        const { seo, faviconUrl } = await extractSEO(page);
        const loadTimeMs = Date.now() - startTime;

        logger.info(`Crawl complete: ${screenshots.length} screenshots in ${loadTimeMs}ms`);

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

/** Handle page blockers (age gates, cookies, etc.) */
async function handleBlockers(page: Page): Promise<void> {
    for (let attempts = 0; attempts < 3; attempts++) {
        const pageState = await getPageState(page);
        const blocker = detectBlocker(pageState);

        if (!blocker) {
            logger.info('No blockers detected');
            break;
        }

        logger.info(`Blocker detected: ${blocker.type}`);
        const dismissed = await dismissBlocker(page, blocker);

        if (!dismissed) {
            await clickByText(page, 'Enter') || await clickByText(page, 'Accept');
        }

        await delay(1500);
    }
}

/** Find and capture content with AI fallback */
async function findAndCaptureContent(page: Page, screenshots: Buffer[], homeShot: Buffer | null): Promise<void> {
    const pageState = await getPageState(page);

    // Try heuristic first
    let action = findBestAction(pageState);

    // Fall back to AI if heuristic fails
    if (!action && homeShot) {
        const aiDecision = await findBestActionWithAI(pageState, homeShot);
        if (aiDecision.target && aiDecision.confidence !== 'low') {
            action = { targetText: aiDecision.target, reason: aiDecision.reason, priority: 'medium' };
        }
    }

    if (action) {
        logger.info(`Action: ${action.targetText} (${action.reason})`);

        if (await clickByText(page, action.targetText)) {
            await delay(2000);

            // Check if content page
            const newShot = await captureScreenshot(page);
            if (newShot) {
                const newState = await getPageState(page);
                const isContent = isContentPage(newState) || await isContentPageWithAI(newShot);

                if (isContent) {
                    logger.info('Content page reached!');
                    screenshots.push(newShot);
                }
            }
        }
    }
}

export { launchBrowser };
