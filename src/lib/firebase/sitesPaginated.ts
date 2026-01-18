/**
 * Paginated Sites API
 * Firestore operations with cursor-based pagination
 */

import {
    collection,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    getDocs,
    QueryConstraint,
    DocumentSnapshot,
} from 'firebase/firestore';
import { getDb } from './config';
import type { Site } from '../types';

const COLLECTION = 'sites';

interface FetchPaginatedOptions {
    category?: string;
    sortBy?: 'rating' | 'publishedAt' | 'name';
    pageSize?: number;
    startAfterDoc?: DocumentSnapshot | unknown | null;
}

interface PaginatedResult {
    sites: Site[];
    lastDoc: DocumentSnapshot | null;
    hasMore: boolean;
}

/**
 * Fetch sites with cursor-based pagination
 */
export async function fetchSitesPaginated(
    options: FetchPaginatedOptions = {}
): Promise<PaginatedResult> {
    const {
        category,
        sortBy = 'rating',
        pageSize = 20,
        startAfterDoc,
    } = options;

    // A-Z sorting uses ascending order
    const sortOrder = sortBy === 'name' ? 'asc' : 'desc';

    const db = getDb();
    const constraints: QueryConstraint[] = [];

    // Only published sites
    constraints.push(where('status', '==', 'published'));

    // Filter by category
    if (category) {
        constraints.push(where('category', '==', category));
    }

    // Sort
    constraints.push(orderBy(sortBy, sortOrder));

    // Cursor for pagination
    if (startAfterDoc) {
        constraints.push(startAfter(startAfterDoc));
    }

    // Limit + 1 to check if there are more
    constraints.push(limit(pageSize + 1));

    const q = query(collection(db, COLLECTION), ...constraints);
    const snapshot = await getDocs(q);

    const docs = snapshot.docs;
    const hasMore = docs.length > pageSize;

    // Remove the extra document if we fetched more
    const siteDocs = hasMore ? docs.slice(0, pageSize) : docs;

    const sites = siteDocs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...docSnapshot.data(),
    })) as Site[];

    const lastDoc = siteDocs.length > 0
        ? siteDocs[siteDocs.length - 1]
        : null;

    return { sites, lastDoc, hasMore };
}
