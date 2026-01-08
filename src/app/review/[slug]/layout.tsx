import type { Metadata } from 'next';

interface ReviewLayoutProps {
    children: React.ReactNode;
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ReviewLayoutProps): Promise<Metadata> {
    const { slug } = await params;

    // Format slug for display
    const title = slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    return {
        title: `${title} Review | TheGoonDude`,
        description: `Read our AI-powered review of ${title}. Honest ratings, pros, cons, and verdict.`,
        openGraph: {
            title: `${title} Review`,
            description: `Check out our detailed review of ${title}`,
            type: 'article',
        },
    };
}

export default function ReviewLayout({ children }: ReviewLayoutProps) {
    return children;
}
