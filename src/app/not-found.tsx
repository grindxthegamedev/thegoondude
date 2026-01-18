import Link from 'next/link';
import { Button } from '@/components';
import styles from './not-found.module.css';

export default function NotFound() {
    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <span className={styles.emoji}>🔥</span>
                <h1 className={styles.title}>404</h1>
                <h2 className={styles.subtitle}>Page Not Found</h2>
                <p className={styles.description}>
                    Oops! The page you&apos;re looking for doesn&apos;t exist or has been moved.
                </p>
                <div className={styles.actions}>
                    <Button href="/" size="lg">Go Home</Button>
                    <Button href="/sites" variant="secondary">Browse Sites</Button>
                </div>
            </div>
        </div>
    );
}
