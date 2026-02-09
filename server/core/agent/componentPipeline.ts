/**
 * Component Creation Pipeline
 *
 * Handles the full lifecycle of detecting, generating, validating,
 * storing, and documenting new reusable Remotion components from
 * AI-generated video compositions.
 *
 * Flow:
 * 1. detectReusablePattern() — asks Gemini if generated code has a novel pattern
 * 2. generateComponent() — asks Gemini to create a proper reusable component
 * 3. validateComponent() — checks the component compiles and follows patterns
 * 4. saveComponent() — writes to Generated/, updates barrel exports and registry
 * 5. generateDocumentation() — creates markdown docs for the components router
 */

import { GoogleGenAI } from '@google/genai';
import path from 'path';
import fs from 'fs/promises';
import {
  ComponentSpec,
  buildComponentCreationPrompt,
  buildComponentDetectionPrompt,
  buildComponentDocPrompt,
  clearPromptCaches,
} from './promptBuilder';
import { getComponentsRouter, GeneratedComponentMeta } from './skills/components/componentsRouter';
import { rateLimitedCall } from './rateLimiter';

// ============================================
// Types
// ============================================

export interface DetectionResult {
  found: boolean;
  name?: string;
  purpose?: string;
  features?: string[];
  keywords?: string[];
  sourceLines?: string;
  reason?: string;
}

export interface PipelineResult {
  created: boolean;
  componentName?: string;
  componentPath?: string;
  docPath?: string;
  reason?: string;
}

// ============================================
// Paths
// ============================================

const REMOTION_ROOT = path.join(process.cwd(), 'remotion');
const GENERATED_DIR = path.join(REMOTION_ROOT, 'src', 'components', 'Generated');
const GENERATED_INDEX = path.join(GENERATED_DIR, 'index.ts');
const REGISTRY_PATH = path.join(REMOTION_ROOT, 'remotion-components', 'generated-registry.json');
const GENERATED_DOCS_DIR = path.join(REMOTION_ROOT, 'remotion-components', 'rules', 'generated');

// ============================================
// Pipeline Class
// ============================================

export class ComponentPipeline {
  private ai: GoogleGenAI;

  constructor(ai: GoogleGenAI) {
    this.ai = ai;
  }

  /**
   * Run the full pipeline: detect → generate → validate → save → document
   *
   * Call this after a video is successfully generated and rendered.
   * It's non-blocking for the user — failures here don't affect video output.
   */
  async run(generatedVideoCode: string): Promise<PipelineResult> {
    try {
      // 1. Get existing components so we don't duplicate
      const router = getComponentsRouter();
      await router.initialize();
      const existingComponents = router.getAllComponents();

      // Also include previously generated components
      const registry = await this.loadRegistry();
      const allExisting = [
        ...existingComponents,
        ...registry.components.map((c: GeneratedComponentMeta) => c.name),
      ];

      // 2. Detect if there's a reusable pattern
      console.log('[ComponentPipeline] Analyzing generated code for reusable patterns...');
      const detection = await this.detectReusablePattern(generatedVideoCode, allExisting);

      if (!detection.found) {
        console.log(`[ComponentPipeline] No reusable pattern found: ${detection.reason}`);
        return { created: false, reason: detection.reason };
      }

      console.log(`[ComponentPipeline] Found reusable pattern: ${detection.name} — ${detection.purpose}`);

      // 3. Check if this component name already exists
      if (allExisting.some(c => c.toLowerCase() === detection.name!.toLowerCase())) {
        console.log(`[ComponentPipeline] Component "${detection.name}" already exists, skipping`);
        return { created: false, reason: `Component "${detection.name}" already exists` };
      }

      // 4. Generate the component
      const spec: ComponentSpec = {
        name: detection.name!,
        purpose: detection.purpose!,
        features: detection.features || [],
        sourceCode: detection.sourceLines,
      };

      console.log(`[ComponentPipeline] Generating component: ${spec.name}`);
      const componentCode = await this.generateComponent(spec, allExisting);

      if (!componentCode) {
        return { created: false, reason: 'Failed to generate component code' };
      }

      // 5. Validate the component
      const validation = this.validateComponent(componentCode, spec.name);
      if (!validation.valid) {
        console.warn(`[ComponentPipeline] Component validation failed: ${validation.error}`);
        return { created: false, reason: `Validation failed: ${validation.error}` };
      }

      // 6. Save the component
      console.log(`[ComponentPipeline] Saving component: ${spec.name}`);
      const componentPath = await this.saveComponent(spec.name, componentCode);

      // 7. Update barrel exports
      await this.updateBarrelExports(spec.name);

      // 8. Generate documentation
      console.log(`[ComponentPipeline] Generating documentation for: ${spec.name}`);
      const docPath = await this.generateDocumentation(spec.name, componentCode);

      // 9. Update registry
      await this.updateRegistry({
        name: spec.name,
        file: `Generated/${spec.name}.tsx`,
        description: spec.purpose,
        keywords: detection.keywords || [],
        createdAt: new Date().toISOString(),
        doc: docPath ? `rules/generated/${spec.name.toLowerCase()}.md` : undefined,
      });

      // 10. Clear prompt caches so next generation sees the new component
      clearPromptCaches();

      console.log(`[ComponentPipeline] Successfully created component: ${spec.name}`);

      return {
        created: true,
        componentName: spec.name,
        componentPath,
        docPath: docPath || undefined,
      };
    } catch (error) {
      console.error('[ComponentPipeline] Pipeline error:', error);
      return { created: false, reason: `Pipeline error: ${error}` };
    }
  }

  // ============================================
  // Step 1: Detection
  // ============================================

  private async detectReusablePattern(
    code: string,
    existingComponents: string[]
  ): Promise<DetectionResult> {
    const prompt = buildComponentDetectionPrompt(code, existingComponents);

    try {
      const response = await rateLimitedCall(() =>
        this.ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
          config: {
            // Gemini 3 best practice: use default temperature of 1.0
            temperature: 1.0,
            maxOutputTokens: 1024,
            // Use minimal thinking for fast detection
            thinkingConfig: {
              thinkingLevel: 'minimal',
            },
          },
        })
      );

      const text = response.text || '';

      // Parse JSON response — strip any code fences if present
      const cleaned = text.replace(/```json?\s*/g, '').replace(/```/g, '').trim();
      const result = JSON.parse(cleaned) as DetectionResult;

      return result;
    } catch (error) {
      console.warn('[ComponentPipeline] Detection failed:', error);
      return { found: false, reason: `Detection error: ${error}` };
    }
  }

  // ============================================
  // Step 2: Generation
  // ============================================

  private async generateComponent(
    spec: ComponentSpec,
    existingComponents: string[]
  ): Promise<string | null> {
    const prompt = await buildComponentCreationPrompt(spec, existingComponents);

    try {
      const response = await rateLimitedCall(() =>
        this.ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
          config: {
            // Gemini 3 best practice: use default temperature of 1.0
            temperature: 1.0,
            maxOutputTokens: 8192,
            // Use high thinking for code generation
            thinkingConfig: {
              thinkingLevel: 'high',
            },
          },
        })
      );

      const text = response.text || '';
      return this.extractCode(text);
    } catch (error) {
      console.error('[ComponentPipeline] Generation failed:', error);
      return null;
    }
  }

  // ============================================
  // Step 3: Validation
  // ============================================

  private validateComponent(
    code: string,
    expectedName: string
  ): { valid: boolean; error?: string } {
    // Must have remotion import
    if (!/from\s+['"]remotion['"]/.test(code)) {
      return { valid: false, error: 'Missing remotion import' };
    }

    // Must have named export matching the component name
    const hasNamedExport = new RegExp(
      `export\\s+function\\s+${expectedName}\\b`
    ).test(code);
    if (!hasNamedExport) {
      return { valid: false, error: `Missing named export: export function ${expectedName}` };
    }

    // Must NOT have default export (components should be named exports)
    if (/export\s+default\b/.test(code)) {
      return { valid: false, error: 'Component should use named export, not default export' };
    }

    // Must have props interface
    const hasInterface = new RegExp(`interface\\s+${expectedName}Props`).test(code);
    if (!hasInterface) {
      return { valid: false, error: `Missing props interface: ${expectedName}Props` };
    }

    // Must use useCurrentFrame or useVideoConfig
    if (!/useCurrentFrame|useVideoConfig/.test(code)) {
      return { valid: false, error: 'Must use useCurrentFrame() or useVideoConfig()' };
    }

    // No dangerous patterns
    const dangerousPatterns = [
      { pattern: /\brequire\s*\(/, name: 'require()' },
      { pattern: /\beval\s*\(/, name: 'eval()' },
      { pattern: /new\s+Function\s*\(/, name: 'Function constructor' },
      { pattern: /child_process/, name: 'child_process' },
    ];

    for (const { pattern, name } of dangerousPatterns) {
      if (pattern.test(code)) {
        return { valid: false, error: `Forbidden pattern: ${name}` };
      }
    }

    // No external imports beyond react and remotion
    const importMatches = code.matchAll(/from\s+['"]([^'"]+)['"]/g);
    const allowedImports = new Set(['react', 'remotion']);
    for (const match of importMatches) {
      const pkg = match[1];
      // Allow relative imports and allowed packages
      if (!pkg.startsWith('.') && !pkg.startsWith('/') && !allowedImports.has(pkg)) {
        return { valid: false, error: `Forbidden external import: ${pkg}` };
      }
    }

    // Must have reasonable size (not a stub, not bloated)
    if (code.length < 200) {
      return { valid: false, error: 'Component too small — likely incomplete' };
    }
    if (code.length > 15000) {
      return { valid: false, error: 'Component too large — should be focused and concise' };
    }

    return { valid: true };
  }

  // ============================================
  // Step 4: Storage
  // ============================================

  private async saveComponent(name: string, code: string): Promise<string> {
    await fs.mkdir(GENERATED_DIR, { recursive: true });

    const filePath = path.join(GENERATED_DIR, `${name}.tsx`);
    await fs.writeFile(filePath, code, 'utf-8');
    console.log(`[ComponentPipeline] Saved: ${filePath}`);

    return filePath;
  }

  // ============================================
  // Step 5: Update Barrel Exports
  // ============================================

  private async updateBarrelExports(name: string): Promise<void> {
    try {
      let content = await fs.readFile(GENERATED_INDEX, 'utf-8');

      // Check if export already exists
      if (content.includes(`from './${name}'`)) {
        return;
      }

      // Find the registry array and add the component to it
      const registryEntry = `  { name: '${name}', path: './${name}', description: '', keywords: [], createdAt: '${new Date().toISOString()}' },`;

      // Add the export line before the placeholder export
      const exportLine = `export { ${name} } from './${name}';\n`;

      // Insert export before the version constant
      if (content.includes('export const GENERATED_COMPONENTS_VERSION')) {
        content = content.replace(
          'export const GENERATED_COMPONENTS_VERSION',
          `${exportLine}\nexport const GENERATED_COMPONENTS_VERSION`
        );
      } else {
        // Append if marker not found
        content += `\n${exportLine}`;
      }

      // Update the registry array
      if (content.includes('generatedComponentsRegistry: Array<')) {
        content = content.replace(
          /generatedComponentsRegistry:.*?\[\s*\]/s,
          `generatedComponentsRegistry: Array<{\n  name: string;\n  path: string;\n  description: string;\n  keywords: string[];\n  createdAt: string;\n}> = [\n${registryEntry}\n]`
        );
      }

      await fs.writeFile(GENERATED_INDEX, content, 'utf-8');
      console.log(`[ComponentPipeline] Updated barrel exports with ${name}`);
    } catch (error) {
      console.error(`[ComponentPipeline] Failed to update barrel exports:`, error);
    }
  }

  // ============================================
  // Step 6: Documentation
  // ============================================

  private async generateDocumentation(
    name: string,
    componentCode: string
  ): Promise<string | null> {
    try {
      const prompt = buildComponentDocPrompt(name, componentCode);

      const response = await rateLimitedCall(() =>
        this.ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
          config: {
            // Gemini 3 best practice: use default temperature of 1.0
            temperature: 1.0,
            maxOutputTokens: 4096,
            // Use low thinking for documentation generation
            thinkingConfig: {
              thinkingLevel: 'low',
            },
          },
        })
      );

      const docContent = response.text || '';
      if (!docContent || docContent.length < 50) {
        console.warn('[ComponentPipeline] Doc generation returned empty content');
        return null;
      }

      // Save to generated docs directory
      await fs.mkdir(GENERATED_DOCS_DIR, { recursive: true });
      const docFileName = `${name.toLowerCase()}.md`;
      const docPath = path.join(GENERATED_DOCS_DIR, docFileName);
      await fs.writeFile(docPath, docContent, 'utf-8');
      console.log(`[ComponentPipeline] Saved docs: ${docPath}`);

      return docPath;
    } catch (error) {
      console.error('[ComponentPipeline] Doc generation failed:', error);
      return null;
    }
  }

  // ============================================
  // Step 7: Registry
  // ============================================

  private async loadRegistry(): Promise<{
    version: string;
    components: GeneratedComponentMeta[];
    lastUpdated: string | null;
  }> {
    try {
      const content = await fs.readFile(REGISTRY_PATH, 'utf-8');
      return JSON.parse(content);
    } catch {
      return { version: '1.0.0', components: [], lastUpdated: null };
    }
  }

  private async updateRegistry(meta: GeneratedComponentMeta): Promise<void> {
    try {
      const registry = await this.loadRegistry();

      // Remove existing entry with same name if any
      registry.components = registry.components.filter(
        (c: GeneratedComponentMeta) => c.name !== meta.name
      );

      registry.components.push(meta);
      registry.lastUpdated = new Date().toISOString();

      await fs.writeFile(REGISTRY_PATH, JSON.stringify(registry, null, 2), 'utf-8');
      console.log(`[ComponentPipeline] Updated registry with ${meta.name}`);
    } catch (error) {
      console.error('[ComponentPipeline] Registry update failed:', error);
    }
  }

  // ============================================
  // Utilities
  // ============================================

  private extractCode(response: string): string | null {
    const codeBlockRegex = /```(?:tsx?|jsx?|typescript|javascript)?\s*([\s\S]*?)```/g;
    const matches = [...response.matchAll(codeBlockRegex)];

    if (matches.length === 0) {
      // Check if the whole response looks like code
      if (response.includes('export function') && response.includes('from \'remotion\'')) {
        return response.trim();
      }
      return null;
    }

    let bestBlock = '';
    for (const match of matches) {
      const code = match[1].trim();
      if (code.length > bestBlock.length) {
        bestBlock = code;
      }
    }

    return bestBlock || null;
  }
}
