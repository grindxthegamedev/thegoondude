/**
 * CategorySection Component
 * Displays a category with description and site previews for SEO
 */

'use client';

import Link from 'next/link';
import type { Category } from '@/lib/categories';
import type { Site } from '@/lib/types';
import styles from './CategorySection.module.css';

interface CategorySectionProps {
    category: Category;
    sites: Site[];
    loading?: boolean;
}

export function CategorySection({ category, sites, loading }: CategorySectionProps) {
    return (
        <section className={styles.section}>
            <header className={styles.header}>
                <Link href={`/sites?category=${category.slug}`} className={styles.titleLink}>
                    <span className={styles.icon}>{category.icon}</span>
                    <h2 className={styles.title}>{category.label}</h2>
                    <span className={styles.arrow}>→</span>
                </Link>
                <p className={styles.description}>{category.description}</p>
            </header>

            <div className={styles.sites}>
                {loading ? (
                    <div className={styles.loading}>Loading...</div>
                ) : sites.length > 0 ? (
                    sites.map((site) => (
                        <Link
                            key={site.id}
                            href={`/review/${site.slug}`}
                            className={styles.siteCard}
                        >
                            <span className={styles.siteName}>{site.name}</span>
                            {site.rating && (
                                <span className={styles.rating}>
                                    ⭐ {site.rating.toFixed(1)}
                                </span>
                            )}
                        </Link>
                    ))
                ) : (
                    <p className={styles.empty}>No sites yet</p>
                )}
            </div>
        </section>
    );
}
