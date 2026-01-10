/**
 * Crawler Decide - The "Brain"
 * Semantic analysis and intelligent decision-making
 */

import { PageState, BlockingState } from './crawlerDOM';
import * as logger from 'firebase-functions/logger';

export interface BlockerInfo {
    type: BlockingState;
    actionTexts: string[]; // Ordered by priority
}

export interface ActionDecision {
    targetText: string;
    reason: string;
    priority: 'high' | 'medium' | 'low';
}

// Text patterns for dismissing blockers (order matters - most specific first)
const AGE_GATE_DISMISS_TEXTS = [
    'I am 18 or older',
    'I am over 18',
    "I'm over 18",
    'Yes, I am 18',
    'I am 18',
    'Enter',
    'I agree',
    'Continue',
    'Accept',
];

const COOKIE_DISMISS_TEXTS = [
    'Accept all',
    'Accept cookies',
    'I accept',
    'Accept',
    'OK',
    'Got it',
    'Agree',
];

const LOGIN_SKIP_TEXTS = [
    'Close',
    'Skip',
    'Maybe later',
    'No thanks',
    'Continue as guest',
];

// Content action keywords (for finding main content)
const CONTENT_ACTION_KEYWORDS = [
    'start', 'watch', 'play', 'enter', 'view',
    'session', 'live', 'join', 'stream'
];

/**
 * Detect what type of blocker is present and how to dismiss it
 */
export function detectBlocker(pageState: PageState): BlockerInfo | null {
    const { blockingState, buttons } = pageState;

    if (blockingState === 'clear') {
        return null;
    }

    let actionTexts: string[] = [];

    switch (blockingState) {
        case 'age_gate':
            actionTexts = AGE_GATE_DISMISS_TEXTS;
            break;
        case 'cookie_banner':
            actionTexts = COOKIE_DISMISS_TEXTS;
            break;
        case 'login_wall':
            actionTexts = LOGIN_SKIP_TEXTS;
            break;
    }

    // Filter to only include texts that have a matching button
    const availableTexts = actionTexts.filter(text =>
        buttons.some(b => b.text.toLowerCase().includes(text.toLowerCase()))
    );

    if (availableTexts.length === 0 && actionTexts.length > 0) {
        // Fallback: try the default actions anyway
        availableTexts.push(...actionTexts.slice(0, 3));
    }

    logger.info(`Detected blocker: ${blockingState}, actions: ${availableTexts.join(', ')}`);

    return {
        type: blockingState,
        actionTexts: availableTexts
    };
}

/**
 * Find the best action to take to reach content
 */
export function findBestAction(pageState: PageState): ActionDecision | null {
    const { buttons, links } = pageState;

    // Priority 1: Look for prominent buttons with content keywords
    for (const btn of buttons) {
        if (!btn.isProminent) continue;
        const lowerText = btn.text.toLowerCase();

        for (const keyword of CONTENT_ACTION_KEYWORDS) {
            if (lowerText.includes(keyword)) {
                return {
                    targetText: btn.text,
                    reason: `Found prominent action button with keyword: ${keyword}`,
                    priority: 'high'
                };
            }
        }
    }

    // Priority 2: Look for any button with content keywords
    for (const btn of buttons) {
        const lowerText = btn.text.toLowerCase();
        for (const keyword of CONTENT_ACTION_KEYWORDS) {
            if (lowerText.includes(keyword)) {
                return {
                    targetText: btn.text,
                    reason: `Found action button: ${btn.text}`,
                    priority: 'medium'
                };
            }
        }
    }

    // Priority 3: Look for internal links to content
    const contentLinks = links.filter(l =>
        l.isInternal &&
        (l.href.includes('/video') || l.href.includes('/watch') ||
            l.href.includes('/session') || l.href.includes('/live'))
    );

    if (contentLinks.length > 0) {
        return {
            targetText: contentLinks[0].text,
            reason: `Found content link: ${contentLinks[0].href}`,
            priority: 'medium'
        };
    }

    return null;
}

/**
 * Determine if we've reached a content page
 */
export function isContentPage(pageState: PageState): boolean {
    // Clear indicators of content page
    if (pageState.hasVideo) {
        logger.info('Content page detected: video element found');
        return true;
    }

    if (pageState.hasCanvas && pageState.visibleText.length > 500) {
        logger.info('Content page detected: canvas with text');
        return true;
    }

    // Check URL patterns
    const url = pageState.url.toLowerCase();
    if (url.includes('/video/') || url.includes('/watch') ||
        url.includes('/session') || url.includes('/live')) {
        logger.info('Content page detected: URL pattern');
        return true;
    }

    return false;
}
