# Phase 7: UI Components & Script Builder

**Objective**: Build the Workflow Dashboard and specifically the **Interactive Script Builder** requested in the diagram.

## 📂 Files to Create
1.  `/components/workflow/WorkflowDashboard.tsx` (Main Container)
2.  `/components/workflow/ScriptEditor.tsx` (⚠️ **Diagram Core Feature**)
3.  `/components/workflow/LivePreview.tsx`
4.  `/components/workflow/FeedbackControls.tsx`

---

## 1. WorkflowDashboard.tsx
**State**: Uses `useWorkflowStream(jobId)`.
**Layout**:
- Top: Phase Progress Bar (Steppers with animated pulses for active state).
- Left: **Agent Thought Stream** (Matrix/Terminal style, auto-scrolling, collapsible).
- Center (Main Canvas):
  - IF `PLANNING` -> Show **ScriptEditor** (React Flow Canvas).
    - **Floating Toolbar**: "Regenerate Plan", "Add Scene", "Auto-Layout".
  - IF `IMPLEMENTATION` / `AWAITING_FEEDBACK` -> Show **LivePreview**.
    - Split View: Video Player (Top) + Code Editor/Diff View (Bottom).
    - **Scene Selector**: Horizontal scrollable list (Carousel) of implementations.
- Bottom/Overlay: **Feedback & Controls** (Glass panel).

---

## 2. ScriptEditor.tsx (The "Script Builder" - React Flow Enhanced)
**Path**: `/components/workflow/ScriptEditor.tsx`

> 🤨 **Diagram Requirement**: "user can go in and edit the script... rearrange scenes... easily reordered"

**Technology Stack**:
- **Library**: `@xyflow/react` (React Flow)
- **Layout Engine**: `dagre` (for auto-arranging the linear script flow)
- **Icons**: `lucide-react`
- **Animations**: `framer-motion`

**Visual Design & UX**:
- **Canvas**: Dark, dotted background (`<Background variant="dots" gap={20} size={1} />`) with a subtle radial gradient overlay for depth.
- **Theme**: Glassmorphism. Panels and nodes should have `backdrop-filter: blur(10px)`, semi-transparent backgrounds, and 1px delicate borders.

**Core Components**:

### A. Custom Node: `SceneNode.tsx`
- **Visuals**:
  - **Container**: Rounded cards (`rounded-xl`), gradient border on hover/selection (e.g., `from-blue-500 to-purple-500`).
  - **Header**: Scene Number (Badge), Title (Editable), Duration estimate.
  - **Body**: Text snippet of the Visual/Audio description. Collapsible via a chevron.
  - **Handles**: `Handle` type "source" (bottom) and "target" (top) for linear flow connecting scenes.
- **Interactions**:
  - **Selection**: Highlights the node and opens the **Side Panel** property editor.
  - **Drag**: Smooth dragging with snap-to-grid.

### B. The Flow Editor
- **Initial Layout**: On load, use `dagre` to map the linear `state.plan.sceneBreakdown` array into a vertical DAG (Directed Acyclic Graph).
- **Edge Styling**:
  - type: 'smoothstep' or 'bezier'.
  - animated: `true` (running dash animation to imply "flow" of the story).
  - style: `stroke: #64748b` (slate-500).
- **Controls**: Floating glass panel with:
  - Zoom In/Out, Fit View.
  - "Auto Layout" button (triggers `dagre` re-calculation).
  - "Add Scene" (adds a new node, auto-connects if dropped on an edge).

### C. Synchronization Logic
- **Graph-to-Script**: When nodes are reordered (edges changed), the component must traverse the graph (Action: `onNodeDragStop` -> recalculate order) and emit an update to the parent.
- **Save Strategy**: A debounce function that sends the new scene order/content to `/api/workflow/:jobId/update-plan`.

**Integration**:
- Wrapped in `ReactFlowProvider`.
- Must handle `onNodesChange`, `onEdgesChange`, `onConnect`.

---

## 3. FeedbackControls.tsx (The "Refinement Loop")
**Path**: `/components/workflow/FeedbackControls.tsx`

> 🤨 **Diagram Requirement**: "User can keep prompting the AI to fix certain part of the scene"

**UI Design**:
- **Position**: Fixed bottom bar or Floating Action Panel (bottom-right).
- **Style**: "Island" design (floating pill shape), glassmorphism, high blur.

**Features**:
- **Context Awareness**:
  - If a **SceneNode** is selected in the ScriptEditor (or Scene Selector in Preview), the feedback automatically targets "Scene X".
  - "Global" vs "Selection" toggle.
- **Input**:
  - Auto-growing text area.
  - "Quick Actions" chips: "Make it faster", "More dramatic", "Fix transition".
- **States**:
  - Default: "Give Feedback".
  - Processing: Animated loader/spinner within the button.
  - Success: Checkmark animation.
- **Action**: "Iterate" (Non-destructive) vs "Finalize" (Advance workflow).

---

## ✅ Verification
- **Interaction Test**: Can I drag scene 2 to position 1?
- **State Test**: Does the feedback form unlock only when status is `AWAITING_FEEDBACK`?
