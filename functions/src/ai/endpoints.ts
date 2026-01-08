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
import { uploadScreenshot } from './storage';
import { buildAnalysisContext } from './prompts';

// Initialize Firebase Admin if not already
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

/**
 * Generate a review for a site (simple - just writer)
 */
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
    { timeoutSeconds: 120, memory: '1GiB' },
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
            logger.info('Step 1/4: Crawling...');
            let crawlData = null;
            try {
                const crawl = await crawlSite(siteData.url);
                const screenshotUrl = await uploadScreenshot(crawl.screenshot, siteId);
                crawlData = { screenshotUrl, seo: crawl.seo, performance: crawl.performance };
                logger.info('Crawl complete:', screenshotUrl);
            } catch (crawlErr) {
                logger.error('Crawl failed (continuing):', crawlErr);
            }

            // Step 3: Analyze
            logger.info('Step 2/4: Analyzing...');
            const siteInfo = {
                name: siteData.name, url: siteData.url,
                category: siteData.category, description: siteData.description,
            };
            const analysis = await analyzeSite(siteInfo);

            // Step 4: Generate review
            logger.info('Step 3/4: Writing review...');
            const analysisContext = buildAnalysisContext(analysis);
            const review = await generateReview(siteInfo, analysisContext);

            // Step 5: Publish
            logger.info('Step 4/4: Publishing...');
            await db.collection('sites').doc(siteId).update({
                crawlData,
                analysis,
                review: { ...review, generatedBy: 'ai-full', generatedAt: FieldValue.serverTimestamp() },
                rating: review.rating,
                status: 'published',
                publishedAt: FieldValue.serverTimestamp(),
            });

            logger.info('Pipeline complete:', siteData.name, 'Rating:', review.rating);
            res.json({ success: true, crawlData, analysis, review });
        } catch (error) {
            logger.error('Full pipeline error:', error);
            res.status(500).json({ error: 'Failed to process review' });
        }
    }
);
