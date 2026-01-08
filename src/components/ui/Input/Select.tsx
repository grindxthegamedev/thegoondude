import styles from './Input.module.css';

interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps {
    label: string;
    name: string;
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    required?: boolean;
    error?: string;
    disabled?: boolean;
}

export function Select({
    label,
    name,
    value,
    onChange,
    options,
    placeholder = 'Select an option',
    required = false,
    error,
    disabled = false,
}: SelectProps) {
    return (
        <div className={styles.input}>
            <label htmlFor={name} className={styles.label}>
                {label}
                {required && <span className={styles.required}>*</span>}
            </label>
            <select
                id={name}
                name={name}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`${styles.field} ${styles.select} ${error ? styles.error : ''}`}
                disabled={disabled}
            >
                <option value="">{placeholder}</option>
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
            {error && <span className={styles.errorText}>{error}</span>}
        </div>
    );
}
