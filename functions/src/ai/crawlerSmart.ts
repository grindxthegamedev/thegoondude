/**
 * Crawler Smart Functions
 * Advanced DOM awareness, state detection, and verifiable interactions
 */

import { Page, ElementHandle } from 'puppeteer-core';
import * as logger from 'firebase-functions/logger';

/**
 * Wait for a specific time
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Smart wait for selector with timeout
 */
export async function waitFor(page: Page, selector: string, timeout = 5000): Promise<boolean> {
    try {
        await page.waitForSelector(selector, { timeout, visible: true });
        return true;
    } catch {
        return false;
    }
}

/**
 * Find element by visible text content (case-insensitive partial match)
 */
export async function findByText(page: Page, text: string, tag = '*'): Promise<ElementHandle | null> {
    try {
        const elements = await page.$$(tag);
        for (const el of elements) {
            const content = await page.evaluate(e => e.textContent, el);
            if (content?.toLowerCase().includes(text.toLowerCase())) {
                // Check visibility
                const isVisible = await page.evaluate(e => {
                    const style = window.getComputedStyle(e);
                    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
                }, el);

                if (isVisible) return el;
            }
        }
        return null;
    } catch {
        return null;
    }
}

/**
 * Click an element and verify if navigation or DOM change occurred
 */
export async function clickAndVerify(page: Page, selectorOrElement: string | ElementHandle): Promise<boolean> {
    const beforeUrl = page.url();
    // primitive body hash to detect content changes
    const beforeBodyHash = await page.evaluate(() => document.body.innerHTML.length);

    try {
        if (typeof selectorOrElement === 'string') {
            await page.click(selectorOrElement, { delay: 50 + Math.random() * 50 }); // Add minor human delay
        } else {
            await selectorOrElement.click({ delay: 50 + Math.random() * 50 });
        }

        // Wait for potential effect
        await delay(1000);

        const afterUrl = page.url();
        const afterBodyHash = await page.evaluate(() => document.body.innerHTML.length);

        const changed = beforeUrl !== afterUrl || Math.abs(beforeBodyHash - afterBodyHash) > 50;
        if (changed) logger.info('Interaction verified: content changed');

        return changed;
    } catch (err) {
        logger.warn('Click verification failed:', err);
        return false;
    }
}

/**
 * Click element by text content with retry
 */
export async function clickByText(page: Page, text: string): Promise<boolean> {
    const el = await findByText(page, text);
    if (el) {
        logger.info(`Clicking element with text: "${text}"`);
        return await clickAndVerify(page, el);
    }
    return false;
}

/**
 * Check if a modal is currently visible
 */
export async function hasVisibleModal(page: Page): Promise<boolean> {
    return page.evaluate(() => {
        const modalSelectors = [
            '[role="dialog"]', '[class*="modal"]', '[class*="popup"]',
            '[class*="overlay"]', '.dialog', '.overlay'
        ];

        return modalSelectors.some(selector => {
            const els = document.querySelectorAll(selector);
            return Array.from(els).some(el => {
                const style = window.getComputedStyle(el);
                const rect = el.getBoundingClientRect();
                return style.display !== 'none' &&
                    style.visibility !== 'hidden' &&
                    style.opacity !== '0' &&
                    rect.width > 0 &&
                    rect.height > 0 &&
                    (rect.width > 200 || style.position === 'fixed');
            });
        });
    });
}

/**
 * Get summary of interactive elements on the page
 */
export async function getInteractiveSummary(page: Page): Promise<string> {
    return page.evaluate(() => {
        const buttons = document.querySelectorAll('button');
        const links = document.querySelectorAll('a');
        const inputs = document.querySelectorAll('input');

        return `Found: ${buttons.length} buttons, ${links.length} links, ${inputs.length} inputs`;
    });
}

/**
 * Attempt to click with exponential backoff retry
 */
export async function clickWithRetry(page: Page, selector: string, retries = 3): Promise<boolean> {
    for (let i = 0; i < retries; i++) {
        try {
            await page.click(selector);
            return true;
        } catch {
            await delay(500 * Math.pow(2, i));
        }
    }
    return false;
}

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
