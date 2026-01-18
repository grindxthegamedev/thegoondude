/**
 * AI Review Endpoints
 * Cloud Functions for AI review generation
 * Includes rate limiting and proper resource configuration
 */

import { onRequest, HttpsOptions } from 'firebase-functions/https';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { generateReview } from './writer';
import { analyzeSite } from './analyzer';
import { crawlSite } from './crawler';
import { uploadScreenshots } from './storage';
import { buildAnalysisContext } from './prompts';
import { analyzeScreenshots, buildVisionContext } from './visionAnalyzer';
import { checkRateLimit, getClientIP } from '../rateLimit';

// Initialize Firebase Admin if not already
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

// CORS headers helper
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Function config for lightweight endpoints
const lightConfig: HttpsOptions = {
    memory: '256MiB',
    timeoutSeconds: 60,
    cors: true,
};

// Function config for heavy AI/Puppeteer endpoints
const heavyConfig: HttpsOptions = {
    memory: '2GiB',
    timeoutSeconds: 540,
    cors: true,
};

/**
 * Helper to clean AI-generated content
 */
function cleanReviewContent(content: string): string {
    if (!content) return '';
    let cleaned = content;
    cleaned = cleaned.replace(/\\n/g, '\n');
    cleaned = cleaned.replace(/^```(?:json|markdown)?\n?/i, '');
    cleaned = cleaned.replace(/\n?```$/i, '');
    cleaned = cleaned.replace(/^["'`]*Rating:\s*[\d.]+\/10["'`]*,?\s*/i, '');
    cleaned = cleaned.replace(/([^\n])\s*(#{1,6}\s+)/g, '$1\n\n$2');
    cleaned = cleaned.replace(/(#{1,6}\s+[^\n]+)\n([^\n#])/g, '$1\n\n$2');
    cleaned = cleaned.replace(/\n{4,}/g, '\n\n\n');
    return cleaned.trim();
}

/**
 * Rate limit check helper - returns error response if limited
 */
async function checkAndEnforceRateLimit(
    req: any,
    res: any,
    action: 'submission' | 'review' | 'aiGeneration'
): Promise<boolean> {
    const clientIP = getClientIP(req);
    const rateCheck = await checkRateLimit(clientIP, action);

    if (!rateCheck.allowed) {
        logger.warn(`Rate limit exceeded for ${action}:`, clientIP);
        res.set(corsHeaders);
        res.set('Retry-After', Math.ceil((rateCheck.resetAt.getTime() - Date.now()) / 1000).toString());
        res.status(429).json({
            error: 'Rate limit exceeded',
            retryAfter: rateCheck.resetAt.toISOString(),
            remaining: rateCheck.remaining,
        });
        return false;
    }

    return true;
}

/**
 * Generate a review for a site (simple - just writer)
 */
export const generateSiteReview = onRequest(lightConfig, async (req, res) => {
    res.set(corsHeaders);

    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
    if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

    // Rate limit: 10 reviews per hour
    if (!await checkAndEnforceRateLimit(req, res, 'review')) return;

    try {
        const { siteId } = req.body;
        if (!siteId) { res.status(400).json({ error: 'Missing siteId' }); return; }

        const siteDoc = await db.collection('sites').doc(siteId).get();
        if (!siteDoc.exists) { res.status(404).json({ error: 'Site not found' }); return; }

        const siteData = siteDoc.data()!;
        logger.info('Generating review for:', siteData.name);

        await db.collection('sites').doc(siteId).update({
            status: 'processing',
            processingStartedAt: FieldValue.serverTimestamp(),
        });

        const review = await generateReview({
            name: siteData.name, url: siteData.url,
            category: siteData.category, description: siteData.description,
        });

        review.content = cleanReviewContent(review.content);

        await db.collection('sites').doc(siteId).update({
            review: { ...review, generatedBy: 'ai', generatedAt: FieldValue.serverTimestamp() },
            rating: review.rating,
            status: 'published',
            publishedAt: FieldValue.serverTimestamp(),
        });

        logger.info('Review generated:', siteData.name, 'Rating:', review.rating);
        res.json({ success: true, review });
    } catch (error) {
        logger.error('Review generation error:', error);
        res.status(500).json({ error: 'Failed to generate review' });
    }
});

/**
 * Full pipeline: Crawl + Analyze + Write + Publish
 * Heavy endpoint with strict rate limiting
 */
export const processFullReview = onRequest(heavyConfig, async (req, res) => {
    res.set(corsHeaders);

    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
    if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

    // Rate limit: 3 AI generations per hour (expensive operation)
    if (!await checkAndEnforceRateLimit(req, res, 'aiGeneration')) return;

    try {
        const { siteId } = req.body;
        if (!siteId) { res.status(400).json({ error: 'Missing siteId' }); return; }

        const siteDoc = await db.collection('sites').doc(siteId).get();
        if (!siteDoc.exists) { res.status(404).json({ error: 'Site not found' }); return; }

        const siteData = siteDoc.data()!;
        logger.info('Starting full pipeline for:', siteData.name);

        // Step 1: Processing
        await db.collection('sites').doc(siteId).update({
            status: 'processing',
            processingStartedAt: FieldValue.serverTimestamp(),
        });

        // Step 2: Crawl
        logger.info('Step 1/5: Crawling...');
        let crawlData = null;
        let screenshotBuffers: Buffer[] = [];
        try {
            const crawl = await crawlSite(siteData.url);
            screenshotBuffers = crawl.screenshots;
            const screenshotUrls = await uploadScreenshots(crawl.screenshots, siteId);
            crawlData = {
                screenshotUrls,
                faviconUrl: crawl.faviconUrl,
                seo: crawl.seo,
                performance: crawl.performance
            };
            logger.info('Crawl complete:', screenshotUrls.length, 'screenshots');
        } catch (crawlErr) {
            logger.error('Crawl failed (continuing):', crawlErr);
        }

        // Step 3: Vision Analysis
        logger.info('Step 2/5: Vision analysis...');
        const visionAnalysis = await analyzeScreenshots(screenshotBuffers);
        const visionContext = buildVisionContext(visionAnalysis);
        logger.info('Vision analysis complete:', visionAnalysis.layoutQuality);

        // Step 4: Text Analysis
        logger.info('Step 3/5: Text analysis...');
        const siteInfo = {
            name: siteData.name, url: siteData.url,
            category: siteData.category, description: siteData.description,
        };
        const analysis = await analyzeSite(siteInfo);

        // Step 5: Generate review (with vision context)
        logger.info('Step 4/5: Writing review...');
        const analysisContext = buildAnalysisContext(analysis);
        const fullContext = `${analysisContext}\n\n${visionContext}`;
        const review = await generateReview(siteInfo, fullContext);

        review.content = cleanReviewContent(review.content);

        // Step 6: Publish
        logger.info('Step 5/5: Publishing...');
        await db.collection('sites').doc(siteId).update({
            crawlData,
            analysis,
            visionAnalysis,
            review: { ...review, generatedBy: 'ai-full', generatedAt: FieldValue.serverTimestamp() },
            rating: review.rating,
            status: 'published',
            publishedAt: FieldValue.serverTimestamp(),
        });

        logger.info('Pipeline complete:', siteData.name, 'Rating:', review.rating);
        res.json({ success: true, crawlData, analysis, visionAnalysis, review });
    } catch (error) {
        logger.error('Full pipeline error:', error);
        res.status(500).json({ error: 'Failed to process review' });
    }
});
