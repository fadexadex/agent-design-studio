# Phase 8: Integration & Wiring

**Objective**: Connect the new system to the main App.

## 📂 Files to Modify
1.  `/App.tsx`

---

## 1. App.tsx Strategy

We need to switch from the old `BrandWizard` -> `VideoGenerator` flow to the new `BrandWizard` -> `WorkflowDashboard` flow.

**Changes**:
1.  Keep `BrandWizard` as the entry point.
2.  On `BrandWizard` submit -> Call `WorkflowService.startWorkflow()`.
3.  Get `jobId`.
4.  Navigate to `/workflow/:jobId`.
5.  Render `WorkflowDashboard` on that route.

```tsx
// App.tsx routing
<Route path="/workflow/:jobId" element={<WorkflowDashboard />} />
```

---

## ⚠️ Important Migration Note
Do **NOT** delete the old `VideoGenerator` component yet. Keep it as a fallback route `/classic` until the new workflow is fully verified.

---

## ✅ Verification
- **End-to-End Test**:
  1.  Start app.
  2.  Enter Brand details.
  3.  Click "Generate".
  4.  Verify redirect to `/workflow/...`.
  5.  Verify "Script Builder" appears after initial analysis.
  6.  Verify "Streaming Thoughts" appear in sidebar.
