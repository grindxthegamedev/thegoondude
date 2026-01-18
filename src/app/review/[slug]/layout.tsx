/**
 * Review Page Layout with Dynamic Metadata
 * Fetches site data for SEO-optimized OG images
 */

import type { Metadata } from 'next';

const BASE_URL = 'https://thegoondude.com';
const FIRESTORE_URL = 'https://firestore.googleapis.com/v1/projects/lustlist411/databases/(default)/documents';

interface ReviewLayoutProps {
    children: React.ReactNode;
    params: Promise<{ slug: string }>;
}

/** Fetch site by slug from Firestore REST API */
async function getSiteBySlug(slug: string) {
    try {
        const response = await fetch(`${FIRESTORE_URL}:runQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                structuredQuery: {
                    from: [{ collectionId: 'sites' }],
                    where: {
                        compositeFilter: {
                            op: 'AND',
                            filters: [
                                { fieldFilter: { field: { fieldPath: 'slug' }, op: 'EQUAL', value: { stringValue: slug } } },
                                { fieldFilter: { field: { fieldPath: 'status' }, op: 'EQUAL', value: { stringValue: 'published' } } },
                            ],
                        },
                    },
                    limit: 1,
                },
            }),
            next: { revalidate: 3600 },
        });

        const data = await response.json();
        if (!data?.[0]?.document?.fields) return null;

        const f = data[0].document.fields;
        return {
            name: f.name?.stringValue || '',
            description: f.description?.stringValue || '',
            rating: f.rating?.doubleValue || f.rating?.integerValue || 0,
            screenshot: f.crawlData?.mapValue?.fields?.screenshotUrls?.arrayValue?.values?.[0]?.stringValue,
            title: f.review?.mapValue?.fields?.title?.stringValue,
            excerpt: f.review?.mapValue?.fields?.excerpt?.stringValue,
        };
    } catch {
        return null;
    }
}

export async function generateMetadata({ params }: ReviewLayoutProps): Promise<Metadata> {
    const { slug } = await params;
    const site = await getSiteBySlug(slug);

    if (!site) {
        const title = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        return { title: `${title} Review`, description: `Review of ${title}` };
    }

    const title = site.title || `${site.name} Review`;
    const desc = site.excerpt || `AI review of ${site.name}. Rating: ${site.rating}/10. ${site.description}`;
    const image = site.screenshot || `${BASE_URL}/mascot.png`;

    return {
        title,
        description: desc,
        openGraph: {
            title: `${title} | TheGoonDude`,
            description: desc,
            type: 'article',
            url: `${BASE_URL}/review/${slug}`,
            images: [{ url: image, width: 1280, height: 800, alt: `${site.name} screenshot` }],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description: desc,
            images: [image],
        },
        alternates: { canonical: `${BASE_URL}/review/${slug}` },
    };
}

export default function ReviewLayout({ children }: ReviewLayoutProps) {
    return children;
}
