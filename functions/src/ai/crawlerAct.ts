/**
 * Crawler Act - The "Hands"
 * Executes actions decided by the brain
 */

import { Page } from 'puppeteer-core';
import * as logger from 'firebase-functions/logger';
import { findElementByText } from './crawlerDOM';
import { BlockerInfo } from './crawlerDecide';

/** Simple delay helper */
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Click an element by its visible text content
 */
export async function clickByText(page: Page, text: string): Promise<boolean> {
    logger.info(`Attempting to click: "${text}"`);

    const clicked = await findElementByText(page, text);

    if (clicked) {
        logger.info(`Successfully clicked: "${text}"`);
        await delay(1500); // Wait for page response
        return true;
    }

    logger.warn(`Could not find element with text: "${text}"`);
    return false;
}

/**
 * Dismiss a detected blocker using semantic clicking
 */
export async function dismissBlocker(page: Page, blocker: BlockerInfo): Promise<boolean> {
    logger.info(`Attempting to dismiss ${blocker.type}...`);

    for (const actionText of blocker.actionTexts) {
        if (await clickByText(page, actionText)) {
            logger.info(`Blocker dismissed via: "${actionText}"`);
            await delay(1000);
            return true;
        }
    }

    logger.warn(`Failed to dismiss blocker: ${blocker.type}`);
    return false;
}

/**
 * Smart scroll that mimics human reading, with snapshot callback
 */
export async function smartScroll(page: Page, onSnapshot?: () => Promise<void>): Promise<void> {
    try {
        const dimensions = await page.evaluate(() => ({
            totalHeight: document.body.scrollHeight,
            viewportHeight: window.innerHeight
        }));

        let currentPosition = 0;
        const { totalHeight, viewportHeight } = dimensions;
        let scrollCount = 0;
        const maxScrolls = 5; // Limit scrolls to avoid infinite loops

        while (currentPosition < totalHeight && scrollCount < maxScrolls) {
            const scrollAmount = Math.floor(viewportHeight * (0.5 + Math.random() * 0.3));
            currentPosition += scrollAmount;

            await page.evaluate((pos) => {
                window.scrollTo({ top: pos, behavior: 'smooth' });
            }, currentPosition);

            // Reading pause: 400-1200ms
            const pause = 400 + Math.random() * 800;
            await delay(pause);

            if (onSnapshot) {
                await onSnapshot();
            }

            scrollCount++;
        }

        // Return to top
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'auto' }));
        await delay(300);
    } catch (err) {
        logger.warn('Smart scroll failed:', err);
    }
}

/**
 * Capture screenshot with error handling
 */
export async function captureScreenshot(page: Page): Promise<Buffer | null> {
    try {
        return await page.screenshot({ type: 'png', fullPage: false }) as Buffer;
    } catch (err) {
        logger.warn('Screenshot failed:', err);
        return null;
    }
}

/**
 * Navigate to a URL and wait for load
 */
export async function navigate(page: Page, url: string): Promise<boolean> {
    try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await delay(1500);
        return true;
    } catch (err) {
        logger.warn(`Navigation failed: ${url}`, err);
        return false;
    }
}

/**
 * Click the first matching button/link by text (for content exploration)
 */
export async function exploreContent(page: Page, targetText: string): Promise<boolean> {
    return clickByText(page, targetText);
}

/**
 * Extract SEO data from page
 */
export async function extractSEO(page: Page): Promise<{
    seo: { title: string; description: string; keywords: string[]; h1: string; canonical: string };
    faviconUrl: string;
}> {
    return page.evaluate(() => {
        const getMeta = (name: string): string => {
            const el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
            return el?.getAttribute('content') || '';
        };

        const faviconEl = document.querySelector('link[rel="icon"], link[rel="shortcut icon"]') as HTMLLinkElement | null;
        const favicon = faviconEl?.href || new URL('/favicon.ico', location.origin).href;

        return {
            seo: {
                title: document.title || '',
                description: getMeta('description') || getMeta('og:description'),
                keywords: (getMeta('keywords') || '').split(',').map(k => k.trim()).filter(Boolean),
                h1: document.querySelector('h1')?.textContent?.trim() || '',
                canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') || '',
            },
            faviconUrl: favicon,
        };
    });
}
