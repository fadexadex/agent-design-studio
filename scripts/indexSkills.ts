#!/usr/bin/env npx ts-node

/**
 * Skills Indexer Script
 * 
 * This script scans the skills rules directory and generates/updates the index.json file.
 * It extracts metadata from YAML frontmatter and allows you to add keyword mappings.
 * 
 * Usage: npx ts-node scripts/indexSkills.ts
 * 
 * The script will:
 * 1. Scan server/agent/skills/rules/ for .md files
 * 2. Extract YAML frontmatter metadata
 * 3. Generate keyword mappings based on file content
 * 4. Output an updated index.json
 */

import fs from 'fs';
import path from 'path';

interface SkillRule {
  id: string;
  file: string;
  keywords: string[];
  requires?: string[];
  priority: number;
  examples?: string[];
  description?: string;
}

interface SkillsIndex {
  coreRules: string[];
  availablePackages: string[];
  maxFeatureRules: number;
  featureRules: SkillRule[];
}

// Keywords for each skill - manually curated for best matching
const SKILL_KEYWORDS: Record<string, string[]> = {
  'common-pitfalls': ['error', 'mistake', 'forbidden', 'dont', 'avoid', 'wrong'],
  'animations': ['animate', 'frame', 'motion', 'movement', 'current', 'hook'],
  'timing': ['spring', 'bounce', 'easing', 'interpolate', 'smooth', 'curve', 'ease', 'natural', 'physics'],
  'sequencing': ['sequence', 'series', 'delay', 'stagger', 'timing', 'order', 'after', 'before', 'chain', 'overlap', 'offset', 'premount'],
  'text-animations': ['text', 'typewriter', 'typing', 'word', 'letter', 'character', 'title', 'headline', 'caption', 'subtitle', 'typography', 'highlight', 'reveal', 'write'],
  'transitions': ['transition', 'fade', 'slide', 'wipe', 'flip', 'clock', 'scene', 'cut', 'crossfade', 'dissolve', 'enter', 'exit', 'switch', 'morph'],
  'fonts': ['font', 'google', 'custom', 'load', 'family', 'weight', 'typography', 'text', 'inter', 'roboto', 'montserrat'],
  'images': ['image', 'img', 'photo', 'picture', 'logo', 'icon', 'background', 'staticfile', 'asset', 'src'],
  'compositions': ['composition', 'register', 'folder', 'nested', 'default', 'props', 'metadata', 'still', 'config'],
  'tailwind': ['tailwind', 'tailwindcss', 'utility', 'class', 'className', 'css', 'style'],
  'audio': ['audio', 'sound', 'music', 'volume', 'play', 'sync', 'beat'],
  'charts': ['chart', 'graph', 'data', 'bar', 'line', 'pie', 'visualization'],
  '3d': ['3d', 'three', 'threejs', 'depth', 'perspective', 'rotate', 'camera'],
};

// Dependencies required by each skill
const SKILL_REQUIRES: Record<string, string[]> = {
  'transitions': ['@remotion/transitions'],
  '3d': ['@remotion/three'],
  'charts': [], // No extra deps needed for basic charts
};

// Priority for each skill (higher = more important, included first)
const SKILL_PRIORITIES: Record<string, number> = {
  'common-pitfalls': 10, // Always included as core
  'animations': 10,       // Always included as core
  'timing': 10,           // Always included as core
  'sequencing': 9,
  'text-animations': 9,
  'transitions': 8,
  'fonts': 7,
  'images': 7,
  'compositions': 6,
  'tailwind': 5,
  'audio': 6,
  'charts': 5,
  '3d': 4,
};

// Example files for each skill
const SKILL_EXAMPLES: Record<string, string[]> = {
  'text-animations': [
    'assets/text-animations-typewriter.tsx',
    'assets/text-animations-word-highlight.tsx'
  ],
};

function extractYamlFrontmatter(content: string): { name?: string; description?: string; tags?: string[] } {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const yaml = match[1];
  const result: { name?: string; description?: string; tags?: string[] } = {};

  const nameMatch = yaml.match(/name:\s*(.+)/);
  if (nameMatch) result.name = nameMatch[1].trim();

  const descMatch = yaml.match(/description:\s*(.+)/);
  if (descMatch) result.description = descMatch[1].trim();

  const tagsMatch = yaml.match(/tags:\s*(.+)/);
  if (tagsMatch) {
    result.tags = tagsMatch[1].split(',').map(t => t.trim());
  }

  return result;
}

async function indexSkills(): Promise<void> {
  const rulesDir = path.join(process.cwd(), 'server', 'agent', 'skills', 'rules');
  const outputPath = path.join(process.cwd(), 'server', 'agent', 'skills', 'index.json');

  console.log('📚 Scanning skills directory:', rulesDir);

  // Read all .md files
  const files = fs.readdirSync(rulesDir).filter(f => f.endsWith('.md'));
  console.log(`Found ${files.length} skill files`);

  const featureRules: SkillRule[] = [];
  const coreRules: string[] = ['common-pitfalls', 'animations', 'timing'];

  for (const file of files) {
    const id = path.basename(file, '.md');
    const filePath = path.join(rulesDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    // Extract metadata
    const metadata = extractYamlFrontmatter(content);
    
    // Build rule object
    const rule: SkillRule = {
      id,
      file: `rules/${file}`,
      keywords: SKILL_KEYWORDS[id] || [],
      priority: SKILL_PRIORITIES[id] || 5,
    };

    // Add optional fields
    if (SKILL_REQUIRES[id]) {
      rule.requires = SKILL_REQUIRES[id];
    }

    if (SKILL_EXAMPLES[id]) {
      rule.examples = SKILL_EXAMPLES[id];
    }

    if (metadata.description) {
      rule.description = metadata.description;
    }

    // Add tags to keywords if present
    if (metadata.tags) {
      rule.keywords = [...new Set([...rule.keywords, ...metadata.tags])];
    }

    // Only add to feature rules if not a core rule
    if (!coreRules.includes(id)) {
      featureRules.push(rule);
    }

    console.log(`  ✓ ${id}: ${rule.keywords.length} keywords, priority ${rule.priority}`);
  }

  // Sort feature rules by priority
  featureRules.sort((a, b) => b.priority - a.priority);

  // Build the index
  const index: SkillsIndex = {
    coreRules,
    availablePackages: [
      'remotion',
      'react',
      '@remotion/transitions',
      '@remotion/shapes'
    ],
    maxFeatureRules: 5,
    featureRules
  };

  // Write output
  fs.writeFileSync(outputPath, JSON.stringify(index, null, 2));
  console.log(`\n✅ Index written to: ${outputPath}`);
  console.log(`   Core rules: ${coreRules.join(', ')}`);
  console.log(`   Feature rules: ${featureRules.length}`);
  console.log(`   Available packages: ${index.availablePackages.join(', ')}`);
}

// Run if called directly
indexSkills().catch(console.error);
