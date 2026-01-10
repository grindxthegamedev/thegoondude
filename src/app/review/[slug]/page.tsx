'use client';

import { use, useEffect, useState } from 'react';
import Markdown from 'react-markdown';
import { Button, Badge, Rating } from '@/components';
import { fetchSiteBySlug } from '@/lib/firebase/sites';
import type { SiteWithReview } from '@/lib/types';
import styles from './page.module.css';

interface ReviewPageProps {
    params: Promise<{ slug: string }>;
}

/**
 * Clean markdown content from AI response
 * Handles escaped newlines, JSON artifacts, and code blocks
 */
function cleanContent(content: string): string {
    let cleaned = content;

    // Replace escaped newlines with actual newlines
    cleaned = cleaned.replace(/\\n/g, '\n');

    // Remove markdown code block wrappers if present
    cleaned = cleaned.replace(/^```(?:json|markdown)?\n?/i, '');
    cleaned = cleaned.replace(/\n?```$/i, '');

    // Remove JSON artifacts like "Rating: X.X/10","excerpt":"..." 
    cleaned = cleaned.replace(/^["'`]*Rating:\s*[\d.]+\/10["'`]*,?\s*/i, '');
    cleaned = cleaned.replace(/["'`]*,?\s*["'`]?excerpt["'`]?:\s*["'`][^"'`]*["'`],?/gi, '');
    cleaned = cleaned.replace(/["'`]*,?\s*["'`]?pros["'`]?:\s*\[[^\]]*\],?/gi, '');
    cleaned = cleaned.replace(/["'`]*,?\s*["'`]?cons["'`]?:\s*\[[^\]]*\],?/gi, '');
    cleaned = cleaned.replace(/["'`]*,?\s*["'`]?rating["'`]?:\s*[\d.]+\}?["'`]*/gi, '');

    // CRITICAL: Ensure markdown headers are on their own line
    // This handles cases where ## is inline with previous text
    cleaned = cleaned.replace(/([^\n])(\s*)(#{1,6}\s+)/g, '$1\n\n$3');

    // Clean up excessive line breaks (more than 3 in a row)
    cleaned = cleaned.replace(/\n{4,}/g, '\n\n\n');

    return cleaned.trim();
}

export default function ReviewPage({ params }: ReviewPageProps) {
    const { slug } = use(params);
    const [site, setSite] = useState<SiteWithReview | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadSite() {
            try {
                const data = await fetchSiteBySlug(slug);
                setSite(data as SiteWithReview);
            } catch (err) {
                console.error('Failed to load site:', err);
            } finally {
                setLoading(false);
            }
        }
        loadSite();
    }, [slug]);

    if (loading) return <div className={styles.page}><p>Loading review...</p></div>;

    if (!site) {
        return (
            <div className={styles.page}>
                <div className={styles.notFound}>
                    <h1>Review Not Found</h1>
                    <p>This site hasn&apos;t been reviewed yet or doesn&apos;t exist.</p>
                    <Button href="/sites">Browse Sites →</Button>
                </div>
            </div>
        );
    }

    const review = site.review;
    // Support both new screenshotUrls array and legacy screenshotUrl
    const screenshotUrls = site.crawlData?.screenshotUrls ||
        (site.crawlData?.screenshotUrl ? [site.crawlData.screenshotUrl] : []);
    const cleanedContent = review?.content ? cleanContent(review.content) : null;

    return (
        <div className={styles.page}>
            {/* Hero */}
            <header className={styles.hero}>
                <div className={styles.heroMeta}>
                    <Badge variant="primary">{site.category}</Badge>
                    {site.isNew && <Badge variant="new">New</Badge>}
                    {site.isPremium && <Badge variant="premium">Premium</Badge>}
                </div>
                <h1 className={styles.title}>{review?.title || site.name}</h1>
                <p className={styles.excerpt}>{review?.excerpt || site.description}</p>
                <div className={styles.ratingBox}>
                    <span className={styles.ratingScore}>{site.rating.toFixed(1)}</span>
                    <span className={styles.ratingMax}>/10</span>
                    <Rating score={site.rating} showScore={false} />
                </div>
            </header>

            {/* Screenshot Gallery */}
            <div className={styles.screenshotWrap}>
                {screenshotUrls.length > 0 ? (
                    <div className={styles.gallery}>
                        {screenshotUrls.map((url, i) => (
                            <img
                                key={i}
                                src={url}
                                alt={`${site.name} screenshot ${i + 1}`}
                                className={styles.screenshot}
                            />
                        ))}
                    </div>
                ) : (
                    <div className={styles.screenshotPlaceholder}>
                        <span>📸</span>
                        <p>Screenshots not available</p>
                    </div>
                )}
            </div>

            {/* Review Content */}
            <section className={styles.content}>
                <div className={styles.prose}>
                    {cleanedContent ? (
                        <Markdown>{cleanedContent}</Markdown>
                    ) : (
                        <>
                            <p>{site.description}</p>
                            <p><em>Full AI review coming soon...</em></p>
                        </>
                    )}
                </div>
            </section>

            {/* Pros/Cons */}
            <section className={styles.proscons}>
                <div className={styles.prosBox}>
                    <h3 className={styles.boxTitle}>👍 Pros</h3>
                    <ul className={styles.boxList}>
                        {review?.pros?.length ? (
                            review.pros.map((pro, i) => <li key={i}>{pro}</li>)
                        ) : (
                            <li>Pros will be generated by AI</li>
                        )}
                    </ul>
                </div>
                <div className={styles.consBox}>
                    <h3 className={styles.boxTitle}>👎 Cons</h3>
                    <ul className={styles.boxList}>
                        {review?.cons?.length ? (
                            review.cons.map((con, i) => <li key={i}>{con}</li>)
                        ) : (
                            <li>Cons will be generated by AI</li>
                        )}
                    </ul>
                </div>
            </section>

            {/* Verdict */}
            <section className={styles.verdict}>
                <h2 className={styles.verdictTitle}>🔥 The Verdict</h2>
                <p className={styles.verdictText}>
                    {cleanedContent ? 'Check out the full review above!' : 'AI verdict coming soon...'}
                </p>
                <Button href={site.url} size="lg">Visit {site.name} →</Button>
            </section>
        </div>
    );
}
