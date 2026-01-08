/**
 * Admin Auth
 * SHA256 password verification for admin access
 */

const ADMIN_PASSWORD_HASH = process.env.NEXT_PUBLIC_ADMIN_HASH ||
    'b2b2f104d32c638903e151a9b20d6e27b41d8c0c84cf8458738f83ca2f1dd744'; // "password" for dev

/**
 * Hash a string using SHA256
 */
export async function sha256(input: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify admin password against stored hash
 */
export async function verifyAdminPassword(password: string): Promise<boolean> {
    const hash = await sha256(password);
    return hash === ADMIN_PASSWORD_HASH;
}

/**
 * Check if admin session is valid (stored in sessionStorage)
 */
export function isAdminAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('admin_auth') === 'true';
}

/**
 * Set admin authenticated state
 */
export function setAdminAuthenticated(value: boolean): void {
    if (typeof window === 'undefined') return;
    if (value) {
        sessionStorage.setItem('admin_auth', 'true');
    } else {
        sessionStorage.removeItem('admin_auth');
    }
}
