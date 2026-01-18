/**
 * Crawler Smart DOM
 * DOM element finding, clicking, and detection utilities
 */

import { Page, ElementHandle } from 'puppeteer-core';
import * as logger from 'firebase-functions/logger';

/** Wait for a specific time */
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
 * Identify primary "Action" buttons (Start, Enter, Watch)
 */
export async function findActionButtons(page: Page): Promise<ElementHandle[]> {
    return page.evaluateHandle(() => {
        const keywords = ['start', 'enter', 'watch', 'join', 'play', 'live', 'session', 'interact'];
        const buttons = Array.from(document.querySelectorAll('button, a[class*="btn"], a[class*="button"]'));

        return buttons.filter(el => {
            const text = el.textContent?.toLowerCase().trim() || '';
            const rect = el.getBoundingClientRect();
            // Heuristic: visible, clickable size, contains action keyword
            return rect.width > 20 && rect.height > 20 &&
                window.getComputedStyle(el).display !== 'none' &&
                keywords.some(k => text.includes(k));
        });
    }).then((handle: any) => {
        const properties = handle.getProperties();
        const result: ElementHandle[] = [];
        for (const prop of properties.values()) {
            const element = prop.asElement();
            if (element) result.push(element);
        }
        return result;
    });
}

/**
 * Heuristic to detect if we are on a "Content" page (Player, Active Session)
 */
export async function isContentPage(page: Page): Promise<boolean> {
    return page.evaluate(() => {
        // Look for typical content indicators
        const hasVideo = !!document.querySelector('video');
        const hasCanvas = !!document.querySelector('canvas'); // Games/Interactive
        const hasChat = !!document.querySelector('[class*="chat"]');
        const hasPlayer = !!document.querySelector('[class*="player"]');

        return hasVideo || (hasCanvas && window.innerWidth > 800) || (hasChat && hasPlayer);
    });
}
