import styles from '../about/page.module.css';

export const metadata = {
    title: 'Contact Us | TheGoonDude',
    description: 'Get in touch with TheGoonDude for questions, support, or business inquiries.',
};

export default function ContactPage() {
    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <h1 className={styles.title}>📬 Contact Us</h1>
                <p className={styles.subtitle}>
                    Got questions? We&apos;d love to hear from you.
                </p>
            </header>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>📧 Email</h2>
                <div className={styles.sectionContent}>
                    <p>
                        For general inquiries, support, or business matters:
                    </p>
                    <p>
                        <a href="mailto:contact@thegoondude.com" style={{ color: 'var(--primary)' }}>
                            contact@thegoondude.com
                        </a>
                    </p>
                </div>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>🏢 Business Inquiries</h2>
                <div className={styles.sectionContent}>
                    <p>
                        Interested in advertising, partnerships, or affiliate programs?
                        Reach out and we&apos;ll get back to you within 24-48 hours.
                    </p>
                </div>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>⚠️ DMCA & Takedowns</h2>
                <div className={styles.sectionContent}>
                    <p>
                        TheGoonDude does not host any content; we only review and link to external sites.
                        If you believe a reviewed site infringes your rights, please contact the site directly.
                    </p>
                    <p>
                        For issues with our reviews, email us with the site URL and your concern.
                    </p>
                </div>
            </section>
        </div>
    );
}
