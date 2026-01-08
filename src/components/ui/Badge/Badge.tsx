import styles from "./Badge.module.css";

type BadgeVariant = "default" | "primary" | "hot" | "new" | "premium" | "free";
type BadgeSize = "sm" | "md" | "lg";

interface BadgeProps {
    variant?: BadgeVariant;
    size?: BadgeSize;
    children: React.ReactNode;
    className?: string;
}

export function Badge({
    variant = "default",
    size = "md",
    children,
    className = "",
}: BadgeProps) {
    const classes = [
        styles.badge,
        styles[variant],
        size !== "md" && styles[size],
        className,
    ]
        .filter(Boolean)
        .join(" ");

    return <span className={classes}>{children}</span>;
}
