# Backend Architecture - Refactored

## Overview

The backend has been refactored into a modular architecture with clear separation of concerns and barrel exports for easier management.

## Directory Structure

```
server/
├── api/                      # API Layer
│   ├── middleware/          # Express middleware
│   │   ├── cors.ts         # CORS configuration
│   │   ├── errorHandler.ts # Global error handling
│   │   └── index.ts        # Barrel export
│   ├── routes/             # API route handlers
│   │   ├── workflow.routes.ts
│   │   ├── editor.routes.ts
│   │   ├── script.routes.ts
│   │   ├── video.routes.ts
│   │   ├── utility.routes.ts
│   │   └── index.ts        # Barrel export
│   ├── server.ts           # Express app configuration
│   └── index.ts            # Barrel export
│
├── core/                    # Business Logic Layer
│   ├── agent/              # AI Orchestration
│   │   ├── skills/         # Specialized AI capabilities
│   │   │   ├── rules/      # Skill rules and assets
│   │   │   ├── skillsIndex.ts
│   │   │   ├── skillsRouter.ts
│   │   │   └── index.ts
│   │   ├── geminiThoughts.ts
│   │   ├── models.ts
│   │   ├── orchestrator.ts
│   │   ├── promptBuilder.ts
│   │   ├── rateLimiter.ts
│   │   ├── types.ts
│   │   └── index.ts        # Barrel export
│   │
│   ├── workflow/           # Video Generation Workflow
│   │   ├── iteration/      # Iteration logic
│   │   ├── phases/         # Workflow phases
│   │   ├── state/          # State management
│   │   ├── WorkflowOrchestrator.ts
│   │   └── index.ts        # Barrel export
│   │
│   ├── editor/             # Video Editing
│   │   ├── EditorOrchestrator.ts
│   │   ├── EditorState.ts
│   │   ├── EditorPersistence.ts
│   │   ├── editorPrompts.ts
│   │   └── index.ts        # Barrel export
│   │
│   ├── controllers/        # Request Handlers
│   │   ├── script.controller.ts
│   │   ├── video.controller.ts
│   │   ├── utility.controller.ts
│   │   └── index.ts        # Barrel export
│   │
│   ├── services/           # Business Services
│   │   ├── script.service.ts
│   │   ├── video.service.ts
│   │   ├── file.service.ts
│   │   └── index.ts        # Barrel export
│   │
│   ├── renderer/           # Video Rendering
│   │   ├── remotionRenderer.ts
│   │   └── index.ts        # Barrel export
│   │
│   └── index.ts            # Barrel export
│
├── shared/                 # Shared Utilities
│   ├── config/            # Configuration management
│   │   └── index.ts
│   ├── constants/         # Application constants
│   │   └── index.ts
│   ├── types/             # Shared TypeScript types
│   │   └── index.ts
│   ├── utils/             # Helper functions
│   │   └── index.ts
│   └── index.ts           # Barrel export
│
└── index.ts               # Main application entry point
```

## Architecture Layers

### 1. API Layer (`/api`)
- **Purpose**: Handles HTTP requests and responses
- **Responsibilities**:
  - Route definitions
  - Request validation
  - Response formatting
  - Middleware configuration
  
### 2. Core Layer (`/core`)
- **Purpose**: Contains business logic
- **Responsibilities**:
  - AI orchestration
  - Workflow management
  - Video editing
  - Request processing
  - Service logic

### 3. Shared Layer (`/shared`)
- **Purpose**: Common utilities and configurations
- **Responsibilities**:
  - Type definitions
  - Constants
  - Helper functions
  - Configuration management

## Barrel Exports

Each module uses barrel exports (`index.ts`) to:
- Provide a clean public API
- Hide internal implementation details
- Make imports cleaner and more maintainable
- Enable easier refactoring

### Example Usage

**Before refactoring:**
```typescript
import { generateScriptFromAI } from '../../../server/services/scriptService';
import { WorkflowOrchestrator } from '../../../server/workflow/WorkflowOrchestrator';
```

**After refactoring:**
```typescript
import { generateScriptFromAI } from '@/core/services';
import { WorkflowOrchestrator } from '@/core/workflow';
```

## Module Descriptions

### API Modules

#### `/api/middleware`
- `cors.ts`: CORS configuration for cross-origin requests
- `errorHandler.ts`: Centralized error handling

#### `/api/routes`
- `workflow.routes.ts`: Workflow management endpoints
- `editor.routes.ts`: Video editor endpoints
- `script.routes.ts`: Script generation endpoints
- `video.routes.ts`: Video generation and retrieval
- `utility.routes.ts`: Health checks and utilities

### Core Modules

#### `/core/agent`
AI orchestration and prompt management:
- `models.ts`: Gemini API integration
- `orchestrator.ts`: AI task coordination
- `promptBuilder.ts`: Dynamic prompt generation
- `rateLimiter.ts`: API rate limiting
- `skills/`: Specialized AI capabilities

#### `/core/workflow`
Video generation workflow system:
- `WorkflowOrchestrator.ts`: Main workflow coordinator
- `phases/`: Individual workflow phases
- `iteration/`: Self-evaluation and iteration logic
- `state/`: State management and checkpoints

#### `/core/editor`
Video editing functionality:
- `EditorOrchestrator.ts`: Editor coordination
- `EditorState.ts`: Editor state management
- `EditorPersistence.ts`: State persistence
- `editorPrompts.ts`: Editor-specific prompts

#### `/core/controllers`
HTTP request handlers:
- `script.controller.ts`: Script generation handlers
- `video.controller.ts`: Video generation handlers
- `utility.controller.ts`: Utility endpoint handlers

#### `/core/services`
Business logic services:
- `script.service.ts`: Script generation logic
- `video.service.ts`: Video job management
- `file.service.ts`: File operations

#### `/core/renderer`
- `remotionRenderer.ts`: Remotion video rendering

### Shared Modules

#### `/shared/config`
Environment and configuration management

#### `/shared/constants`
Application-wide constants

#### `/shared/types`
Shared TypeScript types and interfaces

#### `/shared/utils`
Common helper functions

## Migration Guide

### Step 1: Run the refactoring script
```bash
cd server
chmod +x scripts/refactor-backend.sh
./scripts/refactor-backend.sh
```

### Step 2: Update import paths
The script will copy files, but you'll need to update imports:

```typescript
// Old import
import { something } from '../../../oldPath/file';

// New import
import { something } from '@/core/module';
```

### Step 3: Update TypeScript paths
Add to `tsconfig.json`:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/api/*": ["server/api/*"],
      "@/core/*": ["server/core/*"],
      "@/shared/*": ["server/shared/*"]
    }
  }
}
```

### Step 4: Update the main entry point
Replace `server/index.ts` with `server/index.new.ts`:
```bash
mv index.ts index.old.ts
mv index.new.ts index.ts
```

### Step 5: Test
```bash
npm run dev
```

## Benefits

1. **Better Organization**: Related code is grouped together
2. **Easier Navigation**: Clear module boundaries
3. **Maintainability**: Changes are isolated to specific modules
4. **Scalability**: Easy to add new features
5. **Clean Imports**: Barrel exports provide clean APIs
6. **Type Safety**: Better TypeScript support with path aliases

## Best Practices

1. **Barrel Exports**: Always use barrel exports (`index.ts`)
2. **Single Responsibility**: Each module should have one clear purpose
3. **Dependencies**: Modules should depend on abstractions, not implementations
4. **Naming**: Use descriptive names (`.controller.ts`, `.service.ts`, `.routes.ts`)
5. **Documentation**: Keep this documentation updated as the architecture evolves
