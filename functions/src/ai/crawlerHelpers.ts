/**
 * Crawler Helpers
 * Page interaction utilities for realistic browsing
 */

import { Page } from 'puppeteer-core';
import * as logger from 'firebase-functions/logger';
import { waitFor, clickAndVerify, clickWithRetry, dismissPopups, smartScroll } from './crawlerSmart';

const MAX_SCREENSHOTS = 5;

// Helper: wait (replacing old public delay function)
export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
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

/**
 * Click interactive elements and take "Journalist" snapshots of changes
 * Mimics an agent observing the result of an action
 */
async function clickInteractiveElements(page: Page, screenshots: Buffer[]): Promise<void> {
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
        if (clicked >= 2 || screenshots.length >= MAX_SCREENSHOTS) break;

        try {
            const el = await page.$(selector);
            if (el) {
                await el.hover();
                await delay(300);
            }

            // Click with verification
            if (await clickAndVerify(page, selector)) {
                await delay(800); // Wait for animation
                clicked++;

                // Journalist Move: Capture the result of the interaction
                const shot = await captureScreenshot(page);
                if (shot) {
                    screenshots.push(shot);
                    logger.info(`Interaction snapshot captured: ${selector}`);
                }
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
            .slice(0, 2)
    );

    for (const link of deepLinks) {
        if (screenshots.length >= MAX_SCREENSHOTS) break;
        try {
            logger.info(`Exploring deep link: ${link}`);
            await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 15000 });
            await waitFor(page, 'body');
            await dismissPopups(page);

            // Try to find a "Start" or "Enter" button here
            await clickWithRetry(page, 'button[class*="start"], button[class*="enter"]', 1);

            // Snapshot the "Session" or Config result
            const shot = await captureScreenshot(page);
            if (shot) screenshots.push(shot);

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

    // Ensure at least one shot
    if (screenshots.length === 0) {
        const homeShot = await captureScreenshot(page);
        if (homeShot) screenshots.push(homeShot);
    }

    // 2. Interactive Exploration (Modals, Toggles) - Journalist Style
    await clickInteractiveElements(page, screenshots);

    // 3. Deep Navigation (Hub & Spoke)
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

            // From here, try to click a content item (Spoke)
            await delay(1000);
            await clickWithRetry(page, '[class*="card"] a, [class*="video"] a, .thumbnail', 1);
            await delay(1500);

            const itemShot = await captureScreenshot(page);
            if (itemShot && screenshots.length < MAX_SCREENSHOTS) screenshots.push(itemShot);

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
