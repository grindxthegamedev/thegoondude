/**
 * Vision Analyzer
 * Analyzes screenshots using Gemini's multimodal capabilities
 */

import * as logger from 'firebase-functions/logger';
import { getVisionModel } from './gemini';

export interface VisionAnalysis {
    layoutQuality: string;
    colorScheme: string;
    contentDensity: string;
    adDensity: string;
    uiObservations: string[];
    visualPros: string[];
    visualCons: string[];
}

const VISION_PROMPT = `Analyze this adult website screenshot and provide insights:

Evaluate:
1. layoutQuality - How clean/organized is the layout? (excellent/good/fair/poor)
2. colorScheme - Describe the color palette (dark, vibrant, muted, etc.)
3. contentDensity - How much content is visible? (minimal/moderate/dense/cluttered)
4. adDensity - How many ads are visible? (none/few/moderate/heavy)
5. uiObservations - 3-5 specific UI observations about navigation, buttons, thumbnails
6. visualPros - 2-3 visual strengths (good thumbnail quality, clear navigation, etc.)
7. visualCons - 1-3 visual weaknesses (too many popups, confusing layout, etc.)

Focus on UX and design quality, not content appropriateness.`;

/**
 * Analyze a single screenshot
 */
async function analyzeScreenshot(imageBuffer: Buffer): Promise<VisionAnalysis | null> {
    try {
        const model = getVisionModel();
        const base64Image = imageBuffer.toString('base64');

        const result = await model.generateContent({
            contents: [{
                role: 'user',
                parts: [
                    { text: VISION_PROMPT },
                    {
                        inlineData: {
                            mimeType: 'image/png',
                            data: base64Image,
                        },
                    },
                ],
            }],
        });

        const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (!text) return null;

        return JSON.parse(text) as VisionAnalysis;
    } catch (err) {
        logger.warn('Vision analysis failed:', err);
        return null;
    }
}

/**
 * Analyze multiple screenshots and combine insights
 */
export async function analyzeScreenshots(screenshots: Buffer[]): Promise<VisionAnalysis> {
    if (screenshots.length === 0) {
        return getDefaultAnalysis();
    }

    logger.info(`Analyzing ${screenshots.length} screenshots...`);

    // Analyze first screenshot (homepage is most important)
    const primaryAnalysis = await analyzeScreenshot(screenshots[0]);

    if (!primaryAnalysis) {
        logger.warn('Primary vision analysis failed, using defaults');
        return getDefaultAnalysis();
    }

    // If we have more screenshots, analyze one more for variety
    if (screenshots.length >= 2) {
        const secondaryAnalysis = await analyzeScreenshot(screenshots[1]);
        if (secondaryAnalysis) {
            // Combine observations
            primaryAnalysis.uiObservations = [
                ...primaryAnalysis.uiObservations,
                ...secondaryAnalysis.uiObservations,
            ].slice(0, 6);
        }
    }

    logger.info('Vision analysis complete:', primaryAnalysis.layoutQuality);
    return primaryAnalysis;
}

/**
 * Default analysis when vision fails
 */
function getDefaultAnalysis(): VisionAnalysis {
    return {
        layoutQuality: 'unknown',
        colorScheme: 'unknown',
        contentDensity: 'unknown',
        adDensity: 'unknown',
        uiObservations: ['Visual analysis pending'],
        visualPros: [],
        visualCons: [],
    };
}

/**
 * Build context string from vision analysis for writer
 */
export function buildVisionContext(analysis: VisionAnalysis): string {
    const lines: string[] = [];

    lines.push(`Visual Analysis:`);
    lines.push(`- Layout Quality: ${analysis.layoutQuality}`);
    lines.push(`- Color Scheme: ${analysis.colorScheme}`);
    lines.push(`- Content Density: ${analysis.contentDensity}`);
    lines.push(`- Ad Density: ${analysis.adDensity}`);

    if (analysis.uiObservations.length > 0) {
        lines.push(`- UI Observations: ${analysis.uiObservations.join('; ')}`);
    }
    if (analysis.visualPros.length > 0) {
        lines.push(`- Visual Strengths: ${analysis.visualPros.join('; ')}`);
    }
    if (analysis.visualCons.length > 0) {
        lines.push(`- Visual Weaknesses: ${analysis.visualCons.join('; ')}`);
    }

    return lines.join('\n');
}
