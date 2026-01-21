/**
 * Auto-Review Scheduler
 * Automatically reviews pending sites when deployed
 * Stops after 500 sites are processed
 */

import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';

if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

const MAX_SITES = 500;
const DELAY_BETWEEN_SITES_MS = 5000;
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2000;

/** Sleep helper */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/** Calculate exponential backoff delay */
function getBackoffDelay(attempt: number): number {
    return Math.min(BASE_DELAY_MS * Math.pow(2, attempt), 60000);
}

/** Check if job should stop */
async function shouldStop(jobId: string): Promise<boolean> {
    const doc = await db.collection('autoReviewJobs').doc(jobId).get();
    const data = doc.data();
    return data?.status === 'stopped' || (data?.successCount || 0) >= MAX_SITES;
}

/** Update job progress */
async function updateProgress(
    jobId: string,
    updates: Record<string, unknown>
): Promise<void> {
    await db.collection('autoReviewJobs').doc(jobId).update({
        ...updates,
        lastUpdatedAt: FieldValue.serverTimestamp(),
    });
}

/**
 * Process a single site with full AI pipeline
 */
async function processSiteWithAI(
    siteId: string,
    siteName: string,
    siteUrl: string,
    jobId: string
): Promise<{ success: boolean; error?: string }> {
    const { crawlSite } = await import('../ai/crawler.js');
    const { uploadScreenshots } = await import('../ai/storage.js');
    const { analyzeScreenshots, buildVisionContext } = await import('../ai/visionAnalyzer.js');
    const { analyzeSite } = await import('../ai/analyzer.js');
    const { generateReview } = await import('../ai/writer.js');
    const { buildAnalysisContext } = await import('../ai/prompts.js');

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            logger.info(`Processing ${siteName} (attempt ${attempt + 1}/${MAX_RETRIES})`);

            if (await shouldStop(jobId)) {
                return { success: false, error: 'Job stopped or limit reached' };
            }

            // Mark as processing
            await db.collection('sites').doc(siteId).update({
                status: 'processing',
                processingStartedAt: FieldValue.serverTimestamp(),
            });

            // Crawl
            let crawlData = null;
            let screenshotBuffers: Buffer[] = [];
            const crawl = await crawlSite(siteUrl);
            screenshotBuffers = crawl.screenshots;
            const screenshotUrls = await uploadScreenshots(crawl.screenshots, siteId);
            crawlData = {
                screenshotUrls,
                faviconUrl: crawl.faviconUrl,
                seo: crawl.seo,
                performance: crawl.performance
            };

            // Vision Analysis
            const visionAnalysis = await analyzeScreenshots(screenshotBuffers);
            const visionContext = buildVisionContext(visionAnalysis);

            // Text Analysis
            const siteInfo = { name: siteName, url: siteUrl, category: '', description: '' };
            const analysis = await analyzeSite(siteInfo);

            // Generate Review with AI tagline
            const analysisContext = buildAnalysisContext(analysis);
            const fullContext = `${analysisContext}\n\n${visionContext}`;
            const review = await generateReview(siteInfo, fullContext);

            // Clean content
            let content = review.content || '';
            content = content.replace(/\\n/g, '\n').replace(/```json\n?/gi, '').replace(/```$/i, '').trim();
            review.content = content;

            // Extract AI tagline from review for description
            const aiDescription = extractAITagline(content);

            // Publish
            await db.collection('sites').doc(siteId).update({
                crawlData,
                analysis,
                visionAnalysis,
                description: aiDescription,
                review: { ...review, generatedBy: 'auto', generatedAt: FieldValue.serverTimestamp() },
                rating: review.rating,
                status: 'published',
                publishedAt: FieldValue.serverTimestamp(),
            });

            logger.info(`Successfully processed ${siteName}, rating: ${review.rating}`);
            return { success: true };

        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            logger.error(`Error processing ${siteName} (attempt ${attempt + 1}):`, errorMsg);

            if (attempt < MAX_RETRIES - 1) {
                const delay = getBackoffDelay(attempt);
                logger.info(`Retrying in ${delay}ms...`);
                await sleep(delay);
            } else {
                return { success: false, error: errorMsg };
            }
        }
    }

    return { success: false, error: 'Max retries exceeded' };
}

/**
 * Extract a tagline from review content (first meaningful sentence)
 */
function extractAITagline(content: string): string {
    if (!content) return '';

    const lines = content.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .filter(line => !line.startsWith('#'))
        .filter(line => !line.startsWith('*'))
        .filter(line => !line.startsWith('-'))
        .filter(line => line.length > 30);

    if (lines.length === 0) return '';

    let tagline = lines[0];
    if (tagline.length > 150) {
        tagline = tagline.substring(0, 147) + '...';
    }

    return tagline;
}

/**
 * Main auto-review execution
 */
export async function runAutoReview(): Promise<{
    success: boolean;
    processedCount: number;
    successCount: number;
    errorCount: number;
}> {
    logger.info('Starting auto-review scheduler...');

    // Create job record
    const jobRef = await db.collection('autoReviewJobs').add({
        status: 'running',
        processedCount: 0,
        successCount: 0,
        errorCount: 0,
        maxSites: MAX_SITES,
        startedAt: FieldValue.serverTimestamp(),
        lastUpdatedAt: FieldValue.serverTimestamp(),
    });

    const jobId = jobRef.id;
    let successCount = 0;
    let errorCount = 0;
    let processedCount = 0;

    try {
        // Get pending sites
        const sitesSnapshot = await db.collection('sites')
            .where('status', '==', 'pending')
            .orderBy('submittedAt', 'asc')
            .limit(MAX_SITES)
            .get();

        const sites = sitesSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        logger.info(`Found ${sites.length} pending sites to auto-review`);

        for (const site of sites as Array<{ id: string; name: string; url: string }>) {
            // Check stop condition
            if (successCount >= MAX_SITES || await shouldStop(jobId)) {
                logger.info(`Stopping: ${successCount} sites processed`);
                break;
            }

            // Process site
            const result = await processSiteWithAI(site.id, site.name, site.url, jobId);
            processedCount++;

            if (result.success) {
                successCount++;
            } else {
                errorCount++;
            }

            // Update progress
            await updateProgress(jobId, { processedCount, successCount, errorCount });

            // Delay between sites
            if (successCount < MAX_SITES) {
                await sleep(DELAY_BETWEEN_SITES_MS);
            }
        }

        // Mark complete
        await updateProgress(jobId, {
            status: 'completed',
            completedAt: FieldValue.serverTimestamp(),
        });

        logger.info(`Auto-review complete: ${successCount} success, ${errorCount} errors`);

    } catch (err) {
        logger.error('Auto-review failed:', err);
        await updateProgress(jobId, { status: 'failed' });
    }

    return { success: true, processedCount, successCount, errorCount };
}
