import Link from "next/link";
import styles from "./Button.module.css";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonBaseProps {
    variant?: ButtonVariant;
    size?: ButtonSize;
    disabled?: boolean;
    fullWidth?: boolean;
    children: React.ReactNode;
    className?: string;
}

interface ButtonAsButton extends ButtonBaseProps {
    href?: never;
    onClick?: () => void;
    type?: "button" | "submit" | "reset";
}

interface ButtonAsLink extends ButtonBaseProps {
    href: string;
    onClick?: never;
    type?: never;
}

type ButtonProps = ButtonAsButton | ButtonAsLink;

export function Button({
    variant = "primary",
    size = "md",
    disabled = false,
    fullWidth = false,
    children,
    className = "",
    href,
    onClick,
    type = "button",
}: ButtonProps) {
    const classes = [
        styles.button,
        styles[variant],
        styles[size],
        disabled && styles.disabled,
        fullWidth && styles.fullWidth,
        className,
    ]
        .filter(Boolean)
        .join(" ");

    if (href) {
        return (
            <Link href={href} className={classes}>
                {children}
            </Link>
        );
    }

    return (
        <button
            type={type}
            className={classes}
            onClick={onClick}
            disabled={disabled}
        >
            {children}
        </button>
    );
}
