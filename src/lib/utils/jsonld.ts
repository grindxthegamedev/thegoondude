/**
 * JSON-LD Schema Generators
 * Structured data for SEO - Google Rich Results
 */

import type { SiteWithReview } from '../types';

const SITE_NAME = 'TheGoonDude';
const BASE_URL = 'https://thegoondude.com';

/**
 * Generate Review schema for a site review page
 * @see https://schema.org/Review
 */
export function generateReviewSchema(site: SiteWithReview): object {
    const review = site.review;

    return {
        '@context': 'https://schema.org',
        '@type': 'Review',
        name: review?.title || `${site.name} Review`,
        description: review?.excerpt || site.description,
        author: {
            '@type': 'Organization',
            name: SITE_NAME,
            url: BASE_URL,
        },
        itemReviewed: {
            '@type': 'WebSite',
            name: site.name,
            url: site.url,
        },
        reviewRating: {
            '@type': 'Rating',
            ratingValue: site.rating,
            bestRating: 10,
            worstRating: 1,
        },
        datePublished: site.publishedAt || new Date().toISOString(),
        publisher: {
            '@type': 'Organization',
            name: SITE_NAME,
            url: BASE_URL,
        },
    };
}

/**
 * Generate WebSite schema for the homepage
 */
export function generateWebsiteSchema(): object {
    return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE_NAME,
        url: BASE_URL,
        description: 'AI-powered NSFW site reviews and directory',
        potentialAction: {
            '@type': 'SearchAction',
            target: `${BASE_URL}/sites?q={search_term_string}`,
            'query-input': 'required name=search_term_string',
        },
    };
}

/**
 * Generate BreadcrumbList schema
 */
export function generateBreadcrumbSchema(
    items: { name: string; url: string }[]
): object {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.url,
        })),
    };
}

/**
 * Generate Organization schema for branding
 */
export function generateOrganizationSchema(): object {
    return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: SITE_NAME,
        url: BASE_URL,
        logo: `${BASE_URL}/mascot.png`,
        description: 'AI-powered adult site reviews and directory',
        sameAs: [],
    };
}

