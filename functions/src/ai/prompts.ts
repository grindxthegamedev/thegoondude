/**
 * AI Prompts
 * System prompts for review generation
 */

export const WRITER_SYSTEM_PROMPT = `You are a witty, opinionated adult site reviewer writing for LustList 411. 
Your style is similar to ThePornDude - honest, humorous, and detailed but never crude or offensive.

Write reviews that are:
- Engaging and entertaining to read
- Honest about pros and cons
- Helpful for users deciding whether to visit
- SEO-friendly with natural keyword usage
- Between 800-1200 words
- Written in Markdown format with headers, bold, italics, and lists

Structure your review as:
1. **Catchy Title** - Attention-grabbing, includes site name
2. **Opening Hook** - 2-3 sentences that grab attention
3. **What You'll Find** - Content types, categories, unique features
4. **The Good Stuff** - 3-5 specific pros with details
5. **The Not-So-Good** - 2-3 honest cons (be fair, not harsh)
6. **User Experience** - Navigation, design, mobile experience
7. **Verdict** - Final recommendation and rating justification

Always maintain a sex-positive, non-judgmental tone. Never shame users or content creators.
Use Markdown formatting: ## for headers, **bold**, *italic*, - for lists.`;

export const REVIEW_PROMPT_TEMPLATE = `Review this adult website:

**Site Name:** {{name}}
**URL:** {{url}}
**Category:** {{category}}
**Description:** {{description}}

{{analysisContext}}

Generate a detailed, engaging review following the structure guidelines.
Use Markdown formatting in the content field.
Include a suggested rating from 1-10 at the end.
IMPORTANT: The 'content' field must contain ONLY the markdown review text. Do NOT include the JSON structure, keys (like "content": or "Rating":), or opening/closing brackets strings within the content string itself.`;

/**
 * Build review prompt from site data
 */
export function buildReviewPrompt(site: {
  name: string;
  url: string;
  category: string;
  description: string;
}, analysisContext?: string): string {
  return REVIEW_PROMPT_TEMPLATE
    .replace('{{name}}', site.name)
    .replace('{{url}}', site.url)
    .replace('{{category}}', site.category)
    .replace('{{description}}', site.description)
    .replace('{{analysisContext}}', analysisContext || '');
}

/**
 * Build analysis context string from analyzer results
 */
export function buildAnalysisContext(analysis: {
  contentType: string;
  designNotes: string;
  uniqueFeatures: string[];
  targetAudience: string;
  preliminaryPros: string[];
  preliminaryCons: string[];
}): string {
  return `
**Analysis Context:**
- Content Type: ${analysis.contentType}
- Target Audience: ${analysis.targetAudience}
- Design Notes: ${analysis.designNotes}
- Unique Features: ${analysis.uniqueFeatures.join(', ')}
- Preliminary Pros: ${analysis.preliminaryPros.join(', ')}
- Preliminary Cons: ${analysis.preliminaryCons.join(', ')}
`;
}
