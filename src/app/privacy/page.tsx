import styles from '../about/page.module.css';

export const metadata = {
    title: 'Privacy Policy | TheGoonDude',
    description: 'Privacy policy for TheGoonDude - how we collect, use, and protect your data.',
};

export default function PrivacyPage() {
    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <h1 className={styles.title}>🔒 Privacy Policy</h1>
                <p className={styles.subtitle}>
                    Last updated: January 2026
                </p>
            </header>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>📊 Information We Collect</h2>
                <div className={styles.sectionContent}>
                    <p>
                        <strong>Analytics:</strong> We collect anonymous usage data (pages visited, time on site)
                        to improve our service. This data is aggregated and cannot identify you personally.
                    </p>
                    <p>
                        <strong>Submissions:</strong> If you submit a site for review, we collect the site URL,
                        your email address, and payment information necessary to process your request.
                    </p>
                </div>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>🍪 Cookies</h2>
                <div className={styles.sectionContent}>
                    <p>
                        We use essential cookies for site functionality and optional analytics cookies.
                        Third-party services (like payment processors) may set their own cookies.
                    </p>
                </div>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>🔗 Third-Party Links</h2>
                <div className={styles.sectionContent}>
                    <p>
                        Our site contains links to external adult websites. We are not responsible for
                        the privacy practices or content of these external sites. Review their privacy
                        policies before providing any personal information.
                    </p>
                </div>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>🔞 Age Requirement</h2>
                <div className={styles.sectionContent}>
                    <p>
                        TheGoonDude is intended for adults 18 years or older (21 in some jurisdictions).
                        By using this site, you confirm you are of legal age to view adult content
                        in your jurisdiction.
                    </p>
                </div>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>📧 Contact</h2>
                <div className={styles.sectionContent}>
                    <p>
                        For privacy-related questions, contact us at{' '}
                        <a href="mailto:privacy@thegoondude.com" style={{ color: 'var(--primary)' }}>
                            privacy@thegoondude.com
                        </a>
                    </p>
                </div>
            </section>
        </div>
    );
}
