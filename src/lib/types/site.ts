/**
 * Site Types
 * Core data models for the TheGoonDude directory
 */

export interface Site {
    id: string;
    name: string;
    slug: string;
    url: string;
    description: string;
    category: string;
    tags: string[];
    rating: number;
    thumbnail?: string;
    status: 'pending' | 'processing' | 'published' | 'rejected';
    isNew?: boolean;
    isPremium?: boolean;
    isFree?: boolean;
    submittedBy?: string;
    submittedAt?: Date;
    publishedAt?: Date;
    crawlData?: CrawlData;
}

export interface CrawlData {
    screenshotUrl: string;
    seo: {
        title: string;
        description: string;
        keywords: string[];
        h1: string;
        canonical: string;
    };
    performance: {
        loadTimeMs: number;
        pageSize: number;
    };
}

export interface Review {
    title: string;
    content: string;
    excerpt: string;
    pros: string[];
    cons: string[];
    rating: number;
    generatedBy: 'ai' | 'ai-full' | 'manual';
    generatedAt: Date;
}

export interface Category {
    id: string;
    name: string;
    slug: string;
    count: number;
    icon?: string;
}

export interface SiteWithReview extends Site {
    review?: Review;
}
