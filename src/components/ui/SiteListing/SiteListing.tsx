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
    isNew?: boolean;
    isPremium?: boolean;
    isFree?: boolean;
}

interface SiteListingProps {
    site: SiteData;
    rank?: number;
}

export function SiteListing({ site, rank }: SiteListingProps) {
    const isTop3 = rank !== undefined && rank <= 3;

    return (
        <article className={styles.listing}>
            {rank !== undefined && (
                <div className={`${styles.rank} ${isTop3 ? styles.top3 : ""}`}>
                    #{rank}
                </div>
            )}

            <div className={styles.thumb}>
                {site.thumbnail ? (
                    <img
                        src={site.thumbnail}
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
                        {site.isNew && <Badge variant="new">New</Badge>}
                        {site.isPremium && <Badge variant="premium">Premium</Badge>}
                        {site.isFree && <Badge variant="free">Free</Badge>}
                    </div>
                </div>
                <p className={styles.description}>{site.description}</p>
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
                Visit →
            </a>
        </article>
    );
}
