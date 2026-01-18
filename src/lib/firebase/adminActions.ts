/**
 * Admin Actions
 * Calls Cloud Functions for admin operations (bypasses Firestore rules)
 */

import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { getDb } from './config';

const FUNCTIONS_URL = process.env.NEXT_PUBLIC_FUNCTIONS_URL ||
    'https://us-central1-lustlist411.cloudfunctions.net';

/**
 * Get admin password from session (stored during login)
 */
function getAdminPassword(): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('admin_password');
}

/**
 * Get dashboard stats and pending sites
 */
export async function getDashboardData() {
    try {
        const adminPassword = getAdminPassword();
        if (!adminPassword) return null;

        const response = await fetch(`${FUNCTIONS_URL}/adminGetDashboard`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adminPassword }),
        });

        const data = await response.json();
        if (!response.ok) {
            console.error('Fetch dashboard failed:', data.error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Failed to fetch dashboard:', error);
        return null;
    }
}

/**
 * Get all sites for admin table
 */
export async function getAllSitesData() {
    try {
        const adminPassword = getAdminPassword();
        if (!adminPassword) return null;

        const response = await fetch(`${FUNCTIONS_URL}/adminGetSites`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adminPassword }),
        });

        const data = await response.json();
        return response.ok ? data : null;
    } catch {
        return null;
    }
}

/**
 * Delete a site via Cloud Function
 */

/**
 * Delete a site via Cloud Function
 */
export async function deleteSite(siteId: string): Promise<boolean> {
    try {
        const adminPassword = getAdminPassword();
        if (!adminPassword) {
            console.error('No admin password in session');
            return false;
        }

        const response = await fetch(`${FUNCTIONS_URL}/adminDeleteSite`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ siteId, adminPassword }),
        });

        const data = await response.json();
        if (!response.ok) {
            console.error('Delete failed:', data.error);
            return false;
        }

        return data.success;
    } catch (error) {
        console.error('Failed to delete site:', error);
        return false;
    }
}

/**
 * Approve a pending site (set status to published)
 */
export async function approveSite(siteId: string): Promise<boolean> {
    try {
        const adminPassword = getAdminPassword();
        if (!adminPassword) return false;

        const response = await fetch(`${FUNCTIONS_URL}/adminUpdateSite`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                siteId,
                adminPassword,
                updates: { status: 'published', publishedAt: new Date().toISOString() }
            }),
        });

        return response.ok;
    } catch (error) {
        console.error('Failed to approve site:', error);
        return false;
    }
}

/**
 * Reject a pending site
 */
export async function rejectSite(siteId: string): Promise<boolean> {
    try {
        const adminPassword = getAdminPassword();
        if (!adminPassword) return false;

        const response = await fetch(`${FUNCTIONS_URL}/adminUpdateSite`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                siteId,
                adminPassword,
                updates: { status: 'rejected', rejectedAt: new Date().toISOString() }
            }),
        });

        return response.ok;
    } catch (error) {
        console.error('Failed to reject site:', error);
        return false;
    }
}

/**
 * Update site rating
 */
export async function updateSiteRating(siteId: string, rating: number): Promise<boolean> {
    try {
        const adminPassword = getAdminPassword();
        if (!adminPassword) return false;

        const response = await fetch(`${FUNCTIONS_URL}/adminUpdateSite`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ siteId, adminPassword, updates: { rating } }),
        });

        return response.ok;
    } catch (error) {
        console.error('Failed to update rating:', error);
        return false;
    }
}

/**
 * Set site to processing status (for AI review)
 */
export async function setSiteProcessing(siteId: string): Promise<boolean> {
    try {
        const adminPassword = getAdminPassword();
        if (!adminPassword) return false;

        const response = await fetch(`${FUNCTIONS_URL}/adminUpdateSite`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                siteId,
                adminPassword,
                updates: { status: 'processing', processingStartedAt: new Date().toISOString() }
            }),
        });

        return response.ok;
    } catch (error) {
        console.error('Failed to set processing:', error);
        return false;
    }
}

/**
 * Start batch review process
 */
export async function startBatchReview(): Promise<{ success: boolean; jobId?: string; error?: string }> {
    try {
        const adminPassword = getAdminPassword();
        if (!adminPassword) return { success: false, error: 'No admin password' };

        const response = await fetch(`${FUNCTIONS_URL}/adminStartBatchReview`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adminPassword }),
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Failed to start batch:', error);
        return { success: false, error: 'Network error' };
    }
}

/**
 * Stop batch review process
 */
export async function stopBatchReview(jobId?: string): Promise<{ success: boolean; error?: string }> {
    try {
        const adminPassword = getAdminPassword();
        if (!adminPassword) return { success: false, error: 'No admin password' };

        const response = await fetch(`${FUNCTIONS_URL}/adminStopBatchReview`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adminPassword, jobId }),
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Failed to stop batch:', error);
        return { success: false, error: 'Network error' };
    }
}

/**
 * Get batch job status
 */
export async function getBatchStatus(jobId?: string) {
    try {
        const adminPassword = getAdminPassword();
        if (!adminPassword) return null;

        const response = await fetch(`${FUNCTIONS_URL}/adminGetBatchStatus`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adminPassword, jobId }),
        });

        const data = await response.json();
        return data.success ? data.job : null;
    } catch (error) {
        console.error('Failed to get batch status:', error);
        return null;
    }
}

/**
 * Seed top 100 sites
 */
export async function seedSites(): Promise<{ success: boolean; added: number; skipped: number }> {
    try {
        const adminPassword = getAdminPassword();
        if (!adminPassword) return { success: false, added: 0, skipped: 0 };

        const response = await fetch(`${FUNCTIONS_URL}/adminSeedSites`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adminPassword }),
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Failed to seed sites:', error);
        return { success: false, added: 0, skipped: 0 };
    }
}
