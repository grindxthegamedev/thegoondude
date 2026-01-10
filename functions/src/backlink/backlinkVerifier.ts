/**
 * Backlink Verifier
 * Crawls target site to detect backlinks to TheGoonDude
 */

import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import * as logger from 'firebase-functions/logger';

const TARGET_DOMAIN = 'thegoondude.com';

export interface BacklinkResult {
    found: boolean;
    backlinkUrl?: string;
    pageUrl?: string;
    error?: string;
}

/**
 * Launch headless browser
 */
async function launchBrowser() {
    return puppeteer.launch({
        args: [
            ...chromium.args,
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
        ],
        defaultViewport: { width: 1280, height: 800 },
        executablePath: await chromium.executablePath(),
        headless: true,
    });
}

/**
 * Search page for backlinks to target domain
 */
async function findBacklinkOnPage(pageUrl: string): Promise<BacklinkResult> {
    const browser = await launchBrowser();

    try {
        const page = await browser.newPage();
        page.setDefaultNavigationTimeout(20000);

        await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });

        // Search for anchor tags linking to our domain
        const backlink = await page.evaluate((domain) => {
            const anchors = document.querySelectorAll('a[href]');

            for (const anchor of anchors) {
                const href = (anchor as HTMLAnchorElement).href.toLowerCase();

                if (href.includes(domain)) {
                    // Check visibility
                    const style = window.getComputedStyle(anchor);
                    const rect = anchor.getBoundingClientRect();

                    const isVisible = style.display !== 'none' &&
                        style.visibility !== 'hidden' &&
                        rect.width > 0 && rect.height > 0;

                    if (isVisible) {
                        return href;
                    }
                }
            }
            return null;
        }, TARGET_DOMAIN);

        if (backlink) {
            logger.info(`Backlink found: ${backlink} on ${pageUrl}`);
            return { found: true, backlinkUrl: backlink, pageUrl };
        }

        return { found: false, pageUrl };
    } catch (err) {
        logger.warn(`Backlink check failed for ${pageUrl}:`, err);
        return { found: false, error: 'Failed to load page' };
    } finally {
        await browser.close();
    }
}

/**
 * Verify backlink exists on target site
 * Checks homepage and common pages
 */
export async function verifyBacklink(siteUrl: string): Promise<BacklinkResult> {
    logger.info(`Checking backlink for: ${siteUrl}`);

    // Normalize URL
    let baseUrl = siteUrl.trim();
    if (!baseUrl.startsWith('http')) {
        baseUrl = 'https://' + baseUrl;
    }

    // Try homepage first
    const homepageResult = await findBacklinkOnPage(baseUrl);
    if (homepageResult.found) {
        return homepageResult;
    }

    // Try common pages where backlinks might be placed
    const commonPaths = ['/links', '/partners', '/friends', '/about'];

    for (const path of commonPaths) {
        try {
            const result = await findBacklinkOnPage(baseUrl + path);
            if (result.found) {
                return result;
            }
        } catch {
            // Page doesn't exist, continue
        }
    }

    return { found: false, error: 'Backlink not detected on your site' };
}
