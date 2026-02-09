/**
 * Orchestration Components - Barrel Exports
 * 
 * Centralized exports for the Director-Agent orchestration UI.
 */

// Main container
export { OrchestrationView } from './OrchestrationView';

// Panels
export { DirectorPanel } from './panels/DirectorPanel';
export { PanelWrapper } from './panels/PanelWrapper';
export { SceneGeneratorPanel } from './panels/SceneGeneratorPanel';
export { SceneQueuePanel } from './panels/SceneQueuePanel';

// Agent hierarchy (new)
export { DirectorAgentView } from './agents/DirectorAgentView';
export { SpawnedAgentCard } from './agents/SpawnedAgentCard';
export { AgentHierarchyPanel } from './agents/AgentHierarchyPanel';

// Preview (new)
export { CookingPreview } from './preview/CookingPreview';

// Scenes
export { SceneCard } from './scenes/SceneCard';
export { ApprovedSceneCard } from './scenes/ApprovedSceneCard';
export { SceneGrid } from './scenes/SceneGrid';

// Timeline
export { AgentTimeline } from './timeline/AgentTimeline';
export { TimelineEvent } from './timeline/TimelineEvent';
export { CollapsedEventGroup } from './timeline/CollapsedEventGroup';

// Health indicators
export { ProjectHealthBar } from './health/ProjectHealthBar';
export { IterationProgress } from './health/IterationProgress';

// Shared components
export { TrendIndicator } from './shared/TrendIndicator';
export { SatisfactionMeter } from './shared/SatisfactionMeter';
export { ConfidenceBadge } from './shared/ConfidenceBadge';

// Controls
export { InterventionFAB } from './controls/InterventionFAB';
export { KillConfirmModal } from './controls/KillConfirmModal';
