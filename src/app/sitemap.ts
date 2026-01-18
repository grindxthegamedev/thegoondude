/**
 * Sitemap Generation
 * Dynamic sitemap for all published review pages
 * Uses Firestore REST API for server-side compatibility
 */

import { MetadataRoute } from 'next';

const BASE_URL = 'https://thegoondude.com';
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'lustlist411';

interface FirestoreDocument {
    name: string;
    fields: {
        slug?: { stringValue: string };
        publishedAt?: { timestampValue: string };
        status?: { stringValue: string };
    };
}

interface FirestoreResponse {
    documents?: FirestoreDocument[];
}

/**
 * Fetch published sites from Firestore REST API
 */
async function fetchPublishedSites(): Promise<{ slug: string; publishedAt: string }[]> {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/sites`;
    
    try {
        const response = await fetch(url, {
            next: { revalidate: 3600 }, // Cache for 1 hour
        });
        
        if (!response.ok) {
            console.error('Sitemap: Failed to fetch sites', response.status);
            return [];
        }
        
        const data: FirestoreResponse = await response.json();
        
        if (!data.documents) return [];
        
        return data.documents
            .filter(doc => doc.fields.status?.stringValue === 'published')
            .map(doc => ({
                slug: doc.fields.slug?.stringValue || '',
                publishedAt: doc.fields.publishedAt?.timestampValue || new Date().toISOString(),
            }))
            .filter(site => site.slug);
    } catch (error) {
        console.error('Sitemap: Error fetching sites', error);
        return [];
    }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const sites = await fetchPublishedSites();
    
    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: BASE_URL,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${BASE_URL}/sites`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${BASE_URL}/submit`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: `${BASE_URL}/about`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${BASE_URL}/contact`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
    ];
    
    // Dynamic review pages
    const reviewPages: MetadataRoute.Sitemap = sites.map(site => ({
        url: `${BASE_URL}/review/${site.slug}`,
        lastModified: new Date(site.publishedAt),
        changeFrequency: 'weekly',
        priority: 0.8,
    }));
    
    return [...staticPages, ...reviewPages];
}
