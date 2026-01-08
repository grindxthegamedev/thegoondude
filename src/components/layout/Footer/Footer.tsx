import Link from "next/link";
import styles from "./Footer.module.css";

const browseLinks = [
    { href: "/sites", label: "All Sites" },
    { href: "/sites/top", label: "Top Rated" },
    { href: "/sites/new", label: "New Sites" },
    { href: "/sites/premium", label: "Premium" },
];

const categoryLinks = [
    { href: "/sites/tubes", label: "Tubes" },
    { href: "/sites/cams", label: "Cams" },
    { href: "/sites/amateur", label: "Amateur" },
    { href: "/sites/hentai", label: "Hentai" },
];

const infoLinks = [
    { href: "/about", label: "About Us" },
    { href: "/submit", label: "Submit Site" },
    { href: "/contact", label: "Contact" },
    { href: "/privacy", label: "Privacy" },
];

export function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles.footerInner}>
                <div className={styles.footerTop}>
                    <div className={styles.brand}>
                        <div className={styles.brandLogo}>🔥 TheGoonDude</div>
                        <p className={styles.brandDesc}>
                            The internet&apos;s cutest NSFW directory. AI-powered reviews so you
                            can find the good stuff without the guesswork.
                        </p>
                    </div>

                    <div className={styles.footerSection}>
                        <h4>Browse</h4>
                        <div className={styles.footerLinks}>
                            {browseLinks.map((link) => (
                                <Link key={link.href} href={link.href} className={styles.footerLink}>
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className={styles.footerSection}>
                        <h4>Categories</h4>
                        <div className={styles.footerLinks}>
                            {categoryLinks.map((link) => (
                                <Link key={link.href} href={link.href} className={styles.footerLink}>
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className={styles.footerSection}>
                        <h4>Info</h4>
                        <div className={styles.footerLinks}>
                            {infoLinks.map((link) => (
                                <Link key={link.href} href={link.href} className={styles.footerLink}>
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                <div className={styles.footerBottom}>
                    <span className={styles.copyright}>
                        © 2026 TheGoonDude. All rights reserved.
                    </span>
                    <span className={styles.ageWarning}>
                        🔞 18+ Only - Adults Only Content
                    </span>
                </div>
            </div>
        </footer>
    );
}
