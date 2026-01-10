'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from "next/link";
import styles from "./Header.module.css";

const navLinks = [
    { href: "/sites", label: "Browse" },
    { href: "/sites/new", label: "New" },
    { href: "/sites/top", label: "Top Rated" },
    { href: "/about", label: "About" },
];

export function Header() {
    const [query, setQuery] = useState('');
    const router = useRouter();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`/sites?q=${encodeURIComponent(query.trim())}`);
        }
    };

    return (
        <header className={styles.header}>
            <div className={styles.headerInner}>
                <Link href="/" className={styles.logo}>
                    <span className={styles.logoIcon}>🔥</span>
                    <span className={styles.logoText}>TheGoonDude</span>
                </Link>

                <form onSubmit={handleSearch} className={styles.searchForm}>
                    <input
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search sites..."
                        className={styles.searchInput}
                    />
                    <button type="submit" className={styles.searchBtn}>🔍</button>
                </form>

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

