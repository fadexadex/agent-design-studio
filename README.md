<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Agent Design Studio

AI-powered motion design video generator using Remotion and Gemini.

## Architecture

This app uses an AI agent (powered by Gemini 2.5 Pro) to generate Remotion compositions based on your brand context and creative brief. The generated code is then rendered server-side to produce MP4 videos.

```
Frontend (Vite/React) → Backend (Express) → AI Agent (Gemini) → Remotion Renderer → Video
```

## Run Locally

**Prerequisites:**
- Node.js (v18+)
- FFmpeg (required by Remotion for video encoding)

### 1. Install dependencies

```bash
npm install
cd remotion && npm install && cd ..
```

### 2. Configure environment

Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key:

```
GEMINI_API_KEY=your_api_key_here
```

### 3. Run the app

**Option A: Run both frontend and backend together**
```bash
npm run dev:all
```

**Option B: Run separately (in two terminals)**
```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
npm run server
```

The frontend runs on http://localhost:3000
The backend runs on http://localhost:3001

## How it works

1. Fill out the Brand Wizard with your company details, colors, and creative brief
2. The AI agent analyzes your input and generates a custom Remotion composition
3. The composition is rendered server-side to produce an MP4 video
4. Download or share your generated motion design video

## Project Structure

```
├── App.tsx                 # Main React app
├── components/             # UI components
│   ├── BrandWizard.tsx    # Multi-step brand input wizard
│   ├── MotionPreview.tsx  # Video preview component
│   └── Layout.tsx         # Page layout
├── services/
│   └── geminiService.ts   # Frontend API client
├── server/                 # Backend server
│   ├── index.ts           # Express server
│   ├── agent/             # AI agent
│   │   ├── orchestrator.ts
│   │   ├── promptBuilder.ts
│   │   └── types.ts
│   └── renderer/          # Remotion renderer
│       └── remotionRenderer.ts
└── remotion/              # Remotion project
    ├── src/
    │   ├── index.ts
    │   ├── Root.tsx
    │   └── compositions/
    └── package.json
```
