/**
 * Crawler Human - Human-like behavior simulation
 * Makes the crawler behave naturally across all sites
 */

import { Page } from 'puppeteer-core';
import * as logger from 'firebase-functions/logger';

/**
 * Random delay between actions (human-like timing)
 */
export function randomDelay(minMs: number, maxMs: number): Promise<void> {
    const delay = Math.floor(Math.random() * (maxMs - minMs)) + minMs;
    return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Wait for page to be fully loaded (network idle + render)
 */
export async function waitForPageReady(page: Page, timeout = 10000): Promise<void> {
    try {
        await Promise.race([
            page.waitForNetworkIdle({ idleTime: 1500, timeout }),
            new Promise(resolve => setTimeout(resolve, timeout))
        ]);
        // Extra wait for CSS animations/transitions
        await randomDelay(500, 1000);
    } catch {
        logger.warn('Page ready timeout, continuing anyway');
    }
}

/**
 * Human-like scroll behavior
 */
export async function humanScroll(page: Page, distance: number): Promise<void> {
    const steps = Math.floor(Math.abs(distance) / 100);
    const direction = distance > 0 ? 1 : -1;

    for (let i = 0; i < steps; i++) {
        const stepSize = 80 + Math.random() * 40; // 80-120px per step
        await page.evaluate((d) => window.scrollBy(0, d), stepSize * direction);
        await randomDelay(50, 150);
    }
}

/**
 * Generic popup/overlay dismissal patterns
 */
const CLOSE_BUTTON_SELECTORS = [
    // Close icons
    '[class*="close"]', '[class*="Close"]',
    '[aria-label*="close"]', '[aria-label*="Close"]',
    '[class*="dismiss"]', '[class*="Dismiss"]',
    // X buttons
    'button[class*="x"]', '.modal-close', '.overlay-close',
    // Common SVG close buttons
    'svg[class*="close"]', '[data-testid="close"]',
    // Specific patterns
    '.cookie-close', '.age-close', '.popup-close',
];

const DISMISS_TEXT_PATTERNS = [
    // Age verification
    /^(i am|i'm) (18|over 18|of age)/i,
    /^(yes|enter|continue|agree|accept)/i,
    /^i (agree|accept|confirm)/i,
    // Cookie banners
    /^(accept|got it|ok|okay|agree)/i,
    // Skip/close
    /^(close|skip|no thanks|maybe later|not now)/i,
];

/**
 * Try to close any blocking overlay
 */
export async function dismissOverlay(page: Page): Promise<boolean> {
    // Strategy 1: Click close button by selector
    for (const selector of CLOSE_BUTTON_SELECTORS) {
        try {
            const btn = await page.$(selector);
            if (btn) {
                const isVisible = await btn.isIntersectingViewport();
                if (isVisible) {
                    await btn.click();
                    await randomDelay(500, 1000);
                    logger.info(`Closed overlay via selector: ${selector}`);
                    return true;
                }
            }
        } catch { /* continue */ }
    }

    // Strategy 2: Find button by text pattern
    try {
        const buttons = await page.$$('button, a, [role="button"]');
        for (const btn of buttons) {
            const text = await btn.evaluate(el => el.textContent?.trim() || '');
            if (DISMISS_TEXT_PATTERNS.some(p => p.test(text))) {
                const isVisible = await btn.isIntersectingViewport();
                if (isVisible) {
                    await btn.click();
                    await randomDelay(500, 1000);
                    logger.info(`Dismissed overlay via text: "${text}"`);
                    return true;
                }
            }
        }
    } catch { /* continue */ }

    // Strategy 3: Press Escape key
    try {
        await page.keyboard.press('Escape');
        await randomDelay(300, 500);
    } catch { /* ignore */ }

    return false;
}

/**
 * Check if current URL is on the same domain as target
 */
export function isSameDomain(currentUrl: string, targetUrl: string): boolean {
    try {
        const current = new URL(currentUrl);
        const target = new URL(targetUrl);
        return current.hostname === target.hostname ||
            current.hostname.endsWith('.' + target.hostname) ||
            target.hostname.endsWith('.' + current.hostname);
    } catch {
        return false;
    }
}

/**
 * URLs patterns to avoid (login, signup, external)
 */
const AVOID_URL_PATTERNS = [
    '/auth', '/login', '/signin', '/signup', '/register',
    '/account', '/profile', '/settings', '/oauth',
    'discord.com', 'twitter.com', 'facebook.com',
    'instagram.com', 'telegram.', 'reddit.com',
];

/**
 * Check if URL should be avoided
 */
export function shouldAvoidUrl(url: string): boolean {
    const lower = url.toLowerCase();
    return AVOID_URL_PATTERNS.some(p => lower.includes(p));
}

/**
 * Set human-like browser fingerprint
 */
export async function setHumanFingerprint(page: Page): Promise<void> {
    // Override navigator properties to look more human
    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
        Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
        Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
    });

    // Set realistic user agent
    await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
}
