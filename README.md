<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Agent Design Studio

AI-powered motion design video generator using Remotion and Gemini.

## Architecture

This app uses an AI agent (powered by Gemini 2.5 Pro) to generate Remotion compositions based on your brand context and creative brief. The generated code is then rendered server-side to produce MP4 videos.


```mermaid
graph TD
    %% Node Styling
    classDef client fill:#e3f2fd,stroke:#1565c0,stroke-width:2px,color:#0d47a1;
    classDef server fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px,color:#4a148c;
    classDef ai fill:#fff3e0,stroke:#e65100,stroke-width:2px,color:#e65100;
    classDef file fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px,color:#1b5e20;
    classDef render fill:#ffebee,stroke:#c62828,stroke-width:2px,color:#b71c1c;

    subgraph Client [Frontend (Vite/React)]
        Wizard[Brand Wizard]:::client
        Dashboard[Workflow Dashboard]:::client
        Player[Video Player]:::client
    end

    subgraph Backend [Backend Server (Express)]
        API[API Layer]:::server
        Orch[Workflow Orchestrator]:::server
        LangGraph[LangGraph Executor]:::server
        Renderer[Remotion Renderer]:::server
    end

    subgraph AI [AI & Generation]
        Gemini[Gemini 2.5 Pro]:::ai
        Director[Director Agent]:::ai
        SceneGen[Scene Generator]:::ai
    end

    subgraph CodeGen [Generated Remotion Code]
        SceneFiles[Scene1.tsx, Scene2.tsx...]:::file
        MainComp[MainComposition.tsx]:::file
    end

    subgraph Engine [Rendering Engine]
        Bundle[Webpack Bundle]:::render
        Chrome[Headless Chrome]:::render
        FFmpeg[FFmpeg Encoding]:::render
        Video[MP4 Output]:::file
    end

    %% Data Flow
    Wizard -- "1. Brand Context & Brief" --> API
    API --> Orch
    
    Orch -- "2. Start Workflow" --> LangGraph
    LangGraph -- "Orchestrates" --> Director
    
    Director -- "Plan & Critique" --> Gemini
    Director -- "Task Assignment" --> SceneGen
    
    SceneGen -- "Generate Code" --> Gemini
    Gemini -- "React Components" --> SceneFiles
    SceneFiles -. "Imported by" .-> MainComp
    
    Orch -- "3. Trigger Render" --> Renderer
    Renderer --> Bundle
    MainComp --> Bundle
    
    Bundle --> Chrome
    Chrome -- "Frames" --> FFmpeg
    FFmpeg --> Video
    
    Video -- "4. Stream URL" --> Player
    Orch -- "SSE Updates" --> Dashboard
```


## Run Locally

**Prerequisites:**
- **Node.js** (v18+)
- **FFmpeg** - Required by Remotion for video encoding
  - macOS: `brew install ffmpeg`
  - Windows: Download from [ffmpeg.org](https://ffmpeg.org/download.html) and add to PATH
  - Linux: `sudo apt install ffmpeg`
- **Chrome/Chromium** - Required by Remotion for rendering
  - Remotion will attempt to download Chrome Headless Shell automatically on first render
  - If the download times out (common on slow networks), install Chrome manually and Remotion will detect it

### 1. Install dependencies

```bash
npm install
```

> **Note:** This will automatically install dependencies in the `remotion/` folder via the postinstall script.

#### Troubleshooting: Chrome Headless Shell Download Issues

If you see an error like `"Tried to download file... but the server sent no data"`, you have two options:

1. **Use your existing Chrome installation** - Set this environment variable:
   ```bash
   # macOS/Linux
   export PUPPETEER_EXECUTABLE_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
   
   # Windows (PowerShell)
   $env:PUPPETEER_EXECUTABLE_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe"
   ```

2. **Retry the download** - Sometimes it's just a network timeout, try running the server again.

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
