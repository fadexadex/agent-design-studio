/**
 * Shared Router Utilities
 *
 * Common tokenization, fuzzy matching, and scoring logic used by both
 * SkillsRouter and ComponentsRouter.
 */

// Approximate tokens per character (conservative estimate for code)
export const CHARS_PER_TOKEN = 3.5;

/**
 * Stop words filtered out during tokenization.
 * These are common English words + domain terms that don't help distinguish intent.
 */
export const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
  'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought',
  'used', 'it', 'its', 'this', 'that', 'these', 'those', 'i', 'you', 'he',
  'she', 'we', 'they', 'what', 'which', 'who', 'whom', 'where', 'when',
  'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most',
  'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same',
  'so', 'than', 'too', 'very', 'just', 'also', 'now', 'here', 'there',
  'make', 'want', 'create', 'use', 'using', 'video', 'animation', 'brand',
  'show', 'display',
]);

/**
 * Tokenize a string into unique, lowercase keywords.
 * Filters stop words and tokens shorter than 3 characters.
 */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOP_WORDS.has(word))
    .reduce((unique, word) => {
      if (!unique.includes(word)) unique.push(word);
      return unique;
    }, [] as string[]);
}

/**
 * Simple fuzzy matching for near-matches between two strings.
 * Returns true if strings share a common prefix of 4+ chars and
 * are within 2 chars of each other in length.
 */
export function fuzzyMatch(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 2) return false;

  // Check if shorter is a substantial substring of longer
  const shorter = a.length < b.length ? a : b;
  const longer = a.length < b.length ? b : a;
  if (longer.includes(shorter) && shorter.length >= 4) return true;

  // Check common prefix (at least 4 chars)
  let commonPrefix = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] === b[i]) commonPrefix++;
    else break;
  }
  return commonPrefix >= 4;
}

/**
 * Score a token against a keyword list.
 * Returns the total match score.
 */
export function scoreTokenAgainstKeywords(
  token: string,
  keywords: string[],
): number {
  let score = 0;
  for (const keyword of keywords) {
    if (keyword === token) {
      score += 5; // Exact match
    } else if (keyword.includes(token) && token.length >= 3) {
      score += 3; // Keyword contains token
    } else if (token.includes(keyword) && keyword.length >= 4) {
      score += 2; // Token contains keyword
    } else if (fuzzyMatch(token, keyword)) {
      score += 1; // Fuzzy match
    }
  }
  return score;
}

/**
 * Load a file and strip YAML frontmatter (--- ... ---)
 */
export function stripFrontmatter(content: string): string {
  return content.replace(/^---[\s\S]*?---\n*/m, '').trim();
}

/**
 * Estimate token count for a string.
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}
