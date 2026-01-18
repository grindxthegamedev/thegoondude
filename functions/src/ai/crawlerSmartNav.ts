/**
 * Crawler Smart Navigation
 * Scroll, popup, and page navigation utilities
 */

import { Page } from 'puppeteer-core';
import * as logger from 'firebase-functions/logger';
import { findByText, clickAndVerify, hasVisibleModal } from './crawlerSmartDOM';

/** Wait for a specific time */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Smart scroll that mimics human reading behavior
 * Scrolls in chunks with variable pauses, allowing for screenshots
 */
export async function smartScroll(page: Page, onSnapshot?: () => Promise<void>): Promise<void> {
    try {
        const dimensions = await page.evaluate(() => ({
            totalHeight: document.body.scrollHeight,
            viewportHeight: window.innerHeight
        }));

        let currentPosition = 0;
        const { totalHeight, viewportHeight } = dimensions;

        // Scroll loop controlled from Node.js
        while (currentPosition < totalHeight) {
            // Random scroll amount: 50-80% of viewport
            const scrollAmount = Math.floor(viewportHeight * (0.5 + Math.random() * 0.3));
            currentPosition += scrollAmount;

            await page.evaluate((pos) => {
                window.scrollTo({ top: pos, behavior: 'smooth' });
            }, currentPosition);

            // Random pause for "reading": 400ms - 1500ms
            const pause = 400 + Math.random() * 1100;
            await delay(pause);

            // Intelligent Snapshot Point
            if (onSnapshot) {
                await onSnapshot();
            }

            // Small chance to scroll up a tiny bit (re-reading)
            if (Math.random() < 0.2) {
                await page.evaluate(() => window.scrollBy({ top: -100, behavior: 'smooth' }));
                await delay(300);
            }
        }

        // Return to top for further navigation
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'auto' }));
        await delay(500);
    } catch (err) {
        logger.warn('Smart scroll failed:', err);
    }
}

/**
 * Click element by text content with retry
 */
async function clickByText(page: Page, text: string): Promise<boolean> {
    const el = await findByText(page, text);
    if (el) {
        logger.info(`Clicking element with text: "${text}"`);
        return await clickAndVerify(page, el);
    }
    return false;
}

/**
 * Intelligently dismiss age gates, cookie banners, and popups
 * Uses text-based matching for resilience across different sites
 */
export async function dismissPopups(page: Page): Promise<void> {
    logger.info('Checking for blocking popups...');

    // 1. TEXT-BASED AGE GATE PATTERNS (Priority - These block everything)
    const ageGateTextPatterns = [
        'I am 18 or older',
        'I am over 18',
        'I\'m over 18',
        'Enter',
        'I agree',
        'Yes, I am 18',
        'Continue to site',
        'Accept & Enter',
        'Enter Site',
    ];

    for (const text of ageGateTextPatterns) {
        if (await clickByText(page, text)) {
            logger.info(`Dismissed age gate via text: "${text}"`);
            await delay(1500);
            break; // Successfully passed the gate
        }
    }

    // 2. CSS-BASED SELECTORS (Fallback for cookie/misc popups)
    const dismissSelectors = [
        // Cookie banners
        '[class*="cookie"] button[class*="accept"]',
        '[class*="cookie"] button[class*="agree"]',
        '[id*="cookie"] button', '.cookie-banner button',
        'button[class*="consent"]', '[class*="gdpr"] button',
        // Age verification (CSS fallback)
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
    ];

    // Only proceed if there's still a visible modal
    if (await hasVisibleModal(page)) {
        logger.info('Modal still visible, trying CSS selectors...');
        for (const selector of dismissSelectors) {
            try {
                if (await clickAndVerify(page, selector)) {
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
