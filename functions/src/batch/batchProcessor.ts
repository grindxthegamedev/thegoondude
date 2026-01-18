/**
 * Batch Review Processor
 * Processes multiple sites with exponential backoff and error handling
 */

import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';

// Initialize if needed
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

export interface BatchJob {
    status: 'running' | 'stopped' | 'completed' | 'failed';
    totalSites: number;
    processedCount: number;
    successCount: number;
    errorCount: number;
    currentSiteId: string | null;
    currentSiteName: string | null;
    skipList: string[];
    startedAt: FirebaseFirestore.Timestamp;
    lastUpdatedAt: FirebaseFirestore.Timestamp;
    stoppedAt: FirebaseFirestore.Timestamp | null;
    errors: Array<{ siteId: string; name: string; error: string; timestamp: string }>;
}

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2000;
const MAX_DELAY_MS = 60000;
const DELAY_BETWEEN_SITES_MS = 5000;

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 */
function getBackoffDelay(attempt: number): number {
    return Math.min(BASE_DELAY_MS * Math.pow(2, attempt), MAX_DELAY_MS);
}

/**
 * Check if job should stop
 */
async function shouldStop(jobId: string): Promise<boolean> {
    const doc = await db.collection('batchJobs').doc(jobId).get();
    return doc.data()?.status === 'stopped';
}

/**
 * Update job progress
 */
async function updateProgress(
    jobId: string,
    updates: Partial<BatchJob>
): Promise<void> {
    await db.collection('batchJobs').doc(jobId).update({
        ...updates,
        lastUpdatedAt: FieldValue.serverTimestamp(),
    });
}

/**
 * Process a single site with retry logic
 */
async function processSiteWithRetry(
    siteId: string,
    siteName: string,
    siteUrl: string,
    jobId: string
): Promise<{ success: boolean; error?: string }> {
    // Import heavy modules only when needed
    const { crawlSite } = await import('../ai/crawler.js');
    const { uploadScreenshots } = await import('../ai/storage.js');
    const { analyzeScreenshots, buildVisionContext } = await import('../ai/visionAnalyzer.js');
    const { analyzeSite } = await import('../ai/analyzer.js');
    const { generateReview } = await import('../ai/writer.js');
    const { buildAnalysisContext } = await import('../ai/prompts.js');

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            logger.info(`Processing ${siteName} (attempt ${attempt + 1}/${MAX_RETRIES})`);

            // Check for stop signal
            if (await shouldStop(jobId)) {
                return { success: false, error: 'Job stopped' };
            }

            // Step 1: Mark as processing
            await db.collection('sites').doc(siteId).update({
                status: 'processing',
                processingStartedAt: FieldValue.serverTimestamp(),
            });

            // Step 2: Crawl
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

            // Step 3: Vision Analysis
            const visionAnalysis = await analyzeScreenshots(screenshotBuffers);
            const visionContext = buildVisionContext(visionAnalysis);

            // Step 4: Text Analysis
            const siteInfo = { name: siteName, url: siteUrl, category: '', description: '' };
            const analysis = await analyzeSite(siteInfo);

            // Step 5: Generate Review
            const analysisContext = buildAnalysisContext(analysis);
            const fullContext = `${analysisContext}\n\n${visionContext}`;
            const review = await generateReview(siteInfo, fullContext);

            // Clean content
            let content = review.content || '';
            content = content.replace(/\\n/g, '\n').replace(/```json\n?/gi, '').replace(/```$/i, '').trim();
            review.content = content;

            // Step 6: Publish
            await db.collection('sites').doc(siteId).update({
                crawlData,
                analysis,
                visionAnalysis,
                review: { ...review, generatedBy: 'batch', generatedAt: FieldValue.serverTimestamp() },
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
                // Max retries reached
                return { success: false, error: errorMsg };
            }
        }
    }

    return { success: false, error: 'Max retries exceeded' };
}

/**
 * Main batch processing function
 */
export async function runBatchProcessor(jobId: string): Promise<void> {
    logger.info('Starting batch processor, job:', jobId);

    try {
        const jobDoc = await db.collection('batchJobs').doc(jobId).get();
        if (!jobDoc.exists) {
            logger.error('Job not found:', jobId);
            return;
        }

        // Get pending sites
        const sitesSnapshot = await db.collection('sites')
            .where('status', '==', 'pending')
            .orderBy('submittedAt', 'asc')
            .limit(100)
            .get();

        const sites = sitesSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        logger.info(`Found ${sites.length} pending sites to process`);

        await updateProgress(jobId, {
            totalSites: sites.length,
            status: 'running',
        });

        let successCount = 0;
        let errorCount = 0;
        const skipList: string[] = [];
        const errors: BatchJob['errors'] = [];

        for (let i = 0; i < sites.length; i++) {
            const site = sites[i] as any;

            // Check for stop signal
            if (await shouldStop(jobId)) {
                logger.info('Job stopped by user');
                await updateProgress(jobId, {
                    status: 'stopped',
                    stoppedAt: FieldValue.serverTimestamp() as any,
                });
                return;
            }

            // Update current site
            await updateProgress(jobId, {
                currentSiteId: site.id,
                currentSiteName: site.name,
                processedCount: i,
            });

            // Process site
            const result = await processSiteWithRetry(site.id, site.name, site.url, jobId);

            if (result.success) {
                successCount++;
            } else {
                errorCount++;
                skipList.push(site.id);
                errors.push({
                    siteId: site.id,
                    name: site.name,
                    error: result.error || 'Unknown error',
                    timestamp: new Date().toISOString(),
                });
            }

            // Update progress
            await updateProgress(jobId, {
                processedCount: i + 1,
                successCount,
                errorCount,
                skipList,
                errors,
            });

            // Delay between sites (be nice to APIs)
            if (i < sites.length - 1) {
                await sleep(DELAY_BETWEEN_SITES_MS);
            }
        }

        // Mark complete
        await updateProgress(jobId, {
            status: 'completed',
            currentSiteId: null,
            currentSiteName: null,
        });

        logger.info(`Batch complete: ${successCount} success, ${errorCount} errors`);

    } catch (err) {
        logger.error('Batch processor failed:', err);
        await updateProgress(jobId, { status: 'failed' });
    }
}
