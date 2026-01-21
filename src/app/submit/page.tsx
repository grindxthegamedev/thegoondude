'use client';

import { useState } from 'react';
import { Button, Input, Textarea, Select } from '@/components';
import { isValidUrl, isValidSiteName, isValidDescription } from '@/lib/utils/validation';
import { submitSite, checkBacklinkEligibility, BacklinkCheckResult } from '@/lib/firebase/submissions';
import { CATEGORIES as APP_CATEGORIES } from '@/lib/categories';
import styles from './page.module.css';

const CATEGORIES = APP_CATEGORIES.map(cat => ({
    value: cat.id,
    label: cat.label
}));

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
    terms?: string;
}

export default function SubmitPage() {
    const [formData, setFormData] = useState<FormData>({
        url: '', name: '', description: '', category: '', email: '', terms: false,
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [status, setStatus] = useState<'idle' | 'checking' | 'eligible' | 'success' | 'error'>('idle');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [backlinkResult, setBacklinkResult] = useState<BacklinkCheckResult | null>(null);

    const updateField = (field: keyof FormData, value: string | boolean) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field as keyof FormErrors]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
        // Reset eligibility if URL changes
        if (field === 'url' && status === 'eligible') {
            setStatus('idle');
            setBacklinkResult(null);
        }
    };

    const validateUrl = (): boolean => {
        if (!isValidUrl(formData.url)) {
            setErrors({ url: 'Please enter a valid URL (https://...)' });
            return false;
        }
        return true;
    };

    const validateAll = (): boolean => {
        const newErrors: FormErrors = {};
        if (!isValidUrl(formData.url)) newErrors.url = 'Please enter a valid URL';
        if (!isValidSiteName(formData.name)) newErrors.name = 'Site name must be 2-100 characters';
        if (!isValidDescription(formData.description)) newErrors.description = 'Description must be 20-500 characters';
        if (!formData.category) newErrors.category = 'Please select a category';
        if (!formData.terms) newErrors.terms = 'You must accept the terms';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleCheckBacklink = async () => {
        if (!validateUrl()) return;

        setStatus('checking');
        setMessage('');
        try {
            const result = await checkBacklinkEligibility(formData.url);
            setBacklinkResult(result);
            if (result.eligible) {
                setStatus('eligible');
                setMessage(result.message);
            } else {
                setStatus('error');
                setMessage(result.message);
            }
        } catch (err) {
            setStatus('error');
            setMessage('An unexpected error occurred. Please try again.');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateAll() || status !== 'eligible') return;

        setIsSubmitting(true);
        const result = await submitSite({
            url: formData.url, name: formData.name, description: formData.description,
            category: formData.category, email: formData.email,
        });

        if (result.success) {
            setStatus('success');
            setMessage('Site submitted! We\'ll review it and get back to you.');
            setFormData({ url: '', name: '', description: '', category: '', email: '', terms: false });
            setBacklinkResult(null);
        } else {
            setStatus('error');
            setMessage(result.error || 'Submission failed. Please try again.');
        }
        setIsSubmitting(false);
    };

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <h1 className={styles.title}>🔗 Submit Your Site</h1>
                <p className={styles.subtitle}>
                    Get your site reviewed by our AI and featured in the directory
                </p>
                <span className={styles.price}>Free with backlink</span>
            </header>

            {/* Backlink Instructions */}
            <section className={styles.backlinkInfo}>
                <h2>📋 How It Works</h2>
                <ol>
                    <li>Add a link to <code>thegoondude.com</code> on your site</li>
                    <li>Click "Check Eligibility" below</li>
                    <li>Once verified, complete the form to submit</li>
                </ol>
                <p className={styles.backlinkExample}>
                    Example: <code>&lt;a href="https://thegoondude.com"&gt;Reviewed by TheGoonDude&lt;/a&gt;</code>
                </p>
            </section>

            {message && (
                <div className={`${styles.alert} ${status === 'success' || status === 'eligible' ? styles.alertSuccess : styles.alertError}`}>
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
                {/* Step 1: URL + Check */}
                <section className={styles.formSection}>
                    <h2 className={styles.sectionTitle}>Step 1: Verify Backlink</h2>
                    <Input
                        label="Site URL"
                        name="url"
                        type="url"
                        value={formData.url}
                        onChange={(v) => updateField('url', v)}
                        placeholder="https://yoursite.com"
                        required
                        error={errors.url}
                        hint="The page with your backlink to thegoondude.com"
                    />
                    <Button
                        type="button"
                        variant={status === 'eligible' ? 'secondary' : 'primary'}
                        onClick={handleCheckBacklink}
                        disabled={status === 'checking' || !formData.url}
                    >
                        {status === 'checking' ? 'Checking...' : status === 'eligible' ? '✓ Verified' : 'Check Eligibility'}
                    </Button>
                    {backlinkResult?.retryAfter && (
                        <p className={styles.note}>Rate limited. Try again in {backlinkResult.retryAfter}s</p>
                    )}
                </section>

                {/* Step 2: Details (only if eligible) */}
                {status === 'eligible' && (
                    <>
                        <section className={styles.formSection}>
                            <h2 className={styles.sectionTitle}>Step 2: Site Details</h2>
                            <div className={styles.fields}>
                                <Input label="Site Name" name="name" value={formData.name} onChange={(v) => updateField('name', v)} placeholder="Example Site" required maxLength={100} error={errors.name} />
                                <Textarea label="Description" name="description" value={formData.description} onChange={(v) => updateField('description', v)} placeholder="Tell us what makes this site great..." required minLength={20} maxLength={500} error={errors.description} hint="Minimum 20 characters" />
                                <Select label="Category" name="category" value={formData.category} onChange={(v) => updateField('category', v)} options={CATEGORIES} placeholder="Select a category" required error={errors.category} />
                                <Input label="Email (optional)" name="email" type="email" value={formData.email} onChange={(v) => updateField('email', v)} placeholder="you@example.com" hint="We'll notify you when published" />
                            </div>
                        </section>

                        <section className={styles.formSection}>
                            <label className={styles.terms}>
                                <input type="checkbox" checked={formData.terms} onChange={(e) => updateField('terms', e.target.checked)} className={styles.checkbox} />
                                <span className={styles.termsText}>
                                    I confirm this site is 18+ only. I agree to the <a href="/terms" className={styles.termsLink}>Terms of Service</a>.
                                </span>
                            </label>
                            {errors.terms && <span className={styles.alertError}>{errors.terms}</span>}
                        </section>

                        <div className={styles.actions}>
                            <Button type="submit" size="lg" disabled={isSubmitting}>
                                {isSubmitting ? 'Submitting...' : 'Submit Site →'}
                            </Button>
                        </div>
                    </>
                )}
            </form>
        </div>
    );
}
