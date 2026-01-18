/**
 * Submissions API
 * Firestore operations for site submissions
 */

import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { getDb } from './config';
import { sanitizeString, sanitizeUrl, generateSlug } from '../utils/validation';
import type { Site } from '../types';

export interface SubmissionData {
    url: string;
    name: string;
    description: string;
    category: string;
    email: string;
}

export interface SubmissionResult {
    success: boolean;
    siteId?: string;
    error?: string;
}

/**
 * Submit a new site for review
 * Returns the new site ID on success
 */
export async function submitSite(data: SubmissionData): Promise<SubmissionResult> {
    try {
        // Sanitize all inputs
        const sanitizedData = {
            url: sanitizeUrl(data.url),
            name: sanitizeString(data.name),
            description: sanitizeString(data.description),
            category: sanitizeString(data.category).toLowerCase(),
            email: sanitizeString(data.email).toLowerCase(),
        };

        // Validate required fields
        if (!sanitizedData.url) {
            return { success: false, error: 'Invalid URL provided' };
        }
        if (!sanitizedData.name || sanitizedData.name.length < 2) {
            return { success: false, error: 'Site name is required (min 2 characters)' };
        }
        if (!sanitizedData.description || sanitizedData.description.length < 20) {
            return { success: false, error: 'Description is required (min 20 characters)' };
        }
        if (!sanitizedData.category) {
            return { success: false, error: 'Category is required' };
        }

        // Generate slug
        const slug = generateSlug(sanitizedData.name);
        if (!slug) {
            return { success: false, error: 'Could not generate valid slug from name' };
        }

        // Create site document
        const siteData: Omit<Site, 'id'> = {
            url: sanitizedData.url,
            name: sanitizedData.name,
            slug,
            description: sanitizedData.description,
            category: sanitizedData.category,
            tags: [],
            status: 'pending',
            isNew: true,
            submittedAt: new Date(),
            // Rating, review, and crawlData will be added by admin/crawler
        } as any;

        const db = getDb();
        const docRef = await addDoc(collection(db, 'sites'), {
            url: siteData.url,
            name: siteData.name,
            slug: siteData.slug,
            description: siteData.description,
            category: siteData.category,
            status: 'pending',
            submittedAt: Timestamp.now(),
            submitterEmail: sanitizedData.email,
        });

        return { success: true, siteId: docRef.id };
    } catch (error) {
        console.error('Submission error:', error);
        return { success: false, error: 'Failed to submit site. Please try again.' };
    }
}

/**
 * Check if a site has a valid backlink to TheGoonDude
 * Calls the checkBacklink Cloud Function
 */
export interface BacklinkCheckResult {
    eligible: boolean;
    backlinkFound: boolean;
    backlinkUrl?: string;
    message: string;
    retryAfter?: number;
}

export async function checkBacklinkEligibility(url: string): Promise<BacklinkCheckResult> {
    try {
        const { getFunctions, httpsCallable } = await import('firebase/functions');
        const { app } = await import('./config');

        const functions = getFunctions(app);
        const checkBacklink = httpsCallable<{ url: string }, BacklinkCheckResult>(functions, 'checkBacklink');

        const result = await checkBacklink({ url });
        return result.data;
    } catch (error) {
        console.error('Backlink check error:', error);
        return {
            eligible: false,
            backlinkFound: false,
            message: 'Failed to check backlink. Please try again.'
        };
    }
}
