/**
 * Markdown Utilities
 * Helpers for processing and cleaning markdown content
 */

/**
 * Clean markdown content from AI response
 * Backend now handles most cleaning - this is a safety net
 */
export function cleanContent(content: string): string {
    let cleaned = content;

    // Convert escaped newlines to actual newlines
    cleaned = cleaned.replace(/\\n/g, '\n');

    // Remove any code block wrappers
    cleaned = cleaned.replace(/^```(?:json|markdown)?\n?/i, '');
    cleaned = cleaned.replace(/\n?```$/i, '');

    // Ensure headers are on their own lines (safety net)
    cleaned = cleaned.replace(/([^\n])\s*(#{1,6}\s+)/g, '$1\n\n$2');

    // Clean up excessive line breaks
    cleaned = cleaned.replace(/\n{4,}/g, '\n\n\n');

    return cleaned.trim();
}
