# Phase 5: API & Streaming Layer

**Objective**: Expose the workflow to the frontend.
> ⚠️ **CRITICAL REQUIREMENT**: The diagram specifies "streams its thoughts". We must use **Server-Sent Events (SSE)** or **WebSockets**. This plan uses SSE for simplicity and robustness with the existing Express server.

## 📂 Files to Modify/Create
1.  `/server/index.ts` (Add endpoints)
2.  `/server/routes/workflowRoutes.ts` (New file)

---

## 1. API Endpoints

**Base Path**: `/api/workflow`

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/start` | init workflow, returns `{ jobId }` |
| GET | `/:jobId/stream` | **SSE Endpoint**. Stream state updates & thoughts. |
| POST | `/:jobId/feedback` | Send user approval/rejection. |
| POST | `/:jobId/continue` | Resume paused workflow. |
| GET | `/:jobId/checkpoints` | List checkpoints. |
| POST | `/:jobId/checkpoint/:id/restore` | Rollback code. |

---

## 2. Server-Sent Events (SSE) Implementation

In `/server/routes/workflowRoutes.ts`:

```typescript
router.get('/:jobId/stream', (req, res) => {
  const { jobId } = req.params;
  
  // Set SSE Headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  const orchestrator = orchestratorMap.get(jobId);
  
  // Handler for updates
  const onUpdate = (state: WorkflowState) => {
    res.write(`data: ${JSON.stringify(state)}\n\n`);
  };

  // Attach listener
  orchestrator.on('stateUpdate', onUpdate);
  
  // Cleanup
  req.on('close', () => {
    orchestrator.off('stateUpdate', onUpdate);
  });
});
```

> 🤨 **Why SSE?** The user diagram asked for streaming "thoughts".
> SSE allows us to push `state.thoughts` array updates in real-time as the agent "thinks", fulfilling the "Matrix code" visual requirement.

---

## ✅ Verification
- **Curl Test**: `curl -N http://localhost:3000/api/workflow/{id}/stream`
- Verify you see a stream of `data: {...}` payloads.
- Verify user feedback POST triggers a new event in the stream.
