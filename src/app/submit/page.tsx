'use client';

import { useState } from 'react';
import { Button, Input, Textarea, Select } from '@/components';
import { isValidUrl, isValidSiteName, isValidDescription } from '@/lib/utils/validation';
import { submitSite } from '@/lib/firebase/submissions';
import styles from './page.module.css';

const CATEGORIES = [
    { value: 'tubes', label: 'Tubes' },
    { value: 'premium', label: 'Premium' },
    { value: 'cams', label: 'Cam Sites' },
    { value: 'amateur', label: 'Amateur' },
    { value: 'vr', label: 'VR' },
    { value: 'hentai', label: 'Hentai' },
    { value: 'dating', label: 'Dating' },
    { value: 'niche', label: 'Niche/Fetish' },
    { value: 'free', label: 'Free' },
];

interface FormData {
    url: string;
    name: string;
    description: string;
    category: string;
    email: string;
    terms: boolean;
}

interface FormErrors {
    url?: string;
    name?: string;
    description?: string;
    category?: string;
    email?: string;
    terms?: string;
}

export default function SubmitPage() {
    const [formData, setFormData] = useState<FormData>({
        url: '',
        name: '',
        description: '',
        category: '',
        email: '',
        terms: false,
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const updateField = (field: keyof FormData, value: string | boolean) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field as keyof FormErrors]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    };

    const validate = (): boolean => {
        const newErrors: FormErrors = {};

        if (!isValidUrl(formData.url)) {
            newErrors.url = 'Please enter a valid URL (https://...)';
        }
        if (!isValidSiteName(formData.name)) {
            newErrors.name = 'Site name must be 2-100 characters';
        }
        if (!isValidDescription(formData.description)) {
            newErrors.description = 'Description must be 20-500 characters';
        }
        if (!formData.category) {
            newErrors.category = 'Please select a category';
        }
        if (!formData.terms) {
            newErrors.terms = 'You must accept the terms';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setStatus('loading');
        setMessage('');

        const result = await submitSite({
            url: formData.url,
            name: formData.name,
            description: formData.description,
            category: formData.category,
            email: formData.email,
        });

        if (result.success) {
            setStatus('success');
            setMessage('Site submitted! We\'ll review it and get back to you.');
            setFormData({ url: '', name: '', description: '', category: '', email: '', terms: false });
        } else {
            setStatus('error');
            setMessage(result.error || 'Submission failed. Please try again.');
        }
    };

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <h1 className={styles.title}>💖 Submit Your Site</h1>
                <p className={styles.subtitle}>
                    Get your site reviewed by our AI and featured in the directory
                </p>
                <span className={styles.price}>$20 one-time fee</span>
            </header>

            {message && (
                <div className={`${styles.alert} ${status === 'success' ? styles.alertSuccess : styles.alertError}`}>
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
                <section className={styles.formSection}>
                    <h2 className={styles.sectionTitle}>📝 Site Details</h2>
                    <div className={styles.fields}>
                        <Input
                            label="Site URL"
                            name="url"
                            type="url"
                            value={formData.url}
                            onChange={(v) => updateField('url', v)}
                            placeholder="https://example.com"
                            required
                            error={errors.url}
                            hint="Must be a valid https:// URL"
                        />
                        <Input
                            label="Site Name"
                            name="name"
                            value={formData.name}
                            onChange={(v) => updateField('name', v)}
                            placeholder="Example Site"
                            required
                            maxLength={100}
                            error={errors.name}
                        />
                        <Textarea
                            label="Description"
                            name="description"
                            value={formData.description}
                            onChange={(v) => updateField('description', v)}
                            placeholder="Tell us what makes this site great..."
                            required
                            minLength={20}
                            maxLength={500}
                            error={errors.description}
                            hint="Minimum 20 characters"
                        />
                        <Select
                            label="Category"
                            name="category"
                            value={formData.category}
                            onChange={(v) => updateField('category', v)}
                            options={CATEGORIES}
                            placeholder="Select a category"
                            required
                            error={errors.category}
                        />
                    </div>
                </section>

                <section className={styles.formSection}>
                    <h2 className={styles.sectionTitle}>📧 Contact</h2>
                    <Input
                        label="Email (optional)"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={(v) => updateField('email', v)}
                        placeholder="you@example.com"
                        hint="We'll notify you when your review is published"
                    />
                </section>

                <section className={styles.formSection}>
                    <label className={styles.terms}>
                        <input
                            type="checkbox"
                            checked={formData.terms}
                            onChange={(e) => updateField('terms', e.target.checked)}
                            className={styles.checkbox}
                        />
                        <span className={styles.termsText}>
                            I confirm this site is 18+ only and I have the right to submit it.
                            I agree to the <a href="/terms" className={styles.termsLink}>Terms of Service</a>.
                        </span>
                    </label>
                    {errors.terms && <span className={styles.alert + ' ' + styles.alertError}>{errors.terms}</span>}
                </section>

                <div className={styles.actions}>
                    <Button
                        type="submit"
                        size="lg"
                        disabled={status === 'loading'}
                        className={styles.submitBtn}
                    >
                        {status === 'loading' ? 'Submitting...' : 'Submit Site for $20 →'}
                    </Button>
                    <p className={styles.note}>
                        Payment processing coming soon. Sites are queued for review.
                    </p>
                </div>
            </form>
        </div>
    );
}
