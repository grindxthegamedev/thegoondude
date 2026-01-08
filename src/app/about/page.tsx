import { Button } from '@/components';
import styles from './page.module.css';

export const metadata = {
    title: 'About Us | TheGoonDude',
    description: 'Learn about TheGoonDude - the AI-powered NSFW site directory with honest, automated reviews.',
};

export default function AboutPage() {
    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <h1 className={styles.title}>💕 About TheGoonDude</h1>
                <p className={styles.subtitle}>
                    The cutest AI-powered directory for discovering the best adult sites
                </p>
            </header>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>🤖 What We Do</h2>
                <div className={styles.sectionContent}>
                    <p>
                        TheGoonDude is an AI-powered directory that reviews and catalogs adult websites.
                        Instead of relying on paid reviews or outdated lists, we use autonomous AI agents
                        to crawl, analyze, and rate sites objectively.
                    </p>
                    <p>
                        Our AI examines each site&apos;s design, content quality, user experience, and safety
                        to provide honest, detailed reviews you can trust.
                    </p>
                </div>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>✨ Why We&apos;re Different</h2>
                <div className={styles.features}>
                    <div className={styles.feature}>
                        <div className={styles.featureIcon}>🤖</div>
                        <h3 className={styles.featureTitle}>AI-Powered</h3>
                        <p className={styles.featureDesc}>
                            Autonomous agents analyze sites without bias
                        </p>
                    </div>
                    <div className={styles.feature}>
                        <div className={styles.featureIcon}>⚡</div>
                        <h3 className={styles.featureTitle}>Always Fresh</h3>
                        <p className={styles.featureDesc}>
                            Reviews updated automatically, never stale
                        </p>
                    </div>
                    <div className={styles.feature}>
                        <div className={styles.featureIcon}>💯</div>
                        <h3 className={styles.featureTitle}>Brutally Honest</h3>
                        <p className={styles.featureDesc}>
                            No paid placements or sponsored fluff
                        </p>
                    </div>
                </div>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>📝 How It Works</h2>
                <div className={styles.sectionContent}>
                    <p>
                        <strong>1. Submit:</strong> Site owners pay a $20 fee to submit their site for review.
                    </p>
                    <p>
                        <strong>2. Crawl:</strong> Our AI agents visit the site, take screenshots, and analyze content.
                    </p>
                    <p>
                        <strong>3. Review:</strong> An AI writer generates a detailed review with pros, cons, and rating.
                    </p>
                    <p>
                        <strong>4. Publish:</strong> The review goes live in our directory for users to discover.
                    </p>
                </div>
            </section>

            <section className={styles.cta}>
                <h2 className={styles.ctaTitle}>Got a site to share?</h2>
                <p className={styles.ctaDesc}>
                    Submit your site and get featured in our directory.
                </p>
                <Button href="/submit" size="lg">
                    Submit Your Site →
                </Button>
            </section>
        </div>
    );
}
