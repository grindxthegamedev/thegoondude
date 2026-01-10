/**
 * Crawler DOM - The "Eyes"
 * Extracts readable, semantic page state for decision-making
 */

import { Page } from 'puppeteer-core';

export interface ButtonInfo {
    text: string;
    isProminent: boolean;
    selector: string;
}

export interface LinkInfo {
    text: string;
    href: string;
    isInternal: boolean;
}

export type BlockingState = 'age_gate' | 'login_wall' | 'cookie_banner' | 'clear';

export interface PageState {
    url: string;
    title: string;
    visibleText: string;
    buttons: ButtonInfo[];
    links: LinkInfo[];
    blockingState: BlockingState;
    hasVideo: boolean;
    hasCanvas: boolean;
}

// Keywords that indicate different blocking states
const AGE_GATE_KEYWORDS = [
    'adult website', 'age verification', '18 years',
    'over 18', 'adult content', 'sexually explicit',
    'mature content', 'this is an adult'
];

const LOGIN_WALL_KEYWORDS = [
    'please sign in', 'log in to continue', 'create an account',
    'sign up to access', 'members only'
];

const COOKIE_KEYWORDS = [
    'cookie', 'gdpr', 'privacy policy', 'we use cookies'
];

/**
 * Extract readable page state for semantic analysis
 */
export async function getPageState(page: Page): Promise<PageState> {
    return page.evaluate((ageKeywords, loginKeywords, cookieKeywords) => {
        const url = window.location.href;
        const title = document.title;

        // Get visible text from viewport (first 3000 chars for efficiency)
        const visibleText = document.body.innerText.slice(0, 3000).toLowerCase();

        // Extract buttons with semantic info
        const buttonEls = document.querySelectorAll('button, a[class*="btn"], [role="button"]');
        const buttons: ButtonInfo[] = Array.from(buttonEls).map((el, i) => {
            const rect = el.getBoundingClientRect();
            const style = window.getComputedStyle(el);
            const text = el.textContent?.trim().slice(0, 100) || '';

            return {
                text,
                isProminent: rect.width > 100 && rect.height > 30 && style.display !== 'none',
                selector: `button:nth-of-type(${i + 1})` // Generic fallback
            };
        }).filter(b => b.text.length > 0);

        // Extract links
        const linkEls = document.querySelectorAll('a[href]');
        const currentHost = window.location.hostname;
        const links: LinkInfo[] = Array.from(linkEls).slice(0, 50).map(el => {
            const href = (el as HTMLAnchorElement).href;
            const text = el.textContent?.trim().slice(0, 100) || '';
            let isInternal = false;
            try {
                isInternal = new URL(href).hostname === currentHost;
            } catch { /* external or invalid */ }
            return { text, href, isInternal };
        }).filter(l => l.text.length > 0);

        // Detect blocking state - only if there's an ACTUAL overlay/modal blocking the page
        let blockingState: BlockingState = 'clear';

        // Check if there's a fixed/sticky overlay that might be blocking
        const hasBlockingOverlay = Array.from(document.querySelectorAll('[class*="modal"], [class*="overlay"], [class*="popup"], [class*="banner"], [role="dialog"]'))
            .some(el => {
                const style = window.getComputedStyle(el);
                const rect = el.getBoundingClientRect();
                // Must be visible, fixed/sticky, and covering significant screen area
                return (style.position === 'fixed' || style.position === 'sticky' || style.position === 'absolute') &&
                    style.display !== 'none' &&
                    rect.width > 200 && rect.height > 100;
            });

        // Only check for blockers if there's actually an overlay
        if (hasBlockingOverlay) {
            if (ageKeywords.some((k: string) => visibleText.includes(k))) {
                blockingState = 'age_gate';
            } else if (cookieKeywords.some((k: string) => visibleText.includes(k))) {
                blockingState = 'cookie_banner';
            } else if (loginKeywords.some((k: string) => visibleText.includes(k))) {
                blockingState = 'login_wall';
            }
        }

        // Content indicators
        const hasVideo = !!document.querySelector('video');
        const hasCanvas = !!document.querySelector('canvas');

        return {
            url, title, visibleText, buttons, links,
            blockingState, hasVideo, hasCanvas
        };
    }, AGE_GATE_KEYWORDS, LOGIN_WALL_KEYWORDS, COOKIE_KEYWORDS) as Promise<PageState>;
}

/**
 * Find element by visible text (semantic matching)
 */
export async function findElementByText(page: Page, searchText: string): Promise<boolean> {
    return page.evaluate((text) => {
        const lower = text.toLowerCase();
        const allElements = document.querySelectorAll('button, a, [role="button"]');

        for (const el of allElements) {
            const elText = el.textContent?.toLowerCase().trim() || '';
            if (elText.includes(lower)) {
                const rect = (el as HTMLElement).getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    (el as HTMLElement).click();
                    return true;
                }
            }
        }
        return false;
    }, searchText);
}

/**
 * Get all clickable elements with their text content
 */
export async function getClickableElements(page: Page): Promise<string[]> {
    return page.evaluate(() => {
        const clickable = document.querySelectorAll('button, a, [role="button"], [onclick]');
        return Array.from(clickable)
            .map(el => el.textContent?.trim().slice(0, 50) || '')
            .filter(t => t.length > 2);
    });
}
