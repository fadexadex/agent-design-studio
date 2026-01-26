/**
 * Skills Router
 * 
 * A lightweight semantic router that selects relevant Remotion skills
 * based on user prompt analysis. Optimizes for speed and context efficiency.
 */

import * as fs from 'fs';
import * as path from 'path';
import { SkillsIndex, SkillRule, SkillsContext, RouterOptions } from './skillsIndex';

// Approximate tokens per character (conservative estimate for code)
const CHARS_PER_TOKEN = 3.5;

// Stop words to filter out during tokenization
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
  'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought',
  'used', 'it', 'its', 'this', 'that', 'these', 'those', 'i', 'you', 'he',
  'she', 'we', 'they', 'what', 'which', 'who', 'whom', 'where', 'when',
  'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most',
  'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same',
  'so', 'than', 'too', 'very', 'just', 'also', 'now', 'here', 'there',
  'make', 'want', 'create', 'use', 'using', 'video', 'animation', 'brand'
]);

export class SkillsRouter {
  private index: SkillsIndex;
  private skillContents: Map<string, string> = new Map();
  private exampleContents: Map<string, string> = new Map();
  private skillsDir: string;
  private initialized: boolean = false;

  constructor(skillsDir?: string) {
    this.skillsDir = skillsDir || path.join(process.cwd(), 'server', 'agent', 'skills');
    this.index = { coreRules: [], availablePackages: [], featureRules: [] };
  }

  /**
   * Initialize the router - load index and preload skill contents
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load the index
      const indexPath = path.join(this.skillsDir, 'index.json');
      const indexContent = await fs.promises.readFile(indexPath, 'utf-8');
      this.index = JSON.parse(indexContent);

      // Preload all skill contents
      await this.preloadSkillContents();
      
      this.initialized = true;
      console.log(`[SkillsRouter] Initialized with ${this.index.featureRules.length} feature rules`);
    } catch (error) {
      console.error('[SkillsRouter] Failed to initialize:', error);
      // Use empty defaults if loading fails
      this.index = { 
        coreRules: ['common-pitfalls'], 
        availablePackages: ['remotion'], 
        featureRules: [] 
      };
      this.initialized = true;
    }
  }

  /**
   * Preload all skill markdown files into memory for fast access
   */
  private async preloadSkillContents(): Promise<void> {
    const rulesDir = path.join(this.skillsDir, 'rules');

    // Load core rules
    for (const coreId of this.index.coreRules) {
      await this.loadSkillContent(coreId, rulesDir);
    }

    // Load feature rules and their examples
    for (const rule of this.index.featureRules) {
      await this.loadSkillContent(rule.id, rulesDir);
      
      // Load examples if specified
      if (rule.examples) {
        for (const examplePath of rule.examples) {
          const fullPath = path.join(rulesDir, examplePath);
          try {
            const content = await fs.promises.readFile(fullPath, 'utf-8');
            this.exampleContents.set(examplePath, content);
          } catch {
            console.warn(`[SkillsRouter] Could not load example: ${examplePath}`);
          }
        }
      }
    }
  }

  /**
   * Load a single skill's markdown content
   */
  private async loadSkillContent(skillId: string, rulesDir: string): Promise<void> {
    const filePath = path.join(rulesDir, `${skillId}.md`);
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      // Strip YAML frontmatter if present
      const stripped = content.replace(/^---[\s\S]*?---\n*/m, '');
      this.skillContents.set(skillId, stripped.trim());
    } catch {
      console.warn(`[SkillsRouter] Could not load skill: ${skillId}`);
    }
  }

  /**
   * Main entry point - get optimized context for a user prompt
   */
  async getContextForPrompt(
    userPrompt: string,
    style: string,
    options: RouterOptions = {}
  ): Promise<SkillsContext> {
    await this.initialize();

    const {
      maxTokens = 4000,
      maxFeatureRules = this.index.maxFeatureRules || 5,
      forceInclude = [],
      forceExclude = []
    } = options;

    // 1. Tokenize the prompt and style
    const tokens = this.tokenize(`${userPrompt} ${style}`);

    // 2. Score and match skills
    const scoredSkills = this.scoreSkills(tokens, forceInclude, forceExclude);

    // 3. Filter by available packages
    const availableSkills = scoredSkills.filter(({ rule }) =>
      !rule.requires || 
      rule.requires.every(pkg => this.index.availablePackages.includes(pkg))
    );

    // 4. Select top skills within token budget
    const selectedSkills = this.selectWithinBudget(
      availableSkills,
      maxFeatureRules,
      maxTokens
    );

    // 5. Assemble the context
    const context = this.assembleContext(selectedSkills);

    return context;
  }

  /**
   * Tokenize a string into searchable keywords
   */
  private tokenize(text: string): string[] {
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
   * Score skills based on keyword matches
   */
  private scoreSkills(
    tokens: string[],
    forceInclude: string[],
    forceExclude: string[]
  ): Array<{ rule: SkillRule; score: number }> {
    const results: Array<{ rule: SkillRule; score: number }> = [];

    for (const rule of this.index.featureRules) {
      // Skip excluded rules
      if (forceExclude.includes(rule.id)) continue;

      // Force-included rules get max score
      if (forceInclude.includes(rule.id)) {
        results.push({ rule, score: 1000 });
        continue;
      }

      let score = 0;
      for (const token of tokens) {
        for (const keyword of rule.keywords) {
          // Exact match: high score
          if (keyword === token) {
            score += 5;
          }
          // Keyword contains token (e.g., "transitions" contains "transition")
          else if (keyword.includes(token) && token.length >= 4) {
            score += 3;
          }
          // Token contains keyword (e.g., "bouncy" contains "bounce")
          else if (token.includes(keyword) && keyword.length >= 4) {
            score += 2;
          }
          // Partial overlap with edit distance consideration
          else if (this.fuzzyMatch(token, keyword)) {
            score += 1;
          }
        }
      }

      // Add priority as tiebreaker
      if (score > 0) {
        score += rule.priority * 0.1;
        results.push({ rule, score });
      }
    }

    // Sort by score descending
    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * Simple fuzzy matching for near-matches
   */
  private fuzzyMatch(a: string, b: string): boolean {
    if (Math.abs(a.length - b.length) > 2) return false;
    const shorter = a.length < b.length ? a : b;
    const longer = a.length < b.length ? b : a;
    
    // Check if shorter is a substantial substring of longer
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
   * Select skills that fit within the token budget
   */
  private selectWithinBudget(
    scoredSkills: Array<{ rule: SkillRule; score: number }>,
    maxRules: number,
    maxTokens: number
  ): SkillRule[] {
    const selected: SkillRule[] = [];
    
    // Calculate the total budget in characters
    const totalBudget = maxTokens * CHARS_PER_TOKEN;
    
    // Calculate core rules size (these are always included)
    let coreSize = 0;
    for (const coreId of this.index.coreRules) {
      const content = this.skillContents.get(coreId) || '';
      coreSize += content.length;
    }

    // Remaining budget for feature rules (with some buffer for structure)
    const featureBudget = totalBudget - coreSize - 500; // 500 char buffer for headers etc
    let featureChars = 0;

    for (const { rule } of scoredSkills) {
      if (selected.length >= maxRules) break;

      const content = this.skillContents.get(rule.id) || '';
      
      // First try without examples to see if the rule fits
      const baseSize = content.length;
      
      if (featureChars + baseSize <= featureBudget) {
        // Rule fits, now check if we have room for examples
        let examplesSize = 0;
        if (rule.examples) {
          for (const exPath of rule.examples) {
            const example = this.exampleContents.get(exPath);
            if (example) examplesSize += example.length;
          }
        }
        
        // Include examples only if they fit within budget
        const includeExamples = featureChars + baseSize + examplesSize <= featureBudget;
        const ruleWithExamples = includeExamples ? { ...rule } : { ...rule, examples: undefined };
        
        selected.push(ruleWithExamples);
        featureChars += baseSize + (includeExamples ? examplesSize : 0);
      }
    }

    return selected;
  }

  /**
   * Assemble the final context string
   */
  private assembleContext(selectedSkills: SkillRule[]): SkillsContext {
    const sections: string[] = [];
    const includedSkills: string[] = [...this.index.coreRules];

    // Header
    sections.push('='.repeat(60));
    sections.push('REMOTION SKILLS REFERENCE (Follow these rules strictly)');
    sections.push('='.repeat(60));

    // Core rules section
    sections.push('\n## MANDATORY RULES\n');
    for (const coreId of this.index.coreRules) {
      const content = this.skillContents.get(coreId);
      if (content) {
        sections.push(`### ${coreId.toUpperCase().replace(/-/g, ' ')}\n`);
        sections.push(content);
        sections.push('');
      }
    }

    // Feature rules section
    if (selectedSkills.length > 0) {
      sections.push('\n## RELEVANT TECHNIQUES\n');
      
      for (const rule of selectedSkills) {
        includedSkills.push(rule.id);
        const content = this.skillContents.get(rule.id);
        
        if (content) {
          sections.push(`### ${rule.id.toUpperCase().replace(/-/g, ' ')}`);
          if (rule.description) {
            sections.push(`*${rule.description}*\n`);
          }
          sections.push(content);

          // Inline examples if available
          if (rule.examples) {
            for (const exPath of rule.examples) {
              const example = this.exampleContents.get(exPath);
              if (example) {
                const exName = path.basename(exPath, '.tsx');
                sections.push(`\n**Working Example (${exName}):**`);
                sections.push('```tsx');
                sections.push(example.trim());
                sections.push('```');
              }
            }
          }
          sections.push('');
        }
      }
    }

    // Package allowlist
    sections.push('\n## AVAILABLE IMPORTS\n');
    sections.push('You may ONLY use these packages (they are pre-installed):');
    for (const pkg of this.index.availablePackages) {
      sections.push(`- \`${pkg}\``);
    }
    sections.push('\n**DO NOT** import from any other packages - they will cause errors.');

    const content = sections.join('\n');
    const estimatedTokens = Math.ceil(content.length / CHARS_PER_TOKEN);

    return {
      content,
      includedSkills,
      allowedPackages: this.index.availablePackages,
      estimatedTokens
    };
  }

  /**
   * Get the list of available packages
   */
  getAvailablePackages(): string[] {
    return this.index.availablePackages;
  }

  /**
   * Check if a package is available
   */
  isPackageAvailable(packageName: string): boolean {
    return this.index.availablePackages.includes(packageName);
  }
}

// Singleton instance for reuse
let routerInstance: SkillsRouter | null = null;

export function getSkillsRouter(skillsDir?: string): SkillsRouter {
  if (!routerInstance) {
    routerInstance = new SkillsRouter(skillsDir);
  }
  return routerInstance;
}

export default SkillsRouter;
