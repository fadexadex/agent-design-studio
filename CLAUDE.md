# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Install dependencies (both root and remotion)
npm install && cd remotion && npm install && cd ..

# Run both frontend and backend concurrently
npm run dev:all

# Run separately
npm run dev      # Frontend on http://localhost:3000
npm run server   # Backend on http://localhost:3001

# Remotion studio (visual editor for compositions)
cd remotion && npm run studio
```

**Prerequisites:** Node.js v18+, FFmpeg (for video encoding)

**Environment:** Set `GEMINI_API_KEY` in `.env.local`

## Architecture

This is an AI-powered motion design video generator. The system uses a ReAct (Reason-Act-Observe) cognitive architecture to generate Remotion React code from brand context, then renders it to MP4.

```
User Input → Frontend (React/Vite:3000) → Backend (Express:3001) → AgentOrchestrator
                                                                         ↓
                                                               Gemini 2.5 Pro API
                                                                         ↓
                                                         Generated Remotion Code
                                                                         ↓
                                                    Validation & Correction Loop (max 3 attempts)
                                                                         ↓
                                                         RemotionRenderer → MP4
```

### Key Backend Components

- **server/agent/orchestrator.ts** - Main ReAct loop: REASON → ACT → OBSERVE → RENDER. Handles code generation and self-correction.
- **server/agent/promptBuilder.ts** - Constructs prompts for Gemini with style-specific hints and dynamically selected skills context.
- **server/agent/skills/** - Smart Skills Router for context-efficient prompt building:
  - `skillsRouter.ts` - Keyword-based routing that selects relevant Remotion skills based on user prompt
  - `skillsIndex.ts` - Type definitions for the skills registry
  - `index.json` - Pre-built registry mapping skills to keywords and package dependencies
  - `rules/*.md` - AI-optimized markdown files with Remotion best practices and code patterns
- **server/renderer/remotionRenderer.ts** - Bundles generated compositions and renders to MP4 using Remotion.

### Key Frontend Components

- **components/BrandWizard.tsx** - Multi-step form collecting brand name, industry, colors, tagline, logo, style, aspect ratio, and creative prompt.
- **components/MotionPreview.tsx** - Video player with real-time agent progress visualization.
- **services/geminiService.ts** - API client with 400ms polling for job status.

### Remotion Project

The `remotion/` directory is a separate npm package. AI-generated compositions are written to `remotion/src/generated/` with timestamps. The agent generates complete React/TypeScript code that uses Remotion primitives (`<Sequence>`, `<AbsoluteFill>`, `useCurrentFrame()`, `interpolate()`, `spring()`).

## API Endpoints

- `POST /api/generate` - Start video generation job
- `GET /api/status/:jobId` - Poll job status (returns agent thinking steps)
- `GET /api/video/:jobId` - Stream rendered MP4
- `GET /api/health` - Health check

## Video Specifications

- Duration: 5 seconds (150 frames @ 30fps)
- Aspect ratios: 16:9 (1920x1080) or 9:16 (1080x1920)
- Codec: H.264, Output: MP4
- Resolution scale: 1.0x (1080p) or 0.667x (720p)

## Code Generation Notes

The AI agent generates Remotion compositions that must:
- Export a default React component
- Use only Remotion primitives (no external animation libraries)
- Handle the full 150-frame duration
- Apply brand colors and typography from the input

If generated code fails validation, the orchestrator runs a correction loop up to 3 times before failing.
