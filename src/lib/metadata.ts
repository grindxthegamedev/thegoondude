/**
 * SEO Metadata Generators
 * Dynamic meta descriptions for pages
 */

import type { Metadata } from 'next';
import type { SiteWithReview } from './types';

const BASE_URL = 'https://thegoondude.com';
const SITE_NAME = 'TheGoonDude';

/**
 * Generate metadata for a review page
 */
export function generateReviewMetadata(site: SiteWithReview): Metadata {
    const title = site.review?.title || `${site.name} Review`;
    const description = site.review?.excerpt ||
        `Read our honest AI review of ${site.name}. Rating: ${site.rating}/10. ${site.description}`;

    return {
        title,
        description,
        openGraph: {
            title: `${title} | ${SITE_NAME}`,
            description,
            type: 'article',
            url: `${BASE_URL}/review/${site.slug}`,
            images: site.crawlData?.screenshotUrls?.[0] ? [
                { url: site.crawlData.screenshotUrls[0], width: 1200, height: 630 }
            ] : undefined,
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
        },
    };
}

/**
 * Generate metadata for category/sites page
 */
export function generateSitesMetadata(category?: string, query?: string): Metadata {
    if (query) {
        return {
            title: `Search: ${query}`,
            description: `Search results for "${query}" on TheGoonDude. Find the best adult sites matching your search.`,
            robots: 'noindex, follow', // Don't index search result pages
        };
    }

    if (category) {
        const categoryTitle = category.charAt(0).toUpperCase() + category.slice(1);
        return {
            title: `${categoryTitle} Sites`,
            description: `Browse the best ${categoryTitle.toLowerCase()} sites. AI-reviewed and ranked. Find your next favorite.`,
        };
    }

    return {
        title: 'Browse All Sites',
        description: 'Explore our complete directory of AI-reviewed adult sites. Sorted by rating, filtered by category.',
    };
}

/**
 * Generate metadata for static pages
 */
export const staticMetadata = {
    about: {
        title: 'About Us',
        description: 'Learn about TheGoonDude - the AI-powered adult site directory. Our mission, how we review sites, and why we\'re different.',
    },
    contact: {
        title: 'Contact Us',
        description: 'Get in touch with TheGoonDude. Questions, feedback, or business inquiries welcome.',
    },
    submit: {
        title: 'Submit Your Site',
        description: 'Get your adult site reviewed by AI. Free with backlink or $20 for priority review. Fast, honest, detailed.',
    },
    privacy: {
        title: 'Privacy Policy',
        description: 'TheGoonDude privacy policy. How we handle your data and respect your privacy.',
    },
    terms: {
        title: 'Terms of Service',
        description: 'TheGoonDude terms of service. Rules and guidelines for using our directory.',
    },
} as const;
