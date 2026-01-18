/**
 * CategoryCard Component
 * A single category tile for the homepage grid
 */

'use client';

import Link from 'next/link';
import styles from './CategoryCard.module.css';
import type { Category } from '@/lib/categories';

interface CategoryCardProps {
    category: Category;
    siteCount?: number;
}

export function CategoryCard({ category, siteCount = 0 }: CategoryCardProps) {
    return (
        <Link href={`/sites?category=${category.slug}`} className={styles.card}>
            <span className={styles.icon}>{category.icon}</span>
            <div className={styles.content}>
                <h3 className={styles.label}>{category.label}</h3>
                <p className={styles.description}>{category.description}</p>
            </div>
            {siteCount > 0 && (
                <span className={styles.count}>{siteCount} sites</span>
            )}
            <span className={styles.arrow}>→</span>
        </Link>
    );
}
