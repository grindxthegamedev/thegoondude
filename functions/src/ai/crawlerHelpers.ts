/**
 * Crawler Helpers
 * Page interaction utilities for realistic browsing
 */

import { Page } from 'puppeteer-core';
import * as logger from 'firebase-functions/logger';

import { waitFor, clickAndVerify, clickWithRetry, hasVisibleModal, smartScroll } from './crawlerSmart';

const MAX_SCREENSHOTS = 5;

/**
 * Simple delay helper
 */
export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Dismiss common popups, overlays, cookie banners
 */
export async function dismissPopups(page: Page): Promise<void> {
    const dismissSelectors = [
        // Cookie banners
        '[class*="cookie"] button[class*="accept"]',
        '[class*="cookie"] button[class*="agree"]',
        '[id*="cookie"] button', '.cookie-banner button',
        // Age verification
        '[class*="age"] button[class*="enter"]',
        '[class*="age"] button[class*="yes"]',
        '.age-gate button', '#age-verify button',
        // Auth modals (dismiss without logging in)
        '[class*="auth"] [class*="close"]',
        '[class*="login"] [class*="close"]',
        '[class*="signup"] [class*="close"]',
        // Generic close
        '[class*="modal"] [class*="close"]',
        '[class*="popup"] [class*="close"]',
        'button[aria-label="Close"]', 'button[aria-label*="close"]',
        '.close-button', '[class*="dismiss"]',
        // Specific Pump34-like
        '[class*="modal-backdrop"]',
    ];

    // Smart check first
    if (await hasVisibleModal(page)) {
        logger.info('Visible modal detected, attempting dismissal...');
        for (const selector of dismissSelectors) {
            try {
                if (await clickAndVerify(page, selector)) {
                    logger.info('Dismissed popup:', selector);
                    await delay(400);
                    if (!await hasVisibleModal(page)) break;
                }
            } catch { /* ignore */ }
        }
    }
}

/**
 * Extract SEO data and favicon from page
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

/**
 * Capture screenshot with error handling
 */
async function captureScreenshot(page: Page): Promise<Buffer | null> {
    try {
        return await page.screenshot({ type: 'png', fullPage: false }) as Buffer;
    } catch (err) {
        logger.warn('Screenshot capture failed:', err);
        return null;
    }
}

async function clickInteractiveElements(page: Page): Promise<void> {
    const selectors = [
        // Filters / Tags / Pills (generalized)
        '[class*="pill"]:not(.active)', '[class*="tag"]:not(.active)',
        '[class*="chip"]:not(.active)', '[class*="filter"]:nth-child(2)',
        // Randomizers / Surprise
        '[class*="random"]', '[class*="surprise"]', '[class*="shuffle"]',
        // Navigation
        '.carousel-next', '.slick-next', '[class*="next"]',
        // Content cards
        '[class*="card"]:nth-child(2)', '[class*="video"]:nth-child(1)',
        '.thumbnail:nth-child(2)',
        // Toggles (click to show state change)
        '[class*="toggle"]:not(.active)', '[class*="switch"]',
    ];

    logger.info('Exploring interactive elements...');
    let clicked = 0;

    for (const selector of selectors) {
        if (clicked >= 2) break;
        // Hover first
        try {
            const el = await page.$(selector);
            if (el) {
                await el.hover();
                await delay(300);
            }

            // Click with verification
            if (await clickAndVerify(page, selector)) {
                await delay(800);
                clicked++;
            }
        } catch { /* ignore */ }
    }
}

/**
 * Explore deep links (multi-step flow) like config pages
 */
async function exploreDeepLinks(page: Page, screenshots: Buffer[]): Promise<void> {
    if (screenshots.length >= MAX_SCREENSHOTS) return;

    // Find interesting deep links (config, setup, start)
    const deepLinks = await page.$$eval('a[href]', (anchors) =>
        anchors
            .map(a => a.href)
            .filter(href => href.includes('/config') || href.includes('/setup') || href.includes('/session'))
            .slice(0, 2) // Limit to 2 deep explorations
    );

    for (const link of deepLinks) {
        if (screenshots.length >= MAX_SCREENSHOTS) break;
        try {
            logger.info(`Exploring deep link: ${link}`);
            await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 15000 });
            await waitFor(page, 'body'); // Ensure render
            await dismissPopups(page);

            // Try to find a "Start" or "Enter" button here
            await clickWithRetry(page, 'button[class*="start"], button[class*="enter"]', 1);

            const shot = await captureScreenshot(page);
            if (shot) screenshots.push(shot);

            // Go back to continue
            await page.goBack();
            await delay(500);
        } catch (err) {
            logger.warn('Deep link exploration failed:', err);
        }
    }
}

/**
 * Capture multiple screenshots with browsing behavior
 * Implements "Hub and Spoke" traversal: Home -> Category -> List -> Home
 */
export async function captureMultipleScreenshots(page: Page, baseUrl: string): Promise<Buffer[]> {
    const screenshots: Buffer[] = [];

    // 1. Initial State: Scroll and capture intelligently
    logger.info('Performing smart scroll with snapshots...');

    await smartScroll(page, async () => {
        if (screenshots.length < MAX_SCREENSHOTS) {
            const shot = await captureScreenshot(page);
            if (shot) {
                screenshots.push(shot);
                logger.info(`Smart snapshot captured (${screenshots.length}/${MAX_SCREENSHOTS})`);
            }
        }
    });

    // Ensure at least one shot if scroll didn't trigger any
    if (screenshots.length === 0) {
        const homeShot = await captureScreenshot(page);
        if (homeShot) screenshots.push(homeShot);
    }

    // 2. Interactive Exploration (Modals, Toggles)
    await clickInteractiveElements(page);

    // 3. Deep Navigation (Hub & Spoke)
    // Find category/nav links to explore lists of content
    const navLinks = await page.$$eval('a[href]', (anchors) =>
        anchors
            .map(a => a.href)
            .filter(href => !href.includes('#') && (href.includes('/category') || href.includes('/tags') || href.includes('/browse')))
            .slice(0, 2)
    );

    for (const link of navLinks) {
        if (screenshots.length >= MAX_SCREENSHOTS) break;
        try {
            logger.info(`Navigating to hub: ${link}`);
            await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 20000 });
            await waitFor(page, 'body');
            await dismissPopups(page);

            // Scroll new page with snapshots
            await smartScroll(page, async () => {
                if (screenshots.length < MAX_SCREENSHOTS) {
                    const shot = await captureScreenshot(page);
                    if (shot) screenshots.push(shot);
                }
            });

            const shot = await captureScreenshot(page);
            if (shot && screenshots.length < MAX_SCREENSHOTS) screenshots.push(shot);

            // From here, try to click a content item (Spoke)
            await clickWithRetry(page, '[class*="card"] a, [class*="video"] a, .thumbnail', 1);
            await delay(1500);

            const itemShot = await captureScreenshot(page);
            if (itemShot && screenshots.length < MAX_SCREENSHOTS) screenshots.push(itemShot);

            // Return to base for next iteration if needed
        } catch (err) {
            logger.warn('Hub traversal failed:', err);
        }
    }

    // 4. Explore Deep Links/Config if we still need frames
    if (screenshots.length < MAX_SCREENSHOTS) {
        await exploreDeepLinks(page, screenshots);
    }

    return screenshots;
}
