import styles from "./Rating.module.css";

interface RatingProps {
    score: number; // 0-10
    showScore?: boolean;
    showCount?: boolean;
    count?: number;
    size?: "sm" | "md" | "lg";
    className?: string;
}

export function Rating({
    score,
    showScore = true,
    showCount = false,
    count = 0,
    size = "md",
    className = "",
}: RatingProps) {
    // Convert 0-10 to 0-5 stars
    const starRating = score / 2;
    const fullStars = Math.floor(starRating);
    const hasHalf = starRating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

    const classes = [styles.rating, styles[size], className]
        .filter(Boolean)
        .join(" ");

    return (
        <div className={classes}>
            <div className={styles.stars}>
                {/* Full stars */}
                {Array.from({ length: fullStars }).map((_, i) => (
                    <span key={`full-${i}`} className={`${styles.star} ${styles.starFilled}`}>
                        ★
                    </span>
                ))}
                {/* Half star */}
                {hasHalf && (
                    <span className={`${styles.star} ${styles.starHalf}`}>☆</span>
                )}
                {/* Empty stars */}
                {Array.from({ length: emptyStars }).map((_, i) => (
                    <span key={`empty-${i}`} className={styles.star}>
                        ☆
                    </span>
                ))}
            </div>
            {showScore && <span className={styles.score}>{(score ?? 0).toFixed(1)}</span>}
            {showCount && count > 0 && (
                <span className={styles.count}>({count})</span>
            )}
        </div>
    );
}
