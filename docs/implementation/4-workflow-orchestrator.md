# Phase 4: Workflow Orchestrator

**Objective**: The main engine that ties phases together.

## 📂 Files to Create
1.  `/server/workflow/WorkflowOrchestrator.ts`

---

## 1. Workflow Orchestrator
**Path**: `/server/workflow/WorkflowOrchestrator.ts`

**Responsibilities**:
- Maintain the `WorkflowState` in memory.
- Loop through phases until `COMPLETE` or `AWAITING_FEEDBACK`.
- **Streaming**: Emit events to the listeners (prepared for Phase 5).

```typescript
import { EventEmitter } from 'events';

export class WorkflowOrchestrator extends EventEmitter {
  private state: WorkflowState;
  private phaseManager: PhaseManager;
  private iterationController: IterationController;

  async start() {
    this.state.currentPhase = WorkflowPhase.QUERY_ENHANCEMENT;
    this.runLoop();
  }

  private async runLoop() {
    while (!this.isTerminal(this.state.currentPhase)) {
    
      // 1. Notify listeners (WebSocket will pick this up)
      this.emit('stateUpdate', this.state);
      
      // 2. Pause if waiting for user
      if (this.state.currentPhase === WorkflowPhase.AWAITING_FEEDBACK) {
        break; // Stop loop, wait for API call to resume
      }
      
      // 3. Execute Phase
      this.state = await this.phaseManager.executePhase(this.state.currentPhase, this.state);
      
      // 4. Determine Next Phase
      this.state.currentPhase = this.iterationController.determineNextPhase(this.state);
    }
    
    this.emit('stateUpdate', this.state);
  }
  
  // Method to resume after feedback
  async handleUserFeedback(feedback: UserFeedback) {
    this.state.userFeedback = feedback;
    this.state.currentPhase = WorkflowPhase.PLANNING; // Go back to planning/implementing with new feedback
    this.runLoop(); // Restart loop
  }
}
```

---

## ✅ Verification
- Test `runLoop` allows pausing at `AWAITING_FEEDBACK`.
- Test `handleUserFeedback` resumes the loop.
