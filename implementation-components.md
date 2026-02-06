Thank you for the clarification. Based on your answers, here's my comprehensive plan:
---
Implementation Plan: Component Library Integration for AI Video Generation
Overview
The goal is to integrate your new Remotion component library (remotion/remotion-components/) into the AI's context so it can:
1. Prefer pre-built components when they match the task
2. Generate raw Remotion code when components don't fit
3. Create new reusable components that extend the library when needed
---
Phase 1: Extend the Skills Router for Components
1.1 Create a Component Skills Index
Create a new registry file specifically for your component library:
New file: server/core/agent/skills/components/index.json
{
  coreComponentRule: remotion-components,
  componentRules: [
    {
      id: animated-text,
      file: animated-text.md,
      keywords: [text, title, headline, caption, tagline, typewriter, typing, word, letter, gradient, hero, quote, subtitle, stagger],
      priority: 10,
      examples: [assets/animated-text-examples.tsx],
      components: [AnimatedText, LayoutGrid, TextSequence],
      description: Text animations with presets, stagger, positioning API
    },
    {
      id: mockup-frame,
      file: mockup-frame.md,
      keywords: [mockup, device, browser, iphone, phone, card, frame, screenshot, app, interface, ui, showcase],
      priority: 9,
      examples: [assets/mockup-frame-examples.tsx],
      components: [MockupFrame, FrameSequence, BrowserFrame, IPhoneFrame],
      description: Device mockups with glass effects and 3D rotation
    },
    {
      id: layout,
      file: layout.md,
      keywords: [layout, container, grid, bento, motion, entrance, exit, wrapper, animate, group],
      priority: 9,
      examples: [assets/layout-examples.tsx],
      components: [MotionContainer, BentoGrid, BentoItem],
      description: Animated layout containers and CSS grid
    },
    {
      id: camera-rig,
      file: camera-rig.md,
      keywords: [camera, zoom, pan, rotate, dolly, virtual, movement, cinematic, perspective],
      priority: 8,
      components: [CameraRig],
      description: Virtual camera for zoom, pan, and rotate effects
    },
    {
      id: dynamic-cursor,
      file: dynamic-cursor.md,
      keywords: [cursor, pointer, mouse, click, path, follow, trail, interaction],
      priority: 7,
      components: [DynamicCursor, CursorPath],
      description: Animated cursor with variants and path following
    },
    {
      id: background-rig,
      file: background-rig.md,
      keywords: [background, gradient, mesh, blob, grid, pattern, ambient, scene],
      priority: 7,
      components: [BackgroundRig],
      description: Animated backgrounds - mesh gradients, grids, blobs
    },
    {
      id: transitions,
      file: transitions.md,
      keywords: [iris, wipe, circular, reveal, scene, transition, cut],
      priority: 8,
      components: [IrisTransition, TransitionSeries],
      description: Scene transitions - iris wipe, series
    }
  ],
  importPath: @/components
}
1.2 Create a Component Router
New file: server/core/agent/skills/componentsRouter.ts
This router mirrors the existing skillsRouter.ts but handles component documentation:
- Loads component documentation from remotion/remotion-components/rules/
- Uses the same keyword-matching algorithm
- Returns a ComponentsContext with:
  - overview: Content from SKILL.md (always included)
  - relevantDocs: Selected component documentation based on prompt
  - matchedComponents: List of specific component names matched
  - estimatedTokens: Token count for budget management
1.3 Modify promptBuilder.ts
Update to merge both contexts:
export async function buildPrompt(brand: BrandContext, config: VideoConfig): Promise<string> {
  // Existing skills context
  const skillsContext = await getSkillsContext(config.prompt, config.style);
  
  // NEW: Component context
  const componentsContext = await getComponentsContext(config.prompt, config.style);
  
  return `You are an expert motion graphics designer...
${skillsContext.content}
## COMPONENT LIBRARY
${componentsContext.overview}
${componentsContext.relevantDocs}
## COMPONENT USAGE PRIORITY
When generating code:
1. **FIRST**: Check if any components from the library can achieve the desired effect
2. **THEN**: Use raw Remotion primitives only for effects that components cannot achieve
3. **COMBINE**: Mix components with custom code when needed
Matched components for this task: ${componentsContext.matchedComponents.join(', ')}
...rest of prompt...`;
}
---
Phase 2: Smart Context Compression
Since you want ~4,000 tokens for component docs, here's the strategy:
2.1 Two-Tier Documentation Structure
Tier 1 - Always Include (~800 tokens):
- Condensed SKILL.md with component table and import patterns
- Critical "DO" and "DON'T" rules
Tier 2 - Dynamically Select (~3,200 tokens):
- 2-3 most relevant component documentation files
- Include examples only when token budget allows
2.2 Create Condensed SKILL.md
New file: remotion/remotion-components/SKILL-COMPACT.md
A compressed version (~800 tokens) containing:
- Component table with one-line descriptions
- Import patterns
- Key rules (prefer components, no CSS animations, use presets)
- Links to component IDs for the router to expand
2.3 Token Budget Algorithm
async function getComponentsContext(prompt: string, style: string): Promise<ComponentsContext> {
  const TOTAL_BUDGET = 4000; // tokens
  const OVERVIEW_BUDGET = 800;
  const FEATURE_BUDGET = TOTAL_BUDGET - OVERVIEW_BUDGET;
  
  // 1. Always include condensed SKILL.md
  const overview = loadCondensedSkill(); // ~800 tokens
  
  // 2. Score and rank component rules by keyword match
  const scored = scoreComponentRules(prompt, style);
  
  // 3. Greedily select within budget
  const selected = selectWithinBudget(scored, FEATURE_BUDGET);
  
  // 4. Include examples only if budget remains
  // ...
}
---
Phase 3: Component Creation Pipeline
When the AI determines it needs a new component:
3.1 Component Generation Prompt
Add a new prompt template for generating reusable components:
export function buildComponentCreationPrompt(
  componentSpec: ComponentSpec,
  existingComponents: string[]
): string {
  return `You are creating a NEW reusable Remotion component for the LangEase library.
## EXISTING COMPONENTS (DO NOT DUPLICATE)
${existingComponents.join('\n')}
## NEW COMPONENT REQUIREMENTS
- Name: ${componentSpec.name}
- Purpose: ${componentSpec.purpose}
- Should handle: ${componentSpec.features.join(', ')}
## COMPONENT TEMPLATE
Follow this structure:
\`\`\`tsx
import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
// Types
interface ${componentSpec.name}Props {
  // Define all props with JSDoc comments
}
// Presets (if applicable)
const presets = {
  // Define reusable presets
};
// Main component
export function ${componentSpec.name}(props: ${componentSpec.name}Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // ...
}
\`\`\`
## REQUIREMENTS
1. Export the component as a named export
2. Define TypeScript interfaces for all props
3. Include JSDoc comments for documentation
4. Support common patterns: delay, duration, easing
5. Use presets for common configurations
...`;
}
3.2 Component Validation & Storage
After generation:
1. Validate the component compiles
2. Save to remotion/src/components/Generated/ (new directory)
3. Generate documentation in remotion/remotion-components/rules/generated/
4. Update components/index.json to register the new component
3.3 Re-use Learning
Store metadata about generated components so the AI can use them in future requests:
New file: remotion/remotion-components/generated-components.json
{
  components: [
    {
      name: ParticleBackground,
      createdAt: 2024-01-15,
      keywords: [particles, confetti, sparkles, celebration],
      file: Generated/ParticleBackground.tsx,
      doc: rules/generated/particle-background.md
    }
  ]
}
---
Phase 4: File Structure Updates
New Files to Create:
server/core/agent/skills/
├── components/
│   ├── index.json              # Component registry
│   └── componentsRouter.ts     # Component-specific router
├── index.json                  # (modify: add "componentsDir" field)
└── skillsRouter.ts             # (modify: integrate componentsRouter)
remotion/remotion-components/
├── SKILL.md                    # Keep as-is
├── SKILL-COMPACT.md            # NEW: Condensed version for AI
└── generated-components.json   # NEW: Registry of AI-created components
remotion/src/components/
└── Generated/                  # NEW: Directory for AI-created components
    └── index.ts                # Exports all generated components
server/core/agent/
└── promptBuilder.ts            # (modify: integrate components context)
Modifications to Existing Files:
1. server/core/agent/skills/index.json
   - Add "componentsDir": "../../../../remotion/remotion-components" field
2. server/core/agent/skills/skillsRouter.ts
   - Import and integrate ComponentsRouter
   - Add method getFullContext() that combines skills + components
3. server/core/agent/promptBuilder.ts
   - Add component context to generation prompts
   - Add component priority instructions
   - Handle component creation flow
4. server/core/agent/orchestrator.ts
   - Add detection for "needs new component" in AI response
   - Add component creation and storage pipeline
---
Phase 5: Validation & Available Packages
5.1 Update Available Packages
Add @/components to the allowed imports:
In index.json:
{
  availablePackages: [
    remotion,
    react,
    @remotion/transitions,
    @remotion/shapes,
    @remotion/media,
    @/components,
    @/components/AnimatedText,
    @/components/MockupFrame,
    @/components/Camera,
    @/components/Layout,
    @/components/DynamicCursor,
    @/components/Global,
    @/components/Transitions
  ]
}
5.2 Update Validation in Orchestrator
Modify validateCode() to:
- Accept @/components/* imports as valid
- Verify imported components exist in the registry
---
Cost Analysis
| Context Section | Estimated Tokens |
|----------------|------------------|
| Core Skills (pitfalls, animations, timing) | ~1,500 |
| Feature Skills (2-3 selected) | ~1,500 |
| Component Overview (SKILL-COMPACT.md) | ~800 |
| Component Docs (2-3 relevant) | ~2,500 |
| Prompt Template | ~800 |
| Total per request | ~7,100 tokens |
With Gemini 3 Flash pricing, this is very cost-efficient.
---
Implementation Order
| Phase | Tasks | Estimated Effort |
|-------|-------|------------------|
| 1a | Create components/index.json | 30 min |
| 1b | Create componentsRouter.ts | 2 hours |
| 1c | Modify promptBuilder.ts | 1 hour |
| 2a | Create SKILL-COMPACT.md | 1 hour |
| 2b | Implement token budget algorithm | 1 hour |
| 3 | Component creation pipeline | 3 hours |
| 4 | Update validation & packages | 1 hour |
| 5 | Testing & refinement | 2 hours |
Total: ~11 hours