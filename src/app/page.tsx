'use client';

import Link from "next/link";
import { Button, SiteListing, CategorySection, SiteListingsSkeletonGroup } from "@/components";
import { useTopSites, useCategorySites } from "@/lib/hooks";
import { CATEGORIES } from "@/lib/categories";
import styles from "./page.module.css";

export default function Home() {
  const { sites: topSites, loading: topLoading } = useTopSites(3);
  const { categorySites, loading: catLoading } = useCategorySites(3);

  return (
    <>
      {/* Hero - SEO-optimized with keywords */}
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>
          The <span className={styles.heroAccent}>411</span> on Adult Sites
        </h1>
        <p className={styles.heroTagline}>
          AI-powered porn site reviews that don&apos;t suck.
          Every adult site rated, roasted, and ranked honestly.
        </p>
        <div className={styles.heroStats}>
          <span className={styles.stat}>🔥 <strong>100+</strong> Sites Reviewed</span>
          <span className={styles.statDivider}>•</span>
          <span className={styles.stat}>🤖 <strong>AI-Powered</strong> Analysis</span>
          <span className={styles.statDivider}>•</span>
          <span className={styles.stat}>💯 <strong>100%</strong> Honest</span>
        </div>
      </section>

      {/* Category Directory with Sites - SEO Keyword-Rich */}
      <section className={styles.directory}>
        <div className={styles.directoryHeader}>
          <h2 className={styles.sectionTitle}>📁 Browse Adult Sites by Category</h2>
          <Link href="/sites" className={styles.viewAll}>View All Sites →</Link>
        </div>
        <p className={styles.directoryDesc}>
          Explore our complete directory of reviewed porn sites, cam sites,
          dating apps, and more. Each category features the best-rated sites
          with honest AI reviews.
        </p>
        <div className={styles.categoryGrid}>
          {CATEGORIES.map((cat) => (
            <CategorySection
              key={cat.id}
              category={cat}
              sites={categorySites[cat.id] || []}
              loading={catLoading}
            />
          ))}
        </div>
      </section>

      {/* Top Rated Preview */}
      <section className={styles.topRated}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>🏆 Top Rated Adult Sites Right Now</h2>
          <Link href="/sites?sortBy=rating" className={styles.viewAll}>See Full Rankings →</Link>
        </div>
        <div className={styles.listings}>
          {topLoading ? (
            <SiteListingsSkeletonGroup count={3} />
          ) : topSites.length > 0 ? (
            topSites.map((site, i) => (
              <SiteListing key={site.id} site={site} rank={i + 1} />
            ))
          ) : (
            <p className={styles.empty}>No sites yet. Be the first!</p>
          )}
        </div>
      </section>

      {/* Submit CTA */}
      <section className={styles.cta}>
        <div className={styles.ctaContent}>
          <h3 className={styles.ctaTitle}>Got an Adult Site Worth Reviewing?</h3>
          <p className={styles.ctaText}>
            Submit your porn site, cam site, or adult platform for a brutally honest AI review.
            Free with backlink, $20 for priority review.
          </p>
          <Button href="/submit" size="lg">Submit Your Site →</Button>
        </div>
      </section>
    </>
  );
}
