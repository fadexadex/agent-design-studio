Upgraded Video Generation Workflow1. Retrieval Strategy (The "Skills" Layer)For the hackathon MVP, we will leverage Remotion's "Skills" ecosystem. These are AI-optimized Markdown files that define strict coding rules. Instead of installing them at runtime, we pre-harvest them into our local knowledge_base.Step 1: Map Scene Keywords to "Skill Rules"The Remotion Skills repository breaks knowledge into specific "Rule" files. We map user intent to these high-value files.Keyword in PromptTarget Skill Rule (Source: remotion-best-practices)"bounce", "smooth", "spring"rules/timing.md, rules/animations.md"text", "typography", "title"rules/text-animations.md, rules/fonts.md"3d", "depth", "perspective"rules/3d.md (Requires @remotion/three)"audio", "sync", "music"rules/audio.md"chart", "graph", "data"rules/charts.md"layout", "responsive"rules/tailwind.md, rules/calculate-metadata.mdALWAYS INCLUDEDrules/common-pitfalls.md (Hypothetical), SKILL.md (The master instruction)Step 2: The Skills Harvester (Pre-Download Script)We fetch the raw "Rules" directly from the remotion-dev/skills GitHub. This gives us the same "intelligence" as the CLI tool but with zero runtime overhead.File: scripts/harvest_skills.tsimport fs from 'fs';
import path from 'path';
import https from 'https';

const SKILLS_DIR = path.join(process.cwd(), 'remotion_skills');
// The "Best Practices" skill contains the core logic rules
const BASE_URL = '[https://raw.githubusercontent.com/remotion-dev/skills/main/skills/remotion-dev/skills/remotion-best-practices/](https://raw.githubusercontent.com/remotion-dev/skills/main/skills/remotion-dev/skills/remotion-best-practices/)';

const TARGET_RULES = [
  'rules/animations.md',
  'rules/timing.md',
  'rules/text-animations.md',
  'rules/transitions.md',
  'rules/3d.md',
  'rules/audio.md',
  'rules/sequencing.md',
  'rules/tailwind.md'
];

async function fetchSkill(rulePath: string) {
  return new Promise((resolve, reject) => {
    // Flatten path: rules/3d.md -> 3d.md
    const fileName = path.basename(rulePath);
    const url = `${BASE_URL}${rulePath}`;
    
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        console.warn(`⚠️ Could not fetch ${rulePath} (Status: ${res.statusCode})`);
        resolve(null); 
        return;
      }
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        // Add a header so the AI knows this is a trusted Rule
        const cleanContent = `\n\n--- REMOTION SKILL RULE: ${fileName.toUpperCase()} ---\n${data}`;
        resolve(cleanContent);
      });
    }).on('error', reject);
  });
}

async function harvest() {
  if (!fs.existsSync(SKILLS_DIR)) fs.mkdirSync(SKILLS_DIR);
  
  console.log("🧠 Harvesting Remotion Skills...");
  
  const results = await Promise.all(TARGET_RULES.map(f => fetchSkill(f)));
  const fullKnowledge = results.filter(Boolean).join("\n");
  
  // Save as a single "Brain Dump" for Context 7
  fs.writeFileSync(path.join(SKILLS_DIR, 'skills_library.md'), fullKnowledge);
  console.log(`✅ Skills Harvested! Saved to remotion_skills/skills_library.md`);
}

harvest();
Step 3: Inject into Coder Agent PromptThe prompt now positions the AI as an expert who must follow the provided Skills.System Prompt Construction:"You are an expert Motion Designer. I have loaded your brain with the OFFICIAL Remotion Agent Skills below.SKILLS_LIBRARY:$$ ... Insert content of `skills_library.md` ... $$INSTRUCTIONS:Consult the Skills: Before writing code, look for a matching pattern in the SKILLS_LIBRARY (e.g., if animating text, use the text-animations patterns).Strict Adherence: Use the exact APIs recommended in the skills (e.g., spring over interpolate for natural motion).Task: Generate a React component for..."2. The Coder Agent Loop (Self-Healing)Every scene generation follows this Program-Execute-Fix cycle:Round 1: GenerationPrompt: "Generate SceneX.tsx. Use the rules/timing.md skill for the bounce effect."Constraint: "Output ONLY valid TSX code. No talk."Round 2: Automated ValidationRegex Check: Ensure all used components (e.g., <AbsoluteFill>) are imported from 'remotion'.TypeScript Check: Run a lightweight tsc --noEmit on the generated file.Round 3: The "Debugger" Intervention (If failed)If validation fails, call Gemini with: "The code you wrote failed with this error: [Error]. Fix it using the skills library."Limit: Max 2 retries. On 3rd failure, load FallbackScene.tsx.3. Parallelization Logicconst scenes = state.plan.scenes;
const generationResults = await Promise.all(
  scenes.map(async (scene) => {
    // Phase 1: Context 7 Retrieval (Now strictly Skills-based)
    const context = fs.readFileSync('remotion_skills/skills_library.md', 'utf-8');
    
    // Phase 2: Parallel Generation
    return await coderAgent.generateWithHealing(scene, context);
  })
);
4. Brand Token EnforcementHard-code a brandConfig.ts that the AI must import.Rules: The AI cannot use hex codes directly. It must use style={{ color: BRAND.primary }}.Benefit: Guarantees brand consistency even if the AI "hallucinates" a creative color.