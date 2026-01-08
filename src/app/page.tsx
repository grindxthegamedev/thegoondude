'use client';

import Link from "next/link";
import { Button, SiteListing } from "@/components";
import { useTopSites, useNewSites } from "@/lib/hooks";
import styles from "./page.module.css";

const categories = [
  "All", "Tubes", "Premium", "Cams", "Amateur",
  "VR", "Hentai", "Dating", "Niche", "Free"
];

export default function Home() {
  const { sites: topSites, loading: topLoading } = useTopSites(5);
  const { sites: newSites, loading: newLoading } = useNewSites(5);

  return (
    <>
      {/* Hero */}
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>
          Your <span className={styles.heroAccent}>Cutest</span> NSFW Directory
        </h1>
        <p className={styles.heroTagline}>
          <span className={styles.heroEmoji}>💕</span> AI-powered reviews for the best adult sites.
          No BS, just honest ratings.
        </p>
      </section>

      {/* Category Nav */}
      <nav className={styles.categoryNav}>
        <div className={styles.categoryList}>
          {categories.map((cat, i) => (
            <Link
              key={cat}
              href={cat === "All" ? "/sites" : `/sites/${cat.toLowerCase()}`}
              className={`${styles.categoryPill} ${i === 0 ? styles.active : ""}`}
            >
              {cat}
            </Link>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <div className={styles.main}>
        {/* Top Rated */}
        <section>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>🔥 Top Rated</h2>
            <Link href="/sites/top" className={styles.viewAll}>View all →</Link>
          </div>
          <div className={styles.listings}>
            {topLoading ? (
              <p className={styles.emptyState}>Loading top sites...</p>
            ) : topSites.length > 0 ? (
              topSites.map((site, i) => (
                <SiteListing key={site.id} site={site} rank={i + 1} />
              ))
            ) : (
              <p className={styles.emptyState}>No sites yet. Be the first to submit!</p>
            )}
          </div>
        </section>

        {/* New Additions */}
        <section>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>✨ New Additions</h2>
            <Link href="/sites/new" className={styles.viewAll}>View all →</Link>
          </div>
          <div className={styles.listings}>
            {newLoading ? (
              <p className={styles.emptyState}>Loading new sites...</p>
            ) : newSites.length > 0 ? (
              newSites.map((site) => (
                <SiteListing key={site.id} site={site} />
              ))
            ) : (
              <p className={styles.emptyState}>No new sites yet. Submit yours!</p>
            )}
          </div>
        </section>

        {/* Submit CTA */}
        <section className={styles.submitCta}>
          <h3 className={styles.submitTitle}>Got a site to share? 💖</h3>
          <p className={styles.submitDesc}>
            Submit your site for review and get featured in our directory.
          </p>
          <div className={styles.submitPrice}>$20 one-time fee</div>
          <br />
          <Button href="/submit" size="lg">
            Submit Your Site →
          </Button>
        </section>
      </div>
    </>
  );
}
