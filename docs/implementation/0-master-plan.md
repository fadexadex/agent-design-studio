# PROMETHEUS: Distributed Agent Implementation Plan

> [!IMPORTANT]
> **Source**: This plan is derived from `delegated-weaving-yeti.md` and the architecture diagram `diagram-export-1-1-2026-10_30_13-PM.png`.
> **Goal**: Break down the monolithic video generation workflow into discrete, agent-implementable phases.

## 🗺️ Master Roadmap

This implementation is divided into 8 distinct phases. Agents should pick up the files in order.

### 🏗️ Foundation & Backend
- **[Phase 1: Foundation Models](1-foundation-models.md)**
  - *Goal*: Establish the `WorkflowState`, `CheckpointManager`, and `ErrorTracker`.
  - *Complexity*: Low
  - *Dependencies*: None

> ⚠️ **GLOBAL ARCHITECTURE CHANGE**: The system now requires a **Modular Scene Architecture**.
> Scenes must be generated as **separate files** (e.g., `Scene1.tsx`) rather than a monolithic Composition. 
> This is critical for the "Live Preview" and "Incremental Fix" features.

- **[Phase 2: Phase System Core](2-phase-execution-engine.md)**
  - *Goal*: Build the `PhaseManager` and the 6 core workflow phases (Planning, Implementation, etc.).
  - *Complexity*: High
  - *Dependencies*: Phase 1

- **[Phase 3: Iteration & Evaluation](3-iteration-logic.md)**
  - *Goal*: Implement the "Brain" (SelfEvaluator) and proper branching logic.
  - *Complexity*: Medium
  - *Dependencies*: Phase 1

- **[Phase 4: Workflow Orchestrator](4-workflow-orchestrator.md)**
  - *Goal*: The main engine that ties phases together and manages the prompt lifecycle.
  - *Complexity*: Medium
  - *Dependencies*: Phase 2, Phase 3

- **[Phase 5: API & Streaming Layer](5-api-and-streaming.md)**
  - *Goal*: Expose the workflow via API. **Note: Includes WebSocket/SSE streaming per diagram requirements.**
  - *Complexity*: Medium
  - *Dependencies*: Phase 4

### 🖥️ Frontend & Integration
- **[Phase 6: Frontend Services](6-frontend-service.md)**
  - *Goal*: Client-side API consumers and state management.
  - *Complexity*: Low
  - *Dependencies*: Phase 5

- **[Phase 7: UI Components & Script Builder](7-ui-components.md)**
  - *Goal*: The visual dashboard. **Note: Includes the interactive "Script Builder" and "Scene Editor".**
  - *Complexity*: High
  - *Dependencies*: Phase 6

- **[Phase 8: Integration & Wiring](8-app-integration.md)**
  - *Goal*: Connect the new dashboard to the main App and handle routing.
  - *Complexity*: Medium
  - *Dependencies*: Phase 7

## 🚦 Protocol for Agents

1.  **Read your assigned file completely.**
2.  **Check Dependencies**: Ensure previous phases are completed (files exist and compile).
3.  **Follow "Raised Eyebrow" Items**: Pay special attention to items marked with 🤨 or ⚠️ in the individual plans—these differentiate this plan from standard implementations (e.g., Streaming requirements).
4.  **Verify**: Run the specified verification steps before marking complete.

## 📐 System Visual Architecture

```mermaid
graph TD
    subgraph "User Interface Layer (Frontend)"
        Dashboard[Workflow Dashboard]
        ScriptUI[Script Editor (Drag-and-Drop)]
        Preview[Live Preview Player]
        Matrix[Thought Console]
    end

    subgraph "Communication Layer"
        Stream[Server-Sent Events (SSE)]
        API[REST API]
    end

    subgraph "Backend Orchestration Space"
        Orchestrator[Workflow Orchestrator]
        PhaseMgr[Phase Manager]
        
        subgraph "Workflow Phases"
            Planning[Planning Phase]
            Impl[Implementation Phase]
            Eval[Evaluation Phase]
        end
        
        Brain[Iteration Controller]
    end

    subgraph "Data & State"
        State[WorkflowState]
        Checkpoints[Checkpoint Manager]
        Scenes[Modular Scene Files]
    end

    %% Connections
    Dashboard --> API
    API --> Orchestrator
    Orchestrator --> Stream
    Stream -.-> Matrix
    Stream -.-> Dashboard

    Orchestrator --> PhaseMgr
    PhaseMgr --> Planning
    PhaseMgr --> Impl
    PhaseMgr --> Eval
    
    Planning --> State
    Impl --> Scenes
    Impl --> Checkpoints
    
    Eval --> Brain
    Brain -->|Loop/Next| Orchestrator
    
    ScriptUI <-->|Update Plan| Planning
    Preview <-->|Render| Scenes
    
    classDef ui fill:#1a1b26,stroke:#7aa2f7,color:#fff;
    classDef logic fill:#24283b,stroke:#bb9af7,color:#fff;
    classDef data fill:#24283b,stroke:#9ece6a,color:#fff;
    
    class Dashboard,ScriptUI,Preview,Matrix ui;
    class Orchestrator,PhaseMgr,Planning,Impl,Eval,Brain,Stream logic;
    class State,Checkpoints,Scenes data;
```
