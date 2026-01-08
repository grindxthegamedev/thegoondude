/**
 * Crawler Agent
 * Uses Puppeteer to capture screenshots and extract SEO data
 */

import puppeteer from 'puppeteer-core';
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
    screenshot: Buffer;
    seo: SEOData;
    performance: PerformanceData;
}

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
 * Crawl a website and extract data
 */
export async function crawlSite(url: string): Promise<CrawlResult> {
    if (!isValidUrl(url)) {
        throw new Error('Invalid URL');
    }

    logger.info('Starting crawl:', url);
    const startTime = Date.now();

    const browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: { width: 1280, height: 800 },
        executablePath: await chromium.executablePath(),
        headless: true,
    });

    try {
        const page = await browser.newPage();

        // Set timeout
        page.setDefaultNavigationTimeout(30000);

        logger.info('Navigating to page...');
        const response = await page.goto(url, { waitUntil: 'networkidle2' });
        const loadTimeMs = Date.now() - startTime;

        logger.info('Page loaded in', loadTimeMs, 'ms');

        // Extract SEO data
        logger.info('Extracting SEO data...');
        const seo = await page.evaluate(() => {
            const getMeta = (name: string): string => {
                const el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
                return el?.getAttribute('content') || '';
            };

            return {
                title: document.title || '',
                description: getMeta('description') || getMeta('og:description'),
                keywords: (getMeta('keywords') || '').split(',').map(k => k.trim()).filter(Boolean),
                h1: document.querySelector('h1')?.textContent?.trim() || '',
                canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') || '',
            };
        });

        logger.info('SEO extracted:', seo.title);

        // Capture screenshot
        logger.info('Capturing screenshot...');
        const screenshot = await page.screenshot({
            type: 'png',
            fullPage: false,
        }) as Buffer;

        logger.info('Screenshot captured:', screenshot.length, 'bytes');

        // Get page size from response
        const pageSize = parseInt(response?.headers()['content-length'] || '0', 10);

        return {
            screenshot,
            seo,
            performance: {
                loadTimeMs,
                pageSize,
            },
        };
    } finally {
        await browser.close();
        logger.info('Browser closed');
    }
}
