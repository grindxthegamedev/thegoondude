/**
 * Validation Utilities
 * Input sanitization and validation for form submissions
 */

/**
 * Sanitize string input - remove dangerous characters
 */
export function sanitizeString(input: string): string {
    if (!input || typeof input !== 'string') return '';

    return input
        .trim()
        .replace(/[<>]/g, '') // Remove HTML brackets
        .replace(/javascript:/gi, '') // Remove JS protocol
        .replace(/on\w+=/gi, '') // Remove event handlers
        .slice(0, 1000); // Limit length
}

/**
 * Sanitize URL - ensure it's a valid http/https URL
 */
export function sanitizeUrl(input: string): string {
    if (!input || typeof input !== 'string') return '';

    const trimmed = input.trim().toLowerCase();

    // Must start with http:// or https://
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
        return '';
    }

    // Remove dangerous protocols that might be embedded
    if (trimmed.includes('javascript:') || trimmed.includes('data:')) {
        return '';
    }

    return input.trim().slice(0, 500);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
    if (!url) return false;

    try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate site name
 */
export function isValidSiteName(name: string): boolean {
    if (!name) return false;
    const trimmed = name.trim();
    return trimmed.length >= 2 && trimmed.length <= 100;
}

/**
 * Validate description
 */
export function isValidDescription(desc: string): boolean {
    if (!desc) return false;
    const trimmed = desc.trim();
    return trimmed.length >= 20 && trimmed.length <= 500;
}

/**
 * Generate slug from name
 */
export function generateSlug(name: string): string {
    return sanitizeString(name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 50);
}
