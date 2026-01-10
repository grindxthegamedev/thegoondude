/**
 * Sites API
 * Firestore operations for sites collection
 */

import {
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    QueryConstraint,
    DocumentData,
} from 'firebase/firestore';
import { getDb } from './config';
import type { Site } from '../types';

const COLLECTION = 'sites';

export interface FetchSitesOptions {
    category?: string;
    status?: Site['status'];
    sortBy?: 'rating' | 'publishedAt' | 'name';
    sortOrder?: 'asc' | 'desc';
    limitCount?: number;
    isNew?: boolean;
}

/**
 * Fetch sites from Firestore with optional filters
 */
export async function fetchSites(options: FetchSitesOptions = {}): Promise<Site[]> {
    const {
        category,
        status = 'published',
        sortBy = 'rating',
        limitCount = 20,
        isNew,
    } = options;

    // A-Z sorting should use ascending order by default
    const sortOrder = options.sortOrder ?? (sortBy === 'name' ? 'asc' : 'desc');

    const db = getDb();
    const constraints: QueryConstraint[] = [];

    // Filter by status
    constraints.push(where('status', '==', status));

    // Filter by category
    if (category) {
        constraints.push(where('category', '==', category));
    }

    // Filter by isNew
    if (isNew !== undefined) {
        constraints.push(where('isNew', '==', isNew));
    }

    // Sort
    constraints.push(orderBy(sortBy, sortOrder));

    // Limit
    constraints.push(limit(limitCount));

    const q = query(collection(db, COLLECTION), ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...docSnapshot.data(),
    })) as Site[];
}

/**
 * Fetch a single site by slug
 */
export async function fetchSiteBySlug(slug: string): Promise<Site | null> {
    const db = getDb();
    const q = query(
        collection(db, COLLECTION),
        where('slug', '==', slug),
        where('status', '==', 'published'),
        limit(1)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const docData = snapshot.docs[0];
    return { id: docData.id, ...docData.data() } as Site;
}

/**
 * Fetch top rated sites
 */
export async function fetchTopSites(count: number = 10): Promise<Site[]> {
    return fetchSites({ sortBy: 'rating', sortOrder: 'desc', limitCount: count });
}

/**
 * Fetch newest sites
 */
export async function fetchNewSites(count: number = 10): Promise<Site[]> {
    return fetchSites({ isNew: true, sortBy: 'publishedAt', sortOrder: 'desc', limitCount: count });
}

/**
 * Fetch sites by category
 */
export async function fetchSitesByCategory(category: string, count: number = 20): Promise<Site[]> {
    return fetchSites({ category, limitCount: count });
}

/**
 * Search sites by name (client-side filter for now)
 * Note: Firestore doesn't support full-text search, so we fetch and filter
 */
export async function searchSites(searchQuery: string, count: number = 10): Promise<Site[]> {
    const db = getDb();
    const q = query(
        collection(db, COLLECTION),
        where('status', '==', 'published'),
        orderBy('rating', 'desc'),
        limit(50) // Fetch more to filter
    );

    const snapshot = await getDocs(q);
    const sites = snapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...docSnapshot.data(),
    })) as Site[];

    // Client-side filter by name or category
    const lower = searchQuery.toLowerCase();
    return sites
        .filter(s =>
            s.name.toLowerCase().includes(lower) ||
            s.category.toLowerCase().includes(lower) ||
            s.description?.toLowerCase().includes(lower)
        )
        .slice(0, count);
}
