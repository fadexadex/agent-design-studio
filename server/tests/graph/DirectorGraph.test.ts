import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { directorGraph } from '../../agents/graph/workflows/directorGraph.js';
import { PlanningService } from '../../agents/graph/services/PlanningService.js';
import { GenerationService } from '../../agents/graph/services/GenerationService.js';
import { RenderService } from '../../agents/graph/services/RenderService.js';
import { EvaluationService } from '../../agents/graph/services/EvaluationService.js';
import { ConcatenationService } from '../../agents/graph/services/ConcatenationService.js';
import { BrandContext } from '../../agents/types.js';

// Mock Services
jest.mock('../../agents/graph/services/PlanningService.js');
jest.mock('../../agents/graph/services/GenerationService.js');
jest.mock('../../agents/graph/services/RenderService.js');
jest.mock('../../agents/graph/services/EvaluationService.js');
jest.mock('../../agents/graph/services/ConcatenationService.js');

describe('DirectorGraph', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should plan, generate, refine, and produce final video', async () => {
    // 1. Mock Planning
    const mockPlan = {
      scenes: [
        { id: 'scene-0', index: 0, description: 'S1', durationFrames: 90 },
        { id: 'scene-1', index: 1, description: 'S2', durationFrames: 90 },
      ],
    };
    (PlanningService.createVideoPlan as unknown as jest.Mock).mockResolvedValue(mockPlan);

    // 2. Mock Generation
    (GenerationService.generateScene as unknown as jest.Mock).mockResolvedValue({
      code: 'mock-code',
      generationTimeMs: 100,
    });

    // 3. Mock Rendering - returns both absolute path and URL
    (RenderService.renderScene as unknown as jest.Mock).mockResolvedValue({
      videoPath: '/Users/test/output/previews/test-project/scene-0_v1.mp4',
      videoUrl: '/api/preview/test-project/scene-0_v1.mp4',
      renderTimeMs: 200,
      fileSizeBytes: 1024,
    });

    // 4. Mock Evaluation
    // Scene 0 passes first try
    // Scene 1 fails first try, passes second try
    const mockEvaluate = EvaluationService.evaluateScene as unknown as jest.Mock;
    mockEvaluate
      .mockImplementationOnce(async () => ({ score: 0.9, passed: true, feedback: 'Great' })) // Scene 0 attempt 1
      .mockImplementationOnce(async () => ({ score: 0.4, passed: false, feedback: 'Bad' }))  // Scene 1 attempt 1
      .mockImplementationOnce(async () => ({ score: 0.8, passed: true, feedback: 'Fixed' })); // Scene 1 attempt 2

    // 5. Mock Concatenation
    (ConcatenationService.concatenateVideos as unknown as jest.Mock).mockResolvedValue(undefined);

    // Run Graph
    const inputState = {
      projectId: 'test-project',
      brandContext: { name: 'TestBrand' } as BrandContext,
      scenes: [],
    };

    // Need to increase timeout for graph execution
    const result = await directorGraph.invoke(inputState, { recursionLimit: 50 });

    // Verify Output
    expect(result.status).toBe('completed');
    expect(result.finalOutput).toContain('video.mp4');
    expect(result.scenes).toHaveLength(2);

    // Verify Scene 0
    const s0 = result.scenes.find((s: any) => s.sceneIndex === 0);
    expect(s0).toBeDefined();
    expect(s0.status).toBe('passed');
    expect(s0.attempts).toBe(1);

    // Verify Scene 1 (Refined)
    const s1 = result.scenes.find((s: any) => s.sceneIndex === 1);
    expect(s1).toBeDefined();
    expect(s1.status).toBe('passed');
    expect(s1.attempts).toBe(2);

    // Verify Service Calls
    expect(PlanningService.createVideoPlan).toHaveBeenCalledTimes(1);
    expect(GenerationService.generateScene).toHaveBeenCalledTimes(3); // 1 + 2
    expect(RenderService.renderScene).toHaveBeenCalledTimes(3);       // 1 + 2
    expect(EvaluationService.evaluateScene).toHaveBeenCalledTimes(3); // 1 + 2
    expect(ConcatenationService.concatenateVideos).toHaveBeenCalledTimes(1);
  }, 30000);
});
