/**
 * JsonLd Component
 * Renders JSON-LD structured data in a script tag
 */

interface JsonLdProps {
    data: object;
}

export function JsonLd({ data }: JsonLdProps) {
    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
    );
}
