/**
 * ErrorBoundary Component
 * Catches React errors and displays fallback UI
 */

'use client';

import { Component, ReactNode } from 'react';
import styles from './ErrorBoundary.module.css';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
        // TODO: Send to error reporting service
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: undefined });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className={styles.container}>
                    <div className={styles.content}>
                        <span className={styles.icon}>😵</span>
                        <h2 className={styles.title}>Something went wrong</h2>
                        <p className={styles.message}>
                            Don&apos;t worry, it&apos;s not you. Our code just had a moment.
                        </p>
                        <button className={styles.retryBtn} onClick={this.handleRetry}>
                            Try Again
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
