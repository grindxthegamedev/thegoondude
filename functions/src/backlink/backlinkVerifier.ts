/**
 * Backlink Verifier
 * Crawls target site to detect backlinks to TheGoonDude
 * Uses hybrid approach: fast HTTP fetch first, Puppeteer fallback
 */

import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import * as logger from 'firebase-functions/logger';

const TARGET_DOMAIN = 'thegoondude.com';
const FETCH_TIMEOUT = 10000;

export interface BacklinkResult {
    found: boolean;
    backlinkUrl?: string;
    pageUrl?: string;
    error?: string;
    method?: 'fetch' | 'puppeteer';
}

/** Check if running locally */
function isLocalDev(): boolean {
    return process.env.FUNCTIONS_EMULATOR === 'true' ||
        process.env.NODE_ENV === 'development';
}

/** Get local Chrome path */
function getLocalChromePath(): string | undefined {
    const paths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/usr/bin/google-chrome',
    ];
    const fs = require('fs');
    return paths.find(p => p && fs.existsSync(p));
}

/**
 * Fast HTTP-based backlink check (no browser needed)
 */
async function fetchCheck(url: string): Promise<BacklinkResult | null> {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

        const response = await fetch(url, {
            signal: controller.signal,
            headers: { 'User-Agent': 'Mozilla/5.0 TheGoonDude-BacklinkBot/1.0' },
        });
        clearTimeout(timeout);

        if (!response.ok) return null;

        const html = await response.text();

        // Quick check if domain appears anywhere
        if (!html.toLowerCase().includes(TARGET_DOMAIN)) {
            return { found: false, pageUrl: url, method: 'fetch' };
        }

        // Extract actual href
        const regex = new RegExp(`href=["']([^"']*${TARGET_DOMAIN}[^"']*)["']`, 'i');
        const match = html.match(regex);

        if (match) {
            logger.info(`Backlink found via fetch: ${match[1]}`);
            return { found: true, backlinkUrl: match[1], pageUrl: url, method: 'fetch' };
        }

        // Domain found in text but not as link - might be JS-rendered
        return null; // Fall back to Puppeteer
    } catch {
        return null; // Fall back to Puppeteer
    }
}

/**
 * Puppeteer-based check for JS-rendered content
 */
async function puppeteerCheck(url: string): Promise<BacklinkResult> {
    const isLocal = isLocalDev();
    const executablePath = isLocal ? getLocalChromePath() : await chromium.executablePath();

    if (!executablePath) {
        return { found: false, error: 'Chrome not available', method: 'puppeteer' };
    }

    const browser = await puppeteer.launch({
        args: isLocal ? ['--no-sandbox'] : [...chromium.args, '--no-sandbox'],
        defaultViewport: { width: 1280, height: 800 },
        executablePath,
        headless: true,
    });

    try {
        const page = await browser.newPage();
        page.setDefaultNavigationTimeout(15000);
        await page.goto(url, { waitUntil: 'domcontentloaded' });

        const backlink = await page.evaluate((domain) => {
            const anchors = document.querySelectorAll('a[href]');
            for (const anchor of anchors) {
                const href = (anchor as HTMLAnchorElement).href.toLowerCase();
                if (href.includes(domain)) {
                    const style = window.getComputedStyle(anchor);
                    const rect = anchor.getBoundingClientRect();
                    if (style.display !== 'none' && rect.width > 0) {
                        return href;
                    }
                }
            }
            return null;
        }, TARGET_DOMAIN);

        return backlink
            ? { found: true, backlinkUrl: backlink, pageUrl: url, method: 'puppeteer' }
            : { found: false, pageUrl: url, method: 'puppeteer' };
    } finally {
        await browser.close();
    }
}

/**
 * Verify backlink exists - hybrid approach
 */
export async function verifyBacklink(siteUrl: string): Promise<BacklinkResult> {
    logger.info(`Checking backlink for: ${siteUrl}`);

    let baseUrl = siteUrl.trim();
    if (!baseUrl.startsWith('http')) baseUrl = 'https://' + baseUrl;

    const pagesToCheck = [baseUrl, baseUrl + '/links', baseUrl + '/partners'];

    for (const pageUrl of pagesToCheck) {
        // Try fast fetch first
        const fetchResult = await fetchCheck(pageUrl);
        if (fetchResult?.found) return fetchResult;

        // If fetch returned definitive "not found", skip Puppeteer for this page
        if (fetchResult && !fetchResult.found) continue;

        // Fall back to Puppeteer for JS-rendered pages
        try {
            const puppeteerResult = await puppeteerCheck(pageUrl);
            if (puppeteerResult.found) return puppeteerResult;
        } catch (err) {
            logger.warn(`Puppeteer check failed for ${pageUrl}`, err);
        }
    }

    return { found: false, error: 'Backlink not detected' };
}
