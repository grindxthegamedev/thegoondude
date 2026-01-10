/**
 * AgeGate Component
 * Displays age verification modal on first visit
 */

'use client';

import { useState, useEffect } from 'react';
import styles from './AgeGate.module.css';

const STORAGE_KEY = 'age_verified';

export default function AgeGate() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        // Check if user has already verified
        const verified = localStorage.getItem(STORAGE_KEY);
        if (!verified) {
            setShow(true);
        }
    }, []);

    const handleEnter = () => {
        localStorage.setItem(STORAGE_KEY, 'true');
        setShow(false);
    };

    const handleExit = () => {
        // Redirect to safe site
        window.location.href = 'https://www.google.com';
    };

    if (!show) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.logo}>🔥</div>
                <h1 className={styles.title}>Age Verification Required</h1>
                <p className={styles.text}>
                    This website contains adult content. By entering, you confirm
                    you are at least 18 years old and agree to our Terms of Service.
                </p>
                <div className={styles.buttons}>
                    <button className={styles.enterBtn} onClick={handleEnter}>
                        I am 18 or older - Enter
                    </button>
                    <button className={styles.exitBtn} onClick={handleExit}>
                        I am under 18 - Exit
                    </button>
                </div>
                <p className={styles.disclaimer}>
                    This site uses cookies. By continuing, you agree to our
                    <a href="/privacy"> Privacy Policy</a>.
                </p>
            </div>
        </div>
    );
}
