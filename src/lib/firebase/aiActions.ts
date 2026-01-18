/**
 * AI Review Actions
 * Frontend functions to trigger AI review generation
 */

const FUNCTIONS_URL = process.env.NEXT_PUBLIC_FUNCTIONS_URL || 'http://localhost:5002/lustlist411/us-central1';

export interface ReviewResult {
    success: boolean;
    review?: {
        title: string;
        content: string;
        excerpt: string;
        pros: string[];
        cons: string[];
        rating: number;
    };
    error?: string;
}

/**
 * Trigger AI review generation for a site (simple)
 */
export async function triggerReviewGeneration(siteId: string): Promise<ReviewResult> {
    try {
        const response = await fetch(`${FUNCTIONS_URL}/generateSiteReview`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ siteId }),
        });

        if (!response.ok) {
            const error = await response.json();
            return { success: false, error: error.error || 'Failed to generate review' };
        }

        const data = await response.json();
        return { success: true, review: data.review };
    } catch (error) {
        console.error('Review generation error:', error);
        return { success: false, error: 'Network error - is the emulator running?' };
    }
}

/**
 * Trigger full pipeline (Analyze + Write + Publish)
 */
export async function triggerFullPipeline(siteId: string): Promise<ReviewResult> {
    try {
        const response = await fetch(`${FUNCTIONS_URL}/processFullReview`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ siteId }),
        });

        if (!response.ok) {
            const error = await response.json();
            return { success: false, error: error.error || 'Failed to process review' };
        }

        const data = await response.json();
        return { success: true, review: data.review };
    } catch (error) {
        console.error('Full pipeline error:', error);
        return { success: false, error: 'Network error - is the emulator running?' };
    }
}
