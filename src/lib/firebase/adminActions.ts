/**
 * Admin Actions
 * Firestore operations for admin site management
 */

import { doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { getDb } from './config';

/**
 * Approve a pending site (set status to published)
 */
export async function approveSite(siteId: string): Promise<boolean> {
    try {
        const db = getDb();
        await updateDoc(doc(db, 'sites', siteId), {
            status: 'published',
            publishedAt: Timestamp.now(),
        });
        return true;
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
        const db = getDb();
        await updateDoc(doc(db, 'sites', siteId), {
            status: 'rejected',
            rejectedAt: Timestamp.now(),
        });
        return true;
    } catch (error) {
        console.error('Failed to reject site:', error);
        return false;
    }
}

/**
 * Delete a site
 */
export async function deleteSite(siteId: string): Promise<boolean> {
    try {
        const db = getDb();
        await deleteDoc(doc(db, 'sites', siteId));
        return true;
    } catch (error) {
        console.error('Failed to delete site:', error);
        return false;
    }
}

/**
 * Update site rating
 */
export async function updateSiteRating(siteId: string, rating: number): Promise<boolean> {
    try {
        const db = getDb();
        await updateDoc(doc(db, 'sites', siteId), { rating });
        return true;
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
        const db = getDb();
        await updateDoc(doc(db, 'sites', siteId), {
            status: 'processing',
            processingStartedAt: Timestamp.now(),
        });
        return true;
    } catch (error) {
        console.error('Failed to set processing:', error);
        return false;
    }
}
