# Phase 6: Frontend Service Layer

**Objective**: Client-side communication.

## 📂 Files to Create
1.  `/services/WorkflowService.ts`
2.  `/hooks/useWorkflowStream.ts` (Custom hook for SSE)

---

## 1. WorkflowService.ts

Standard fetch wrappers for the REST endpoints defined in Phase 5.
- `startWorkflow(config)`
- `sendFeedback(jobId, feedback)`
- `restoreCheckpoint(jobId, checkpointId)`
- `updatePlan(jobId, newPlan)`: Sends the modified scene list (from React Flow) to the backend.

---

## 2. useWorkflowStream Hook
**Path**: `/hooks/useWorkflowStream.ts`

**Goal**: Abstract the EventSource complexity from the UI.

```typescript
export function useWorkflowStream(jobId: string) {
  const [state, setState] = useState<WorkflowState | null>(null);
  
  useEffect(() => {
    if (!jobId) return;
    
    const eventSource = new EventSource(\`/api/workflow/\${jobId}/stream\`);
    
    eventSource.onmessage = (event) => {
      const parsed = JSON.parse(event.data);
      setState(parsed);
    };
    
    return () => eventSource.close();
  }, [jobId]);
  
  return state;
}
```

---

## ✅ Verification
- Integrate hook in a dummy component.
- Check browser network tab -> Ensure "EventStream" connection is kept alive.
