/**
 * Skills Index Type Definitions
 * 
 * This module defines the structure for the Remotion skills registry.
 * Skills are AI-optimized markdown files containing best practices and code patterns.
 */

export interface SkillRule {
  /** Unique identifier, e.g., "timing" */
  id: string;
  
  /** Relative path to the markdown file, e.g., "rules/timing.md" */
  file: string;
  
  /** Keywords that trigger this skill, e.g., ["spring", "bounce", "easing"] */
  keywords: string[];
  
  /** Optional package dependencies, e.g., ["@remotion/transitions"] */
  requires?: string[];
  
  /** Priority 1-10, higher = more likely to be included when context is limited */
  priority: number;
  
  /** Optional paths to example TSX files */
  examples?: string[];
  
  /** Short description of what this skill covers */
  description?: string;
}

export interface SkillsIndex {
  /** Rule IDs that are ALWAYS included regardless of prompt */
  coreRules: string[];
  
  /** Packages that are installed and available for use */
  availablePackages: string[];
  
  /** Feature rules that are conditionally included based on prompt analysis */
  featureRules: SkillRule[];
  
  /** Maximum number of feature rules to include (to limit context size) */
  maxFeatureRules?: number;
}

export interface SkillsContext {
  /** The assembled context string to inject into the prompt */
  content: string;
  
  /** List of skill IDs that were included */
  includedSkills: string[];
  
  /** List of packages the agent is allowed to use */
  allowedPackages: string[];
  
  /** Approximate token count of the context */
  estimatedTokens: number;
}

export interface RouterOptions {
  /** Maximum approximate tokens for the skills context (default: 4000) */
  maxTokens?: number;
  
  /** Override the max feature rules limit */
  maxFeatureRules?: number;
  
  /** Force include specific skill IDs regardless of matching */
  forceInclude?: string[];
  
  /** Force exclude specific skill IDs regardless of matching */
  forceExclude?: string[];
}
