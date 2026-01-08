/**
 * Analyzer Agent
 * Analyzes site data to generate preliminary insights
 */

import * as logger from 'firebase-functions/logger';
import { getAnalysisModel } from './gemini';

export interface SiteInfo {
    name: string;
    url: string;
    category: string;
    description: string;
}

export interface AnalysisResult {
    contentType: string;
    designNotes: string;
    uniqueFeatures: string[];
    targetAudience: string;
    preliminaryPros: string[];
    preliminaryCons: string[];
    suggestedRating: number;
}

const ANALYZER_PROMPT = `Analyze this adult website and provide insights:

Site Name: {{name}}
URL: {{url}}
Category: {{category}}
Description: {{description}}

Provide:
1. contentType - content classification
2. designNotes - UX notes for this category
3. uniqueFeatures - what makes this site stand out (3-5 items)
4. targetAudience - who this site is for
5. preliminaryPros - initial pros (3-5)
6. preliminaryCons - initial cons (2-3)
7. suggestedRating - suggested rating 1-10`;

/**
 * Analyze a site based on its metadata
 */
export async function analyzeSite(site: SiteInfo): Promise<AnalysisResult> {
    logger.info('analyzeSite called for:', site.name);

    const model = getAnalysisModel();
    logger.info('Got analysis model');

    const prompt = ANALYZER_PROMPT
        .replace('{{name}}', site.name)
        .replace('{{url}}', site.url)
        .replace('{{category}}', site.category)
        .replace('{{description}}', site.description);

    logger.info('Prompt ready, length:', prompt.length);
    logger.info('Calling generateContent...');

    try {
        const result = await model.generateContent(prompt);
        logger.info('generateContent returned successfully');

        const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '';
        logger.info('Response text length:', text.length);
        logger.info('Response preview:', text.substring(0, 200));

        if (!text) {
            logger.error('Empty analysis response');
            throw new Error('Empty analysis response');
        }

        const analysis = JSON.parse(text) as AnalysisResult;
        logger.info('Analysis parsed:', analysis.contentType);

        return {
            contentType: analysis.contentType || site.category,
            designNotes: analysis.designNotes || '',
            uniqueFeatures: Array.isArray(analysis.uniqueFeatures) ? analysis.uniqueFeatures : [],
            targetAudience: analysis.targetAudience || 'General adult audience',
            preliminaryPros: Array.isArray(analysis.preliminaryPros) ? analysis.preliminaryPros : [],
            preliminaryCons: Array.isArray(analysis.preliminaryCons) ? analysis.preliminaryCons : [],
            suggestedRating: Math.min(10, Math.max(1, analysis.suggestedRating || 5)),
        };
    } catch (err: unknown) {
        const error = err as Error & {
            response?: { status?: number; statusText?: string; data?: unknown };
            code?: string;
            details?: string;
        };

        logger.error('=== ANALYSIS ERROR DETAILS ===');
        logger.error('Error message:', error.message);
        logger.error('Error name:', error.name);
        logger.error('Error code:', error.code);
        logger.error('Error details:', error.details);
        logger.error('Error stack:', error.stack?.substring(0, 500));

        if (error.response) {
            logger.error('Response status:', error.response.status);
            logger.error('Response statusText:', error.response.statusText);
            logger.error('Response data:', JSON.stringify(error.response.data).substring(0, 500));
        }

        // Return default on any error
        return {
            contentType: site.category,
            designNotes: 'Analysis pending - API error',
            uniqueFeatures: [],
            targetAudience: 'General adult audience',
            preliminaryPros: ['Content available'],
            preliminaryCons: ['Unable to analyze'],
            suggestedRating: 5,
        };
    }
}
