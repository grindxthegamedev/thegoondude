/**
 * SearchBar Component
 * Live search with debounced API calls and dropdown results
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/lib/hooks';
import { searchSites } from '@/lib/firebase/sites';
import type { Site } from '@/lib/types';
import styles from './SearchBar.module.css';

interface SearchBarProps {
    placeholder?: string;
}

export function SearchBar({ placeholder = 'Search sites...' }: SearchBarProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Site[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const debouncedQuery = useDebounce(query, 300);
    const router = useRouter();
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Live search on debounced query change
    useEffect(() => {
        async function performSearch() {
            if (debouncedQuery.length < 2) {
                setResults([]);
                setIsOpen(false);
                return;
            }
            setLoading(true);
            try {
                const sites = await searchSites(debouncedQuery);
                setResults(sites.slice(0, 5));
                setIsOpen(true);
            } catch (err) {
                console.error('Search failed:', err);
            } finally {
                setLoading(false);
            }
        }
        performSearch();
    }, [debouncedQuery]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`/sites?q=${encodeURIComponent(query.trim())}`);
            setIsOpen(false);
        }
    };

    return (
        <div ref={wrapperRef} className={styles.wrapper}>
            <form onSubmit={handleSubmit} className={styles.form}>
                <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => results.length > 0 && setIsOpen(true)}
                    placeholder={placeholder}
                    className={styles.input}
                />
                <button type="submit" className={styles.btn}>
                    {loading ? '...' : '🔍'}
                </button>
            </form>

            {isOpen && results.length > 0 && (
                <div className={styles.dropdown}>
                    {results.map((site) => (
                        <Link
                            key={site.id}
                            href={`/review/${site.slug}`}
                            className={styles.result}
                            onClick={() => setIsOpen(false)}
                        >
                            <span className={styles.resultName}>{site.name}</span>
                            <span className={styles.resultCategory}>{site.category}</span>
                        </Link>
                    ))}
                    <Link
                        href={`/sites?q=${encodeURIComponent(query)}`}
                        className={styles.viewAll}
                        onClick={() => setIsOpen(false)}
                    >
                        View all results →
                    </Link>
                </div>
            )}
        </div>
    );
}
