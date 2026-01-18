/**
 * Crawler AI - LLM-Powered Navigation
 * Uses Gemini Vision to intelligently navigate and understand pages
 */

import { Page } from 'puppeteer-core';
import { getVertexAI } from './gemini';
import { PageState } from './crawlerDOM';
import * as logger from 'firebase-functions/logger';
import { HarmCategory, HarmBlockThreshold, SchemaType } from '@google-cloud/vertexai';

/** AI action decision */
export interface AIActionDecision {
    target: string | null;
    reason: string;
    confidence: 'high' | 'medium' | 'low';
}

/** AI scroll strategy */
export interface AIScrollStrategy {
    shouldScroll: boolean;
    scrollDepth: 'shallow' | 'medium' | 'deep';
    reason: string;
}

/** Safety settings for adult content */
const SAFETY_SETTINGS = [
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

/** Get lightweight model for quick decisions */
function getNavigationModel() {
    return getVertexAI().getGenerativeModel({
        model: 'gemini-3-flash-preview',
        safetySettings: SAFETY_SETTINGS,
        generationConfig: {
            maxOutputTokens: 256,
            temperature: 0.3,
            responseMimeType: 'application/json',
            responseSchema: {
                type: SchemaType.OBJECT,
                properties: {
                    target: { type: SchemaType.STRING, nullable: true },
                    reason: { type: SchemaType.STRING },
                    confidence: { type: SchemaType.STRING },
                },
                required: ['reason', 'confidence'],
            },
        },
    });
}

/**
 * Use AI to find the best element to click
 */
export async function findBestActionWithAI(
    pageState: PageState,
    screenshot: Buffer
): Promise<AIActionDecision> {
    try {
        const buttonTexts = pageState.buttons.slice(0, 15).map(b => b.text).join(', ');
        const linkTexts = pageState.links.slice(0, 10).map(l => l.text).join(', ');

        const prompt = `You are navigating an adult website to find content for a review.
Goal: Find the best element to click to reach content (videos, galleries, streams).
Available buttons: [${buttonTexts}]
Available links: [${linkTexts}]
Set target to the exact text, or null if already on content.`;

        const model = getNavigationModel();
        const result = await model.generateContent({
            contents: [{
                role: 'user',
                parts: [
                    { text: prompt },
                    { inlineData: { mimeType: 'image/png', data: screenshot.toString('base64') } },
                ],
            }],
        });

        const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        const response = JSON.parse(text);
        logger.info('AI navigation decision:', response);

        return {
            target: response.target || null,
            reason: response.reason || 'AI decision',
            confidence: response.confidence || 'medium',
        };
    } catch (err) {
        logger.warn('AI navigation failed:', err);
        return { target: null, reason: 'AI unavailable', confidence: 'low' };
    }
}

/**
 * Use AI to determine if current page is content
 */
export async function isContentPageWithAI(screenshot: Buffer): Promise<boolean> {
    try {
        const model = getVertexAI().getGenerativeModel({
            model: 'gemini-3-flash-preview',
            safetySettings: SAFETY_SETTINGS,
            generationConfig: { maxOutputTokens: 16, temperature: 0.1 },
        });

        const result = await model.generateContent({
            contents: [{
                role: 'user',
                parts: [
                    { text: 'Is this a content page with video player, gallery, or stream? Answer: yes or no' },
                    { inlineData: { mimeType: 'image/png', data: screenshot.toString('base64') } },
                ],
            }],
        });

        const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return text.toLowerCase().includes('yes');
    } catch (err) {
        logger.warn('AI content detection failed:', err);
        return false;
    }
}

/**
 * Use AI to determine optimal scroll strategy
 */
export async function getScrollStrategyWithAI(screenshot: Buffer): Promise<AIScrollStrategy> {
    try {
        const model = getVertexAI().getGenerativeModel({
            model: 'gemini-3-flash-preview',
            safetySettings: SAFETY_SETTINGS,
            generationConfig: {
                maxOutputTokens: 128,
                temperature: 0.2,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: SchemaType.OBJECT,
                    properties: {
                        shouldScroll: { type: SchemaType.BOOLEAN },
                        scrollDepth: { type: SchemaType.STRING },
                        reason: { type: SchemaType.STRING },
                    },
                    required: ['shouldScroll', 'scrollDepth', 'reason'],
                },
            },
        });

        const result = await model.generateContent({
            contents: [{
                role: 'user',
                parts: [
                    { text: 'Should we scroll? Answer scrollDepth: shallow (1-2), medium (3-4), or deep (5+).' },
                    { inlineData: { mimeType: 'image/png', data: screenshot.toString('base64') } },
                ],
            }],
        });

        const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        const response = JSON.parse(text);
        logger.info('AI scroll strategy:', response);

        return {
            shouldScroll: response.shouldScroll ?? true,
            scrollDepth: response.scrollDepth || 'medium',
            reason: response.reason || 'Default',
        };
    } catch (err) {
        logger.warn('AI scroll strategy failed:', err);
        return { shouldScroll: true, scrollDepth: 'medium', reason: 'Fallback' };
    }
}

/**
 * Execute AI-guided scroll with screenshots
 */
export async function aiGuidedScroll(
    page: Page,
    screenshot: Buffer,
    onSnapshot: () => Promise<void>
): Promise<void> {
    const strategy = await getScrollStrategyWithAI(screenshot);

    if (!strategy.shouldScroll) {
        logger.info('AI decided not to scroll:', strategy.reason);
        return;
    }

    const scrollCounts = { shallow: 2, medium: 4, deep: 6 };
    const maxScrolls = scrollCounts[strategy.scrollDepth] || 3;

    logger.info(`AI scroll: ${strategy.scrollDepth} (${maxScrolls} scrolls)`);

    for (let i = 0; i < maxScrolls; i++) {
        await page.evaluate(() => {
            window.scrollBy({ top: window.innerHeight * 0.7, behavior: 'smooth' });
        });
        await new Promise(r => setTimeout(r, 600));
        await onSnapshot();
    }

    await page.evaluate(() => window.scrollTo({ top: 0 }));
}
