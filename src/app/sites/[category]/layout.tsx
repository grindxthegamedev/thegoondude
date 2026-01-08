import type { Metadata } from 'next';

interface CategoryLayoutProps {
    children: React.ReactNode;
    params: Promise<{ category: string }>;
}

const CATEGORY_META: Record<string, { title: string; description: string }> = {
    tubes: {
        title: 'Best Tube Sites',
        description: 'Top-rated free tube sites with millions of videos.',
    },
    premium: {
        title: 'Premium Sites',
        description: 'High-quality premium adult content worth paying for.',
    },
    cams: {
        title: 'Cam Sites',
        description: 'Live cam sites with thousands of models online 24/7.',
    },
    top: {
        title: 'Top Rated Sites',
        description: 'The highest rated adult sites in our directory.',
    },
    new: {
        title: 'New Sites',
        description: 'Fresh additions to the TheGoonDude directory.',
    },
};

export async function generateMetadata({ params }: CategoryLayoutProps): Promise<Metadata> {
    const { category } = await params;
    const meta = CATEGORY_META[category] || {
        title: `${category.charAt(0).toUpperCase() + category.slice(1)} Sites`,
        description: `Browse ${category} adult sites on TheGoonDude.`,
    };

    return {
        title: `${meta.title} | TheGoonDude`,
        description: meta.description,
    };
}

export default function CategoryLayout({ children }: CategoryLayoutProps) {
    return children;
}
