/**
 * Discovery Service
 * Automatically finds top adult sites from directories
 */

import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';

if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

// Mapping our categories to PornDude directory paths
const CATEGORY_MAP: Record<string, string> = {
    'tubes': 'best-porn-tube-sites',
    'hentai': 'best-hentai-porn-tube-sites',
    'cams': 'best-porn-webcam-sites',
    'amateur': 'best-amateur-homemade-porn-sites',
    'premium': 'best-hd-porn-sites',
    'interactive': 'best-interactive-sex-games-sites',
    'vr': 'best-vr-porn-sites',
    'onlyfans': 'best-onlyfans-alternatives',
    'dating': 'best-adult-dating-sites',
    'niche': 'best-fetish-porn-sites',
    'free': 'best-fully-free-porn-sites',
    'studio': 'best-classic-porn-studios',
};

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
        '/usr/bin/google-chrome',
    ];
    const fs = require('fs');
    return paths.find(p => p && fs.existsSync(p));
}

/**
 * Discover sites for a specific category
 */
async function discoverForCategory(category: string): Promise<Array<{ name: string, url: string }>> {
    const path = CATEGORY_MAP[category];
    if (!path) return [];

    const url = `https://theporndude.com/${path}`;
    logger.info(`Discovering ${category} sites from: ${url}`);

    const isLocal = isLocalDev();
    const browser = await puppeteer.launch({
        args: isLocal ? ['--no-sandbox'] : [...chromium.args, '--no-sandbox'],
        executablePath: isLocal ? getLocalChromePath() : await chromium.executablePath(),
        headless: true,
    });

    try {
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // Extract links from the directory list
        // On PornDude, sites are typically in .site-link or similar
        const sites = await page.evaluate(() => {
            const results: Array<{ name: string, url: string }> = [];
            // Common selectors for PornDude list items
            const links = document.querySelectorAll('.site-link, .link-item, .site-item a');

            links.forEach(el => {
                const anchor = el as HTMLAnchorElement;
                const name = anchor.innerText?.trim() || anchor.title?.trim();
                let href = anchor.href;

                // Basic cleaning and filtering
                if (name && href && href.startsWith('http') && !href.includes('theporndude')) {
                    // Try to extract clean domain
                    try {
                        const urlObj = new URL(href);
                        results.push({ name, url: urlObj.origin });
                    } catch {
                        results.push({ name, url: href });
                    }
                }
            });
            return results;
        });

        logger.info(`Found ${sites.length} potential sites for ${category}`);
        return sites;
    } catch (err) {
        logger.error(`Discovery failed for ${category}:`, err);
        return [];
    } finally {
        await browser.close();
    }
}

/**
 * Runs discovery across all categories and seeds the database
 */
export async function runAutoDiscovery(limitPerCategory: number = 100): Promise<number> {
    let totalAdded = 0;
    const categories = Object.keys(CATEGORY_MAP);

    for (const category of categories) {
        const discovered = await discoverForCategory(category);
        const sites = discovered.slice(0, limitPerCategory);

        for (const site of sites) {
            const slug = site.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            if (!slug) continue;

            const docRef = db.collection('sites').doc(slug);
            const doc = await docRef.get();

            if (!doc.exists) {
                await docRef.set({
                    name: site.name,
                    url: site.url,
                    slug: slug,
                    description: '', // Will be filled by AI
                    category: category,
                    submitterEmail: 'auto-discovery@thegoondude.com',
                    submittedAt: admin.firestore.FieldValue.serverTimestamp(),
                    status: 'pending',
                    tags: [category, 'auto-discovery'],
                    votes: 0,
                    rating: null,
                });
                totalAdded++;
            }
        }
    }

    logger.info(`Auto-discovery complete. Added ${totalAdded} new sites.`);
    return totalAdded;
}
