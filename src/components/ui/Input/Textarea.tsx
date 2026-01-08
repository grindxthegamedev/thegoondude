import styles from './Input.module.css';

interface TextareaProps {
    label: string;
    name: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
    error?: string;
    hint?: string;
    maxLength?: number;
    minLength?: number;
    rows?: number;
    disabled?: boolean;
}

export function Textarea({
    label,
    name,
    value,
    onChange,
    placeholder,
    required = false,
    error,
    hint,
    maxLength = 500,
    minLength,
    rows = 4,
    disabled = false,
}: TextareaProps) {
    const charCount = value.length;
    const showCharCount = charCount > maxLength * 0.5;
    const charCountClass = charCount > maxLength
        ? styles.error
        : charCount > maxLength * 0.9
            ? styles.warning
            : '';

    return (
        <div className={styles.input}>
            <label htmlFor={name} className={styles.label}>
                {label}
                {required && <span className={styles.required}>*</span>}
            </label>
            <textarea
                id={name}
                name={name}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={`${styles.field} ${styles.textarea} ${error ? styles.error : ''}`}
                disabled={disabled}
                maxLength={maxLength}
                minLength={minLength}
                rows={rows}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>
                    {error && <span className={styles.errorText}>{error}</span>}
                    {hint && !error && <span className={styles.hint}>{hint}</span>}
                </span>
                {showCharCount && (
                    <span className={`${styles.charCount} ${charCountClass}`}>
                        {charCount}/{maxLength}
                    </span>
                )}
            </div>
        </div>
    );
}
