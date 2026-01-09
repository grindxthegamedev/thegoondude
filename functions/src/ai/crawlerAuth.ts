/**
 * Crawler Authentication
 * Google OAuth support for authenticated crawling
 */

import { Page } from 'puppeteer-core';
import * as logger from 'firebase-functions/logger';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const SECRET_NAME = 'projects/lustlist411/secrets/CRAWLER_GOOGLE_OAUTH/versions/latest';

let secretClient: SecretManagerServiceClient | null = null;

/**
 * Get Secret Manager client (singleton)
 */
function getSecretClient(): SecretManagerServiceClient {
    if (!secretClient) {
        secretClient = new SecretManagerServiceClient();
    }
    return secretClient;
}

/**
 * Check if auth is configured (secret exists)
 */
export async function isAuthEnabled(): Promise<boolean> {
    try {
        const client = getSecretClient();
        const [version] = await client.accessSecretVersion({ name: SECRET_NAME });
        return !!version.payload?.data;
    } catch {
        logger.info('OAuth not configured, crawling without auth');
        return false;
    }
}

/**
 * Retrieve Google OAuth tokens from Secret Manager
 */
async function getAuthTokens(): Promise<{ accessToken: string; refreshToken: string } | null> {
    try {
        const client = getSecretClient();
        const [version] = await client.accessSecretVersion({ name: SECRET_NAME });

        const payload = version.payload?.data?.toString();
        if (!payload) return null;

        return JSON.parse(payload);
    } catch (err) {
        logger.error('Failed to retrieve auth tokens:', err);
        return null;
    }
}

/**
 * Inject Google authentication cookies into browser
 */
export async function injectAuthCookies(page: Page): Promise<boolean> {
    const tokens = await getAuthTokens();
    if (!tokens) {
        logger.warn('No auth tokens available');
        return false;
    }

    try {
        // Set Google OAuth cookies
        // These cookies allow sites using "Continue with Google" to recognize the session
        await page.setCookie(
            {
                name: 'SAPISID',
                value: tokens.accessToken.substring(0, 32),
                domain: '.google.com',
                path: '/',
                secure: true,
                httpOnly: true,
            },
            {
                name: 'SID',
                value: tokens.accessToken,
                domain: '.google.com',
                path: '/',
                secure: true,
            }
        );

        logger.info('Google auth cookies injected');
        return true;
    } catch (err) {
        logger.error('Failed to inject auth cookies:', err);
        return false;
    }
}

/**
 * Attempt to click "Continue with Google" and authenticate
 */
export async function attemptGoogleAuth(page: Page): Promise<boolean> {
    const googleAuthSelectors = [
        'button[class*="google"]',
        '[class*="google"] button',
        'a[href*="accounts.google.com"]',
        '[data-provider="google"]',
        'button:has-text("Google")',
        '[class*="oauth"] [class*="google"]',
    ];

    for (const selector of googleAuthSelectors) {
        try {
            const el = await page.$(selector);
            if (el) {
                logger.info(`Found Google auth button: ${selector}`);
                await el.click();
                // Wait for OAuth flow
                await page.waitForNavigation({ timeout: 10000 }).catch(() => { });
                return true;
            }
        } catch { /* ignore */ }
    }

    return false;
}
