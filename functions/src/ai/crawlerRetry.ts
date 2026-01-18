/**
 * Crawler Retry - Exponential Backoff Utilities
 * Provides resilient wrappers for flaky operations
 */

import { Page } from 'puppeteer-core';
import * as logger from 'firebase-functions/logger';

/** Default retry configuration */
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_BASE_DELAY_MS = 1000;

/**
 * Execute a function with exponential backoff retries
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    options: {
        maxRetries?: number;
        baseDelay?: number;
        operationName?: string;
    } = {}
): Promise<T> {
    const {
        maxRetries = DEFAULT_MAX_RETRIES,
        baseDelay = DEFAULT_BASE_DELAY_MS,
        operationName = 'operation'
    } = options;

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err));

            if (attempt < maxRetries) {
                const delayMs = baseDelay * Math.pow(2, attempt - 1);
                logger.warn(`${operationName} failed (attempt ${attempt}/${maxRetries}), retrying in ${delayMs}ms...`);
                await delay(delayMs);
            }
        }
    }

    logger.error(`${operationName} failed after ${maxRetries} attempts`);
    throw lastError;
}

/**
 * Navigate to URL with retries
 */
export async function retryableNavigate(
    page: Page,
    url: string,
    options: { timeout?: number; maxRetries?: number } = {}
): Promise<boolean> {
    const { timeout = 20000, maxRetries = 3 } = options;

    try {
        await withRetry(
            async () => {
                await page.goto(url, { waitUntil: 'domcontentloaded', timeout });
            },
            { maxRetries, operationName: `Navigate to ${url}` }
        );
        return true;
    } catch {
        return false;
    }
}

/**
 * Click element with retries
 */
export async function retryableClick(
    page: Page,
    selector: string,
    options: { maxRetries?: number } = {}
): Promise<boolean> {
    const { maxRetries = 2 } = options;

    try {
        await withRetry(
            async () => {
                await page.click(selector);
            },
            { maxRetries, baseDelay: 500, operationName: `Click ${selector}` }
        );
        return true;
    } catch {
        return false;
    }
}

/**
 * Wait for selector with retries
 */
export async function retryableWaitFor(
    page: Page,
    selector: string,
    options: { timeout?: number; maxRetries?: number } = {}
): Promise<boolean> {
    const { timeout = 5000, maxRetries = 2 } = options;

    try {
        await withRetry(
            async () => {
                await page.waitForSelector(selector, { timeout });
            },
            { maxRetries, operationName: `Wait for ${selector}` }
        );
        return true;
    } catch {
        return false;
    }
}

/** Simple delay helper */
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
