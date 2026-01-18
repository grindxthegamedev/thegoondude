/**
 * Crawler Smart Functions - Barrel Export
 * Re-exports from modular files for backward compatibility
 * 
 * This file was split into:
 * - crawlerSmartDOM.ts: DOM element finding, clicking, detection
 * - crawlerSmartNav.ts: Scrolling, popup dismissal, SEO extraction
 */

// DOM utilities
export {
    waitFor,
    findByText,
    clickAndVerify,
    hasVisibleModal,
    getInteractiveSummary,
    clickWithRetry,
    findActionButtons,
    isContentPage
} from './crawlerSmartDOM';

// Navigation utilities
export {
    smartScroll,
    dismissPopups,
    extractSEO
} from './crawlerSmartNav';
