/**
 * Crawler Helpers
 * Page interaction utilities for realistic browsing
 */

import { Page } from 'puppeteer-core';
import * as logger from 'firebase-functions/logger';

const MAX_SCREENSHOTS = 5;
const SCREENSHOT_DELAY_MS = 1000;

/**
 * Simple delay helper
 */
export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Smooth scroll down the page to trigger lazy loading
 */
export async function scrollPage(page: Page): Promise<void> {
    try {
        await page.evaluate(async () => {
            const scrollStep = window.innerHeight / 2;
            const maxScroll = Math.min(document.body.scrollHeight, window.innerHeight * 3);

            for (let y = 0; y < maxScroll; y += scrollStep) {
                window.scrollTo({ top: y, behavior: 'smooth' });
                await new Promise(r => setTimeout(r, 300));
            }
            // Scroll back to top for screenshot
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        await delay(500);
    } catch (err) {
        logger.warn('Scroll failed:', err);
    }
}

/**
 * Dismiss common popups, overlays, cookie banners
 */
export async function dismissPopups(page: Page): Promise<void> {
    const dismissSelectors = [
        // Cookie banners
        '[class*="cookie"] button[class*="accept"]',
        '[class*="cookie"] button[class*="agree"]',
        '[id*="cookie"] button',
        '.cookie-banner button',
        '#cookie-consent button',
        // Age verification
        '[class*="age"] button[class*="enter"]',
        '[class*="age"] button[class*="yes"]',
        '.age-gate button',
        '#age-verify button',
        // Generic close buttons
        '[class*="modal"] [class*="close"]',
        '[class*="popup"] [class*="close"]',
        '[class*="overlay"] button[class*="close"]',
        'button[aria-label="Close"]',
        '.close-button',
    ];

    for (const selector of dismissSelectors) {
        try {
            const element = await page.$(selector);
            if (element) {
                await element.click();
                logger.info('Dismissed popup:', selector);
                await delay(500);
            }
        } catch {
            // Ignore click failures
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
 * Get internal links for navigation, prioritizing unique sections
 */
async function getInternalLinks(page: Page, baseUrl: string): Promise<string[]> {
    const baseHost = new URL(baseUrl).host;

    const links = await page.evaluate((host: string) => {
        const anchors = Array.from(document.querySelectorAll('a[href]'));
        return anchors
            .map(a => (a as HTMLAnchorElement).href)
            .filter(href => {
                try {
                    const url = new URL(href);
                    return url.host === host && !href.includes('#') && !href.includes('login');
                } catch {
                    return false;
                }
            });
    }, baseHost);

    // Deduplicate and shuffle for variety
    const unique = [...new Set(links)];
    return unique.sort(() => Math.random() - 0.5).slice(0, 10);
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
 * Click interactive elements like carousels, galleries
 */
async function clickInteractiveElements(page: Page): Promise<void> {
    const interactiveSelectors = [
        '.carousel-next', '.slick-next', '[class*="next"]',
        '.gallery-item:nth-child(2)', '.thumbnail:nth-child(2)',
        '[class*="tab"]:nth-child(2)', '.nav-tab:nth-child(2)',
    ];

    for (const selector of interactiveSelectors.slice(0, 2)) {
        try {
            const element = await page.$(selector);
            if (element) {
                await element.click();
                await delay(800);
                break; // Only click one
            }
        } catch {
            // Ignore
        }
    }
}

/**
 * Capture multiple screenshots with browsing behavior
 */
export async function captureMultipleScreenshots(page: Page, baseUrl: string): Promise<Buffer[]> {
    const screenshots: Buffer[] = [];

    // 1. Scroll and capture homepage
    await scrollPage(page);
    const homeShot = await captureScreenshot(page);
    if (homeShot) screenshots.push(homeShot);

    // 2. Try clicking interactive elements
    await clickInteractiveElements(page);

    // 3. Scroll down for another view
    await page.evaluate(() => window.scrollTo({ top: 600, behavior: 'smooth' }));
    await delay(500);
    const scrolledShot = await captureScreenshot(page);
    if (scrolledShot && screenshots.length < MAX_SCREENSHOTS) {
        screenshots.push(scrolledShot);
    }

    // 4. Navigate to internal pages
    const internalLinks = await getInternalLinks(page, baseUrl);
    logger.info(`Found ${internalLinks.length} internal links`);

    for (const link of internalLinks) {
        if (screenshots.length >= MAX_SCREENSHOTS) break;

        try {
            logger.info(`Navigating to: ${link}`);
            await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 20000 });
            await delay(SCREENSHOT_DELAY_MS);
            await dismissPopups(page);
            await scrollPage(page);

            const shot = await captureScreenshot(page);
            if (shot) {
                screenshots.push(shot);
                logger.info(`Screenshot ${screenshots.length}/${MAX_SCREENSHOTS} captured`);
            }
        } catch (navErr) {
            logger.warn(`Failed to navigate to ${link}:`, navErr);
        }
    }

    return screenshots;
}
