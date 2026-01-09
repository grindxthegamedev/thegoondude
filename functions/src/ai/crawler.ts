/**
 * Crawler Agent
 * Uses Puppeteer to capture multiple screenshots and extract SEO data
 */

import puppeteer, { Page } from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import * as logger from 'firebase-functions/logger';

export interface SEOData {
    title: string;
    description: string;
    keywords: string[];
    h1: string;
    canonical: string;
}

export interface PerformanceData {
    loadTimeMs: number;
    pageSize: number;
}

export interface CrawlResult {
    screenshots: Buffer[];
    seo: SEOData;
    performance: PerformanceData;
    faviconUrl: string;
}

const MAX_SCREENSHOTS = 5;
const SCREENSHOT_DELAY_MS = 1500;

/**
 * Validate URL is safe to crawl
 */
function isValidUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
        return false;
    }
}

/**
 * Extract internal links from page for navigation
 */
async function getInternalLinks(page: Page, baseUrl: string): Promise<string[]> {
    const baseHost = new URL(baseUrl).host;

    const links = await page.evaluate((host: string) => {
        const anchors = Array.from(document.querySelectorAll('a[href]'));
        return anchors
            .map(a => (a as HTMLAnchorElement).href)
            .filter(href => {
                try {
                    const url = new URL(href);
                    return url.host === host && !href.includes('#');
                } catch {
                    return false;
                }
            });
    }, baseHost);

    // Deduplicate and shuffle for variety
    const unique = [...new Set(links)];
    return unique.sort(() => Math.random() - 0.5).slice(0, 10);
}

/**
 * Capture screenshot with error handling
 */
async function captureScreenshot(page: Page): Promise<Buffer | null> {
    try {
        return await page.screenshot({ type: 'png', fullPage: false }) as Buffer;
    } catch (err) {
        logger.warn('Screenshot capture failed:', err);
        return null;
    }
}

/**
 * Crawl a website and extract data with multiple screenshots
 */
export async function crawlSite(url: string): Promise<CrawlResult> {
    if (!isValidUrl(url)) {
        throw new Error('Invalid URL');
    }

    logger.info('Starting crawl:', url);
    const startTime = Date.now();

    const browser = await puppeteer.launch({
        args: [
            ...chromium.args,
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu'
        ],
        defaultViewport: { width: 1280, height: 800 },
        executablePath: await chromium.executablePath(),
        headless: true,
    });

    try {
        const page = await browser.newPage();
        page.setDefaultNavigationTimeout(45000);

        logger.info('Navigating to homepage...');
        const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
        await new Promise(resolve => setTimeout(resolve, 2000));

        const loadTimeMs = Date.now() - startTime;
        logger.info('Page loaded in', loadTimeMs, 'ms');

        // Extract SEO and favicon from homepage
        const { seo, faviconUrl } = await page.evaluate(() => {
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

        logger.info('SEO extracted:', seo.title);

        // Capture screenshots from multiple pages
        const screenshots: Buffer[] = [];

        // 1. Homepage screenshot
        logger.info('Capturing homepage screenshot...');
        const homeShot = await captureScreenshot(page);
        if (homeShot) screenshots.push(homeShot);

        // 2. Navigate to internal pages for more screenshots
        const internalLinks = await getInternalLinks(page, url);
        logger.info(`Found ${internalLinks.length} internal links to explore`);

        for (const link of internalLinks) {
            if (screenshots.length >= MAX_SCREENSHOTS) break;

            try {
                logger.info(`Navigating to: ${link}`);
                await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 20000 });
                await new Promise(resolve => setTimeout(resolve, SCREENSHOT_DELAY_MS));

                const shot = await captureScreenshot(page);
                if (shot) {
                    screenshots.push(shot);
                    logger.info(`Screenshot ${screenshots.length}/${MAX_SCREENSHOTS} captured`);
                }
            } catch (navErr) {
                logger.warn(`Failed to navigate to ${link}:`, navErr);
            }
        }

        logger.info(`Total screenshots captured: ${screenshots.length}`);

        const pageSize = parseInt(response?.headers()['content-length'] || '0', 10);

        return {
            screenshots,
            seo,
            performance: { loadTimeMs, pageSize },
            faviconUrl,
        };
    } finally {
        await browser.close();
        logger.info('Browser closed');
    }
}
