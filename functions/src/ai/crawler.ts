/**
 * Crawler Agent - The Orchestrator
 * Human-like crawling with AI enhancements
 */

import puppeteer, { Browser, Page } from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import * as logger from 'firebase-functions/logger';

import { getPageState } from './crawlerDOM';
import { detectBlocker, findBestAction, isContentPage } from './crawlerDecide';
import { captureScreenshot, extractSEO, clickByText } from './crawlerAct';
import { setupRequestInterception } from './crawlerNetwork';
import { retryableNavigate } from './crawlerRetry';
import { findBestActionWithAI, isContentPageWithAI } from './crawlerAI';
import {
    randomDelay, waitForPageReady, humanScroll,
    dismissOverlay, isSameDomain, shouldAvoidUrl, setHumanFingerprint
} from './crawlerHuman';

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

/** Check if running locally */
function isLocalDev(): boolean {
    return process.env.FUNCTIONS_EMULATOR === 'true' ||
        process.env.NODE_ENV === 'development';
}

/** Get local Chrome path */
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

/** Launch browser */
async function launchBrowser(): Promise<Browser> {
    const isLocal = isLocalDev();

    if (isLocal) {
        const localPath = getLocalChromePath();
        if (!localPath) throw new Error('Chrome not found');
        logger.info('Using local Chrome');
        return puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            defaultViewport: { width: 1280, height: 800 },
            executablePath: localPath,
            headless: true,
        });
    }

    return puppeteer.launch({
        args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1280, height: 800 },
        executablePath: await chromium.executablePath(),
        headless: true,
    });
}

/**
 * Main crawl function - human-like behavior
 */
export async function crawlSite(url: string): Promise<CrawlResult> {
    if (!isValidUrl(url)) throw new Error('Invalid URL');

    logger.info('Starting human-like crawl:', url);
    const startTime = Date.now();
    const browser = await launchBrowser();
    const screenshots: Buffer[] = [];
    const targetDomain = new URL(url).hostname;

    try {
        const page = await browser.newPage();
        page.setDefaultNavigationTimeout(45000);

        // Set up human-like fingerprint
        await setHumanFingerprint(page);
        await setupRequestInterception(page);

        // Navigate with retry
        const navigated = await retryableNavigate(page, url, { maxRetries: 3 });
        if (!navigated) throw new Error('Navigation failed');

        // Wait for page to fully render (CSS, fonts, etc.)
        await waitForPageReady(page);

        // Dismiss any initial overlays (age gates, cookies, popups)
        await handleOverlays(page);

        // Capture homepage screenshot
        const homeShot = await captureScreenshot(page);
        if (homeShot) {
            screenshots.push(homeShot);
            logger.info('Homepage captured');
        }

        // Human-like scroll to see more content
        await humanScroll(page, 400);
        await randomDelay(500, 1000);

        // Try to find and navigate to content
        await exploreContent(page, screenshots, homeShot, targetDomain);

        // Final scroll and capture
        if (screenshots.length < MAX_SCREENSHOTS) {
            await humanScroll(page, 300);
            await randomDelay(300, 600);
            const scrollShot = await captureScreenshot(page);
            if (scrollShot) screenshots.push(scrollShot);
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

/** Handle all blocking overlays */
async function handleOverlays(page: Page): Promise<void> {
    for (let i = 0; i < 3; i++) {
        const pageState = await getPageState(page);
        const blocker = detectBlocker(pageState);

        if (!blocker) break;

        logger.info(`Overlay detected: ${blocker.type}`);

        // Try specific dismiss first
        let dismissed = false;
        for (const text of blocker.actionTexts) {
            if (await clickByText(page, text)) {
                dismissed = true;
                await randomDelay(1000, 1500);
                break;
            }
        }

        // Fall back to generic dismissal
        if (!dismissed) {
            await dismissOverlay(page);
        }

        await randomDelay(500, 1000);
    }
}

/** Explore content like a human would */
async function exploreContent(
    page: Page,
    screenshots: Buffer[],
    homeShot: Buffer | null,
    targetDomain: string
): Promise<void> {
    if (screenshots.length >= MAX_SCREENSHOTS) return;

    const pageState = await getPageState(page);

    // Try heuristic action first
    let action = findBestAction(pageState);

    // Fall back to AI if needed
    if (!action && homeShot) {
        const aiDecision = await findBestActionWithAI(pageState, homeShot);
        if (aiDecision.target && aiDecision.confidence !== 'low') {
            action = {
                targetText: aiDecision.target,
                reason: aiDecision.reason,
                priority: 'medium'
            };
        }
    }

    if (!action) return;

    logger.info(`Exploring: ${action.targetText} (${action.reason})`);

    // Click and wait like a human
    if (await clickByText(page, action.targetText)) {
        await randomDelay(1500, 2500);
        await waitForPageReady(page);

        // Check if we navigated away from target domain
        const currentUrl = page.url();
        if (!isSameDomain(currentUrl, `https://${targetDomain}`)) {
            logger.warn('Left target domain, going back');
            await page.goBack();
            await waitForPageReady(page);
            return;
        }

        // Avoid login/signup pages
        if (shouldAvoidUrl(currentUrl)) {
            logger.warn('Hit login/auth page, going back');
            await page.goBack();
            await waitForPageReady(page);
            return;
        }

        // Dismiss any new overlays
        await dismissOverlay(page);

        // Capture content page
        const contentShot = await captureScreenshot(page);
        if (contentShot) {
            const newState = await getPageState(page);
            const isContent = isContentPage(newState) ||
                (homeShot && await isContentPageWithAI(contentShot));

            if (isContent) {
                logger.info('Content page captured!');
                screenshots.push(contentShot);
            }
        }
    }
}

export { launchBrowser };
