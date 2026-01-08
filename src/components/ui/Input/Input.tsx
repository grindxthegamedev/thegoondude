import styles from './Input.module.css';

interface InputProps {
    label: string;
    name: string;
    type?: 'text' | 'url' | 'email' | 'password';
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
    error?: string;
    hint?: string;
    maxLength?: number;
    disabled?: boolean;
}

export function Input({
    label,
    name,
    type = 'text',
    value,
    onChange,
    placeholder,
    required = false,
    error,
    hint,
    maxLength,
    disabled = false,
}: InputProps) {
    const showCharCount = maxLength && value.length > maxLength * 0.7;
    const charCountClass = value.length > (maxLength || 0)
        ? styles.error
        : value.length > (maxLength || 0) * 0.9
            ? styles.warning
            : '';

    return (
        <div className={styles.input}>
            <label htmlFor={name} className={styles.label}>
                {label}
                {required && <span className={styles.required}>*</span>}
            </label>
            <input
                id={name}
                name={name}
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={`${styles.field} ${error ? styles.error : ''}`}
                disabled={disabled}
                maxLength={maxLength}
            />
            {error && <span className={styles.errorText}>{error}</span>}
            {hint && !error && <span className={styles.hint}>{hint}</span>}
            {showCharCount && maxLength && (
                <span className={`${styles.charCount} ${charCountClass}`}>
                    {value.length}/{maxLength}
                </span>
            )}
        </div>
    );
}
