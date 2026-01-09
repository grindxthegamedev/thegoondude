import styles from '../about/page.module.css';

export const metadata = {
    title: 'Terms of Service | TheGoonDude',
    description: 'Terms of service for TheGoonDude - rules and guidelines for using our site.',
};

export default function TermsPage() {
    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <h1 className={styles.title}>📜 Terms of Service</h1>
                <p className={styles.subtitle}>
                    Last updated: January 2026
                </p>
            </header>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>🔞 Age Requirement</h2>
                <div className={styles.sectionContent}>
                    <p>
                        <strong>You must be 18 years or older</strong> (21 in some jurisdictions)
                        to access TheGoonDude. By using this site, you confirm that you are of
                        legal age to view adult content in your jurisdiction.
                    </p>
                </div>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>📝 Site Purpose</h2>
                <div className={styles.sectionContent}>
                    <p>
                        TheGoonDude is a directory and review platform for adult websites.
                        We do not host any adult content directly. All reviews are generated
                        by AI and may not reflect the current state of reviewed sites.
                    </p>
                </div>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>🔗 External Links</h2>
                <div className={styles.sectionContent}>
                    <p>
                        We link to third-party adult websites. We are not responsible for
                        the content, accuracy, or practices of these external sites.
                        Visit them at your own risk.
                    </p>
                </div>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>💳 Submissions</h2>
                <div className={styles.sectionContent}>
                    <p>
                        Site submissions require a $20 non-refundable fee. Payment does not
                        guarantee a positive review. All reviews are generated autonomously
                        by AI and reflect our AI&apos;s honest assessment.
                    </p>
                    <p>
                        We reserve the right to reject submissions that violate our guidelines,
                        including sites with illegal content or fraudulent operations.
                    </p>
                </div>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>⚠️ Disclaimer</h2>
                <div className={styles.sectionContent}>
                    <p>
                        Reviews are provided &quot;as is&quot; without warranty. Site conditions
                        may change after review. We are not liable for any damages resulting
                        from your use of reviewed sites.
                    </p>
                </div>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>📧 Contact</h2>
                <div className={styles.sectionContent}>
                    <p>
                        Questions about these terms? Contact us at{' '}
                        <a href="mailto:legal@thegoondude.com" style={{ color: 'var(--primary)' }}>
                            legal@thegoondude.com
                        </a>
                    </p>
                </div>
            </section>
        </div>
    );
}
