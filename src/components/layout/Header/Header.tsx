import Link from "next/link";
import { SearchBar } from "@/components/ui";
import styles from "./Header.module.css";

const navLinks = [
    { href: "/sites", label: "Browse" },
    { href: "/sites/new", label: "New" },
    { href: "/sites/top", label: "Top Rated" },
    { href: "/about", label: "About" },
];

export function Header() {
    return (
        <header className={styles.header}>
            <div className={styles.headerInner}>
                <Link href="/" className={styles.logo}>
                    <span className={styles.logoIcon}>🔥</span>
                    <span className={styles.logoText}>TheGoonDude</span>
                </Link>

                <SearchBar />

                <nav className={styles.nav}>
                    {navLinks.map((link) => (
                        <Link key={link.href} href={link.href} className={styles.navLink}>
                            {link.label}
                        </Link>
                    ))}
                </nav>

                <div className={styles.actions}>
                    <Link href="/submit" className={styles.submitBtn}>
                        + Submit Site
                    </Link>
                    <button className={styles.mobileMenu} aria-label="Menu">
                        ☰
                    </button>
                </div>
            </div>
        </header>
    );
}
