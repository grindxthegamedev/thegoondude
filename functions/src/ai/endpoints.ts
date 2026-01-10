/**
 * AI Review Endpoints
 * Cloud Functions for AI review generation
 */

import { onRequest } from 'firebase-functions/https';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { generateReview } from './writer';
import { analyzeSite } from './analyzer';
import { crawlSite } from './crawler';
import { uploadScreenshots } from './storage';
import { buildAnalysisContext } from './prompts';
import { analyzeScreenshots, buildVisionContext } from './visionAnalyzer';

// Initialize Firebase Admin if not already
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

/**
 * Generate a review for a site (simple - just writer)
 */
/**
 * Helper to clean AI-generated content
 * Ensures proper markdown formatting with headers on their own lines
 */
function cleanReviewContent(content: string): string {
    if (!content) return '';
    let cleaned = content;

    // Replace escaped newlines with actual newlines
    cleaned = cleaned.replace(/\\n/g, '\n');

    // Remove markdown code blocks
    cleaned = cleaned.replace(/^```(?:json|markdown)?\n?/i, '');
    cleaned = cleaned.replace(/\n?```$/i, '');

    // Remove JSON keys/artifacts that might leak into the content field
    cleaned = cleaned.replace(/^["'`]*Rating:\s*[\d.]+\/10["'`]*,?\s*/i, '');
    cleaned = cleaned.replace(/["'`]*,?\s*["'`]?excerpt["'`]?:\s*["'`][^"'`]*["'`],?/gi, '');
    cleaned = cleaned.replace(/["'`]*,?\s*["'`]?pros["'`]?:\s*\[[^\]]*\],?/gi, '');
    cleaned = cleaned.replace(/["'`]*,?\s*["'`]?cons["'`]?:\s*\[[^\]]*\],?/gi, '');
    cleaned = cleaned.replace(/["'`]*,?\s*["'`]?title["'`]?:\s*["'`][^"'`]*["'`],?/gi, '');

    // CRITICAL: Ensure headers are on their own lines with blank lines before
    cleaned = cleaned.replace(/([^\n])\s*(#{1,6}\s+)/g, '$1\n\n$2');

    // Ensure blank line after header before content
    cleaned = cleaned.replace(/(#{1,6}\s+[^\n]+)\n([^\n#])/g, '$1\n\n$2');

    // Clean up excessive line breaks (more than 3 in a row)
    cleaned = cleaned.replace(/\n{4,}/g, '\n\n\n');

    return cleaned.trim();
}

export const generateSiteReview = onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
    if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

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

        // Clean content before saving
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
 */
export const processFullReview = onRequest(
    { timeoutSeconds: 300, memory: '2GiB' },
    async (req, res) => {
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'POST');
        res.set('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
        if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

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

            // Clean content before saving
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
    }
);
