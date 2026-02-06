/**
 * Components Router
 *
 * Routes user prompts to relevant component documentation from the
 * remotion-components library using keyword matching.
 *
 * This mirrors the pattern of skillsRouter.ts but specifically handles
 * the reusable component library documentation.
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import {
  CHARS_PER_TOKEN,
  tokenize,
  scoreTokenAgainstKeywords,
  stripFrontmatter,
  estimateTokens,
} from "../routerUtils";

// ESM compatibility for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// Type Definitions
// ============================================

export interface ComponentRule {
  id: string;
  file: string;
  keywords: string[];
  priority: number;
  examples?: string[];
  components: string[];
  description: string;
}

export interface ComponentsIndex {
  coreRule: string;
  coreRuleFile: string;
  componentsDir: string;
  maxComponentRules: number;
  componentRules: ComponentRule[];
  generatedComponentsFile?: string;
}

export interface ComponentsContext {
  /** Always-included SKILL-COMPACT.md content */
  overview: string;
  /** Full assembled context (overview + selected docs) */
  relevantDocs: string;
  /** List of matched component names */
  matchedComponents: string[];
  /** IDs of included component rules */
  includedRules: string[];
  /** Estimated token count */
  estimatedTokens: number;
}

export interface ComponentsRouterOptions {
  /** Maximum tokens for component context (default: 4000) */
  maxTokens?: number;
  /** Maximum component rules to include (default: 3) */
  maxRules?: number;
  /** Force include specific rule IDs */
  forceInclude?: string[];
  /** Force exclude specific rule IDs */
  forceExclude?: string[];
}

/** Metadata for a generated component */
export interface GeneratedComponentMeta {
  name: string;
  file: string;
  description: string;
  keywords: string[];
  createdAt: string;
  doc?: string;
}

// ============================================
// Components Router Class
// ============================================

export class ComponentsRouter {
  private index: ComponentsIndex;
  private componentContents: Map<string, string> = new Map();
  private exampleContents: Map<string, string> = new Map();
  private overviewContent: string = "";
  private skillsDir: string;
  private initialized: boolean = false;

  constructor(skillsDir?: string) {
    // Use __dirname to get the correct path relative to this file
    this.skillsDir = skillsDir || path.resolve(__dirname, "..");
    this.index = {
      coreRule: "",
      coreRuleFile: "",
      componentsDir: "",
      maxComponentRules: 3,
      componentRules: [],
    };
  }

  /**
   * Initialize the router - load index and preload content
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load component index
      const indexPath = path.join(this.skillsDir, "components", "index.json");
      const indexContent = await fs.promises.readFile(indexPath, "utf-8");
      this.index = JSON.parse(indexContent);

      // Resolve components directory path (relative to skills dir)
      const componentsDir = path.resolve(
        this.skillsDir,
        "components",
        this.index.componentsDir
      );

      // Load overview (SKILL-COMPACT.md)
      const overviewPath = path.join(componentsDir, this.index.coreRuleFile);
      this.overviewContent = await this.loadAndStripFrontmatter(overviewPath);

      // Preload all component documentation
      for (const rule of this.index.componentRules) {
        const docPath = path.join(componentsDir, rule.file);
        const content = await this.loadAndStripFrontmatter(docPath);
        if (content) {
          this.componentContents.set(rule.id, content);
        }

        // Load examples if specified
        if (rule.examples) {
          for (const exPath of rule.examples) {
            const fullPath = path.join(componentsDir, exPath);
            try {
              const example = await fs.promises.readFile(fullPath, "utf-8");
              this.exampleContents.set(exPath, example);
            } catch {
              // Silently skip missing examples
            }
          }
        }
      }

      // Load generated components from registry
      await this.loadGeneratedComponents(componentsDir);

      this.initialized = true;
      console.log(
        `[ComponentsRouter] Initialized with ${this.index.componentRules.length} component rules, ${this.componentContents.size} docs loaded`
      );
    } catch (error) {
      console.error("[ComponentsRouter] Failed to initialize:", error);
      // Use empty defaults to prevent crash
      this.index = {
        coreRule: "",
        coreRuleFile: "",
        componentsDir: "",
        maxComponentRules: 3,
        componentRules: [],
      };
      this.initialized = true;
    }
  }

  /**
   * Load a file and strip YAML frontmatter
   */
  private async loadAndStripFrontmatter(filePath: string): Promise<string> {
    try {
      const content = await fs.promises.readFile(filePath, "utf-8");
      return stripFrontmatter(content);
    } catch {
      console.warn(`[ComponentsRouter] Could not load: ${filePath}`);
      return "";
    }
  }

  /**
   * Load generated components from the registry and merge them into
   * the component rules so they appear in future prompt context.
   */
  private async loadGeneratedComponents(componentsDir: string): Promise<void> {
    if (!this.index.generatedComponentsFile) return;

    try {
      const registryPath = path.join(componentsDir, this.index.generatedComponentsFile);
      const registryContent = await fs.promises.readFile(registryPath, "utf-8");
      const registry = JSON.parse(registryContent);

      if (!registry.components || registry.components.length === 0) return;

      for (const comp of registry.components) {
        // Skip if a rule with this id already exists
        const ruleId = `generated-${comp.name.toLowerCase()}`;
        if (this.index.componentRules.some(r => r.id === ruleId)) continue;

        // Load the documentation if it exists
        if (comp.doc) {
          const docPath = path.join(componentsDir, comp.doc);
          const content = await this.loadAndStripFrontmatter(docPath);
          if (content) {
            this.componentContents.set(ruleId, content);
          }
        }

        // Add as a component rule with lower priority than built-in rules
        const rule: ComponentRule = {
          id: ruleId,
          file: comp.doc || '',
          keywords: comp.keywords || [],
          priority: 5, // Lower than built-in (7-10)
          components: [comp.name],
          description: comp.description || `AI-generated component: ${comp.name}`,
        };

        this.index.componentRules.push(rule);
      }

      console.log(
        `[ComponentsRouter] Loaded ${registry.components.length} generated component(s) from registry`
      );
    } catch {
      // Registry doesn't exist or is malformed — that's fine
    }
  }

  /**
   * Main entry point - get optimized component context for a user prompt
   */
  async getContextForPrompt(
    userPrompt: string,
    style: string,
    options: ComponentsRouterOptions = {}
  ): Promise<ComponentsContext> {
    await this.initialize();

    const {
      maxTokens = 4000,
      maxRules = this.index.maxComponentRules || 3,
      forceInclude = [],
      forceExclude = [],
    } = options;

    // 1. Tokenize the prompt and style
    const tokens = tokenize(`${userPrompt} ${style}`);

    // 2. Score and match component rules
    const scored = this.scoreRules(tokens, forceInclude, forceExclude);

    // 3. Select within token budget
    const selected = this.selectWithinBudget(scored, maxRules, maxTokens);

    // 4. Assemble the context
    return this.assembleContext(selected);
  }

  /**
   * Score component rules based on keyword matches
   */
  private scoreRules(
    tokens: string[],
    forceInclude: string[],
    forceExclude: string[]
  ): Array<{ rule: ComponentRule; score: number }> {
    const results: Array<{ rule: ComponentRule; score: number }> = [];

    for (const rule of this.index.componentRules) {
      if (forceExclude.includes(rule.id)) continue;

      if (forceInclude.includes(rule.id)) {
        results.push({ rule, score: 1000 });
        continue;
      }

      let score = 0;

      for (const token of tokens) {
        // Score against keywords using shared utility
        score += scoreTokenAgainstKeywords(token, rule.keywords);

        // Also check component names (higher weight for direct component references)
        for (const comp of rule.components) {
          const compLower = comp.toLowerCase();
          if (compLower === token) {
            score += 8;
          } else if (compLower.includes(token) && token.length >= 4) {
            score += 4;
          }
        }
      }

      if (score > 0) {
        score += rule.priority * 0.1;
        results.push({ rule, score });
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * Select component rules within token budget
   * Uses smart truncation for large docs to ensure top-scoring rules are included
   */
  private selectWithinBudget(
    scored: Array<{ rule: ComponentRule; score: number }>,
    maxRules: number,
    maxTokens: number
  ): Array<{ rule: ComponentRule; truncatedContent: string }> {
    const selected: Array<{ rule: ComponentRule; truncatedContent: string }> = [];

    // Calculate total budget in characters
    const totalBudget = maxTokens * CHARS_PER_TOKEN;

    // Overview is always included
    const overviewSize = this.overviewContent.length;

    // Remaining budget for feature docs (with buffer for structure)
    const featureBudget = totalBudget - overviewSize - 800; // 800 char buffer
    let featureChars = 0;

    // Calculate per-rule budget (divide evenly among maxRules)
    const perRuleBudget = Math.floor(featureBudget / maxRules);

    for (const { rule } of scored) {
      if (selected.length >= maxRules) break;

      const content = this.componentContents.get(rule.id) || "";
      let contentToUse = content;

      // If content exceeds per-rule budget, truncate intelligently
      if (content.length > perRuleBudget) {
        contentToUse = this.truncateDocumentation(content, perRuleBudget);
      }

      // Check if rule fits in remaining budget
      if (featureChars + contentToUse.length <= featureBudget) {
        selected.push({ rule: { ...rule, examples: undefined }, truncatedContent: contentToUse });
        featureChars += contentToUse.length;
      }
    }

    return selected;
  }

  /**
   * Truncate documentation while preserving the most useful sections
   * Priority: Overview > Import > Props/Interface > Quick Examples > rest
   */
  private truncateDocumentation(content: string, maxChars: number): string {
    // If already fits, return as-is
    if (content.length <= maxChars) return content;

    const sections: string[] = [];
    let currentSize = 0;

    // Split by h2 and h3 headers
    const parts = content.split(/(?=^##\s)/m);

    // Priority sections to always include (partial matching)
    const prioritySections = [
      'overview',
      'import',
      'props',
      'interface',
      'quick',
      'usage example',
      'basic',
    ];

    // First pass: Add priority sections
    for (const part of parts) {
      const headerMatch = part.match(/^##\s*(.+)/m);
      const headerText = headerMatch ? headerMatch[1].toLowerCase() : '';

      const isPriority = prioritySections.some(p => headerText.includes(p));

      if (isPriority && currentSize + part.length <= maxChars) {
        sections.push(part);
        currentSize += part.length;
      }
    }

    // Second pass: Add more sections if space remains
    for (const part of parts) {
      const headerMatch = part.match(/^##\s*(.+)/m);
      const headerText = headerMatch ? headerMatch[1].toLowerCase() : '';
      const isPriority = prioritySections.some(p => headerText.includes(p));

      if (!isPriority && currentSize + part.length <= maxChars) {
        sections.push(part);
        currentSize += part.length;
      }
    }

    // If still over budget, just take first maxChars
    let result = sections.join('');
    if (result.length > maxChars) {
      result = content.substring(0, maxChars - 50) + '\n\n...(truncated for brevity)';
    }

    return result;
  }

  /**
   * Assemble the final context string
   */
  private assembleContext(
    selected: Array<{ rule: ComponentRule; truncatedContent: string }>
  ): ComponentsContext {
    const sections: string[] = [];
    const matchedComponents: string[] = [];
    const includedRules: string[] = [];

    // Header
    sections.push("=".repeat(60));
    sections.push("COMPONENT LIBRARY (PREFER OVER RAW REMOTION CODE)");
    sections.push("=".repeat(60));

    // Overview (always included)
    if (this.overviewContent) {
      sections.push("\n## LIBRARY OVERVIEW\n");
      sections.push(this.overviewContent);
    }

    // Selected component documentation
    if (selected.length > 0) {
      sections.push("\n## DETAILED COMPONENT DOCUMENTATION\n");
      sections.push(
        "The following components are most relevant to your request:\n"
      );

      for (const { rule, truncatedContent } of selected) {
        includedRules.push(rule.id);
        matchedComponents.push(...rule.components);

        sections.push(`### ${rule.id.toUpperCase().replace(/-/g, " ")}`);
        if (rule.description) {
          sections.push(`*${rule.description}*\n`);
        }
        sections.push(truncatedContent);
        sections.push("");
      }
    }

    // Component usage reminder
    sections.push("\n## COMPONENT USAGE PRIORITY\n");
    sections.push("When generating code:");
    sections.push(
      "1. **FIRST**: Use components above if they can achieve the effect"
    );
    sections.push(
      "2. **THEN**: Use raw Remotion primitives only when components cannot achieve the desired effect"
    );
    sections.push(
      "3. **COMBINE**: Mix components with custom code when needed\n"
    );

    if (matchedComponents.length > 0) {
      const uniqueComponents = Array.from(new Set(matchedComponents));
      sections.push(
        `**Recommended components for this task:** ${uniqueComponents.join(", ")}`
      );
    }

    const fullContent = sections.join("\n");
    const tokenCount = estimateTokens(fullContent);

    return {
      overview: this.overviewContent,
      relevantDocs: fullContent,
      matchedComponents: Array.from(new Set(matchedComponents)),
      includedRules,
      estimatedTokens: tokenCount,
    };
  }

  /**
   * Get all available component names
   */
  getAllComponents(): string[] {
    const components: string[] = [];
    for (const rule of this.index.componentRules) {
      components.push(...rule.components);
    }
    return Array.from(new Set(components));
  }

  /**
   * Check if a specific component exists
   */
  hasComponent(componentName: string): boolean {
    return this.getAllComponents().some(
      (c) => c.toLowerCase() === componentName.toLowerCase()
    );
  }

  /**
   * Get the full component catalog for model-driven selection.
   * 
   * Unlike getContextForPrompt() which uses keyword matching, this method
   * loads the comprehensive COMPONENT-CATALOG.md which contains all component
   * documentation in a format optimized for AI decision-making.
   * 
   * The model reads the entire catalog and decides which components
   * are useful for its creative vision, rather than relying on pattern matching.
   */
  async getFullCatalog(): Promise<ComponentsContext> {
    await this.initialize();

    // Try to load the comprehensive catalog
    const componentsDir = path.resolve(
      this.skillsDir,
      "components",
      this.index.componentsDir
    );
    const catalogPath = path.join(componentsDir, "COMPONENT-CATALOG.md");
    
    let catalogContent = "";
    try {
      catalogContent = await fs.promises.readFile(catalogPath, "utf-8");
      catalogContent = stripFrontmatter(catalogContent);
    } catch {
      // Fallback to overview if catalog doesn't exist
      console.warn("[ComponentsRouter] COMPONENT-CATALOG.md not found, using overview");
      catalogContent = this.overviewContent;
    }

    // Collect all component names for reference
    const allComponents = this.getAllComponents();

    const sections: string[] = [];
    sections.push("=".repeat(60));
    sections.push("COMPONENT LIBRARY - EVALUATE AND USE AS NEEDED");
    sections.push("=".repeat(60));
    sections.push("");
    sections.push(catalogContent);

    const fullContent = sections.join("\n");
    const tokenCount = estimateTokens(fullContent);

    console.log(`[ComponentsRouter] Full catalog loaded (~${tokenCount} tokens, ${allComponents.length} components)`);

    return {
      overview: catalogContent,
      relevantDocs: fullContent,
      matchedComponents: allComponents, // All components are "available" for model to choose
      includedRules: this.index.componentRules.map(r => r.id),
      estimatedTokens: tokenCount,
    };
  }
}

// ============================================
// Singleton Instance
// ============================================

let routerInstance: ComponentsRouter | null = null;

export function getComponentsRouter(skillsDir?: string): ComponentsRouter {
  if (!routerInstance) {
    routerInstance = new ComponentsRouter(skillsDir);
  }
  return routerInstance;
}

/**
 * Reset the router instance (useful for testing or after new components are generated)
 */
export function resetComponentsRouter(): void {
  routerInstance = null;
}

export default ComponentsRouter;
