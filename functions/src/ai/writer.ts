/**
 * Writer Agent
 * Generates AI reviews using Gemini
 */

import * as logger from 'firebase-functions/logger';
import { getTextModel } from './gemini';
import { WRITER_SYSTEM_PROMPT, buildReviewPrompt } from './prompts';

export interface SiteData {
    name: string;
    url: string;
    category: string;
    description: string;
}

export interface GeneratedReview {
    title: string;
    content: string;
    excerpt: string;
    pros: string[];
    cons: string[];
    rating: number;
}

/**
 * Generate a review for a site
 */
export async function generateReview(
    site: SiteData,
    analysisContext?: string
): Promise<GeneratedReview> {
    const model = getTextModel();
    const prompt = `${WRITER_SYSTEM_PROMPT}\n\n${buildReviewPrompt(site, analysisContext)}`;

    logger.info('Generating review for:', site.name);

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!text) {
        logger.error('Empty response from Gemini');
        throw new Error('Empty response from Gemini');
    }

    logger.info('Response length:', text.length);

    try {
        const review = JSON.parse(text) as GeneratedReview;
        logger.info('Parsed review:', review.title, 'Rating:', review.rating);

        return {
            title: review.title || `${site.name} Review`,
            content: review.content || '',
            excerpt: (review.excerpt || '').slice(0, 150),
            pros: Array.isArray(review.pros) ? review.pros.slice(0, 5) : [],
            cons: Array.isArray(review.cons) ? review.cons.slice(0, 5) : [],
            rating: Math.min(10, Math.max(1, review.rating || 5)),
        };
    } catch (parseError) {
        logger.error('JSON parse error:', parseError);
        logger.error('Raw response:', text.substring(0, 1000));
        throw new Error('Failed to parse review JSON');
    }
}
