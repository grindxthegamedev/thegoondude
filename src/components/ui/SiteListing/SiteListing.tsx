import Link from "next/link";
import { Badge } from "../Badge";
import { Rating } from "../Rating";
import styles from "./SiteListing.module.css";

export interface SiteData {
    id: string;
    name: string;
    url: string;
    slug: string;
    description: string;
    category: string;
    rating: number;
    thumbnail?: string;
    faviconUrl?: string;
    isNew?: boolean;
    isPremium?: boolean;
    isFree?: boolean;
    crawlData?: {
        screenshotUrls?: string[];
        faviconUrl?: string;
    };
}

interface SiteListingProps {
    site: SiteData;
    rank?: number;
    compact?: boolean;
}

export function SiteListing({ site, rank, compact = false }: SiteListingProps) {
    const isTop3 = rank !== undefined && rank <= 3;

    // Extract thumbnail and favicon from crawlData if not at top level
    const thumbnail = site.thumbnail || site.crawlData?.screenshotUrls?.[0];
    const faviconUrl = site.faviconUrl || site.crawlData?.faviconUrl;

    return (
        <article className={`${styles.listing} ${compact ? styles.compact : ''}`}>
            {rank !== undefined && (
                <div className={`${styles.rank} ${isTop3 ? styles.top3 : ""}`}>
                    #{rank}
                </div>
            )}

            {faviconUrl && (
                <div className={styles.favicon}>
                    <img src={faviconUrl} alt="" className={styles.faviconImg} />
                </div>
            )}

            <div className={styles.thumb}>
                {thumbnail ? (
                    <img
                        src={thumbnail}
                        alt={site.name}
                        className={styles.thumbImg}
                    />
                ) : (
                    <div className={styles.thumbImg} />
                )}
            </div>

            <div className={styles.content}>
                <div className={styles.header}>
                    <Link href={`/review/${site.slug}`} className={styles.name}>
                        {site.name}
                    </Link>
                    <div className={styles.badges}>
                        {site.rating >= 9 && <Badge variant="hot">Hot</Badge>}
                        {site.isNew && <Badge variant="new">New</Badge>}
                    </div>
                </div>
                {!compact && <p className={styles.description}>{site.description}</p>}
                <div className={styles.meta}>
                    <Rating score={site.rating} size="sm" />
                    <span className={styles.category}>{site.category}</span>
                </div>
            </div>

            <a
                href={site.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.visitBtn}
            >
                {compact ? '→' : 'Visit →'}
            </a>
        </article>
    );
}
