/**
 * Category Configuration
 * Centralized category metadata for the 411 directory
 */

export interface Category {
    id: string;
    label: string;
    icon: string;
    description: string;
    slug: string;
}

export const CATEGORIES: Category[] = [
    { id: 'tubes', label: 'Tubes', icon: '📺', description: 'Free streaming sites', slug: 'tubes' },
    { id: 'premium', label: 'Premium', icon: '💎', description: 'Paid HD content', slug: 'premium' },
    { id: 'cams', label: 'Cam Sites', icon: '🎥', description: 'Live performers', slug: 'cams' },
    { id: 'amateur', label: 'Amateur', icon: '🏠', description: 'Homemade content', slug: 'amateur' },
    { id: 'onlyfans', label: 'OnlyFans Alt', icon: '🔥', description: 'Creator platforms', slug: 'onlyfans' },
    { id: 'vr', label: 'VR/Interactive', icon: '🥽', description: 'Immersive experiences', slug: 'vr' },
    { id: 'hentai', label: 'Hentai', icon: '🎨', description: 'Animated content', slug: 'hentai' },
    { id: 'dating', label: 'Dating/Hookup', icon: '💘', description: 'Meet real people', slug: 'dating' },
    { id: 'niche', label: 'Niche/Fetish', icon: '🔗', description: 'Specialized content', slug: 'niche' },
    { id: 'games', label: 'Games', icon: '🎮', description: 'Adult gaming', slug: 'games' },
    { id: 'free', label: 'Free Sites', icon: '🆓', description: 'No payment required', slug: 'free' },
];

export function getCategoryBySlug(slug: string): Category | undefined {
    return CATEGORIES.find(c => c.slug === slug);
}
