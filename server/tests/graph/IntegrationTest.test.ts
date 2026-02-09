/**
 * Integration Test for Director-Scene LangGraph Pipeline
 *
 * This test validates the complete graph flow with partially real services:
 * - Planning: Uses real AI (or can mock)
 * - Generation: Uses real AI code generation
 * - Rendering: Mocked (expensive/slow)
 * - Evaluation: Uses real AI evaluation
 * - Concatenation: Mocked
 *
 * Run with: npm test server/tests/graph/IntegrationTest.test.ts
 */

import { describe, it, expect, jest, beforeAll, afterAll } from '@jest/globals';
import { directorGraph } from '../../agents/graph/workflows/directorGraph.js';
import { PlanningService } from '../../agents/graph/services/PlanningService.js';
import { GenerationService } from '../../agents/graph/services/GenerationService.js';
import { RenderService } from '../../agents/graph/services/RenderService.js';
import { EvaluationService } from '../../agents/graph/services/EvaluationService.js';
import { ConcatenationService } from '../../agents/graph/services/ConcatenationService.js';
import { BrandContext } from '../../agents/types.js';
import * as dotenv from 'dotenv';
import path from 'path';

import { VIDEO_CONFIG } from '../../core/constants/video.constants.js';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const TEST_BRAND: BrandContext = {
  name: 'TestCorp',
  industry: 'Technology',
  tagline: 'Innovation Made Simple',
  colors: {
    primary: '#4F46E5',
    secondary: '#10B981',
    accent: '#F59E0B',
  },
  style: 'dynamic',
  aspectRatio: '16:9',
  prompt: 'Create a simple 2-step onboarding video. Step 1: Welcome message. Step 2: Get started button.',
};

// Track if we have API key for real tests
const hasApiKey = !!process.env.GEMINI_API_KEY;

describe('Director Graph Integration', () => {
  // Always mock render and concatenation since they are expensive
  beforeAll(() => {
    // Mock RenderService - always mock since it requires bundling
    jest.spyOn(RenderService, 'renderScene').mockImplementation(async (
      projectId: string,
      sceneId: string,
      sceneIndex: number,
      version: number,
    ) => ({
      videoPath: `/mock/output/${projectId}/${sceneId}_v${version}.mp4`,
      renderTimeMs: 100,
      fileSizeBytes: 1024 * 50,
    }));

    // Mock ConcatenationService - always mock since it requires ffmpeg
    jest.spyOn(ConcatenationService, 'concatenateVideos').mockImplementation(async () => {
      // Just return, video path is set by finalProducerNode
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('with mocked AI services', () => {
    beforeAll(() => {
      // Mock PlanningService to return a simple 2-scene plan
      jest.spyOn(PlanningService, 'createVideoPlan').mockImplementation(async () => ({
        totalFrames: 150,
        fps: 30,
        width: 1920,
        height: 1080,
        aspectRatio: '16:9' as const,
        scenes: [
          {
            id: 'scene-0',
            index: 0,
            title: 'Welcome',
            description: 'Welcome message with brand name',
            durationFrames: 75,
            startFrame: 0,
          },
          {
            id: 'scene-1',
            index: 1,
            title: 'Get Started',
            description: 'Call to action button animation',
            durationFrames: 75,
            startFrame: 75,
          },
        ],
      }));

      // Mock GenerationService to return valid Remotion code
      jest.spyOn(GenerationService, 'generateScene').mockImplementation(async (
        projectId: string,
        sceneId: string,
        sceneIndex: number,
      ) => ({
        code: `
import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';

export default function Scene${sceneIndex}() {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center' }}>
      <h1 style={{ color: 'white', fontSize: 72, opacity }}>
        ${sceneIndex === 0 ? 'Welcome to TestCorp' : 'Get Started Now'}
      </h1>
    </AbsoluteFill>
  );
}
`,
        generationTimeMs: 500,
      }));

      // Mock EvaluationService to return passing scores
      jest.spyOn(EvaluationService, 'evaluateScene').mockImplementation(async () => ({
        score: 0.85,
        passed: true,
        shouldEscalate: false,
        feedback: 'Good quality scene with proper animations',
        details: {
          codeQuality: 0.85,
          visualAppeal: 0.82,
          brandAlignment: 0.88,
          technicalCorrectness: 0.90,
        },
        issues: [],
        suggestions: [],
        evaluationTimeMs: 200,
      }));
    });

    it('should complete the full pipeline with 2 scenes', async () => {
      const inputState = {
        projectId: 'integration-test-1',
        brandContext: TEST_BRAND,
        scenes: [],
      };

      const result = await directorGraph.invoke(inputState, { recursionLimit: 50 });

      // Verify completion
      expect(result.status).toBe('completed');
      expect(result.scenes).toHaveLength(2);
      expect(result.finalOutput).toBeDefined();

      // Verify each scene passed
      for (const scene of result.scenes) {
        expect(scene.status).toBe('passed');
        expect(scene.code).toBeDefined();
        expect(scene.videoPath).toBeDefined();
      }

      // Verify service calls
      expect(PlanningService.createVideoPlan).toHaveBeenCalledTimes(1);
      expect(GenerationService.generateScene).toHaveBeenCalledTimes(2);
      expect(RenderService.renderScene).toHaveBeenCalledTimes(2);
      expect(EvaluationService.evaluateScene).toHaveBeenCalledTimes(2);
      expect(ConcatenationService.concatenateVideos).toHaveBeenCalledTimes(1);
    }, 30000);

    it('should handle scene refinement when evaluation fails', async () => {
      // Reset mocks
      jest.clearAllMocks();

      // Make evaluation fail first time for scene-1, pass second time
      const evaluateSpy = EvaluationService.evaluateScene as jest.MockedFunction<typeof EvaluationService.evaluateScene>;
      evaluateSpy
        .mockResolvedValueOnce({
          score: 0.9,
          passed: true,
          shouldEscalate: false,
          feedback: 'Scene 0 looks good',
          details: { codeQuality: 0.9, visualAppeal: 0.9, brandAlignment: 0.9, technicalCorrectness: 0.9 },
          issues: [],
          suggestions: [],
          evaluationTimeMs: 100,
        })
        .mockResolvedValueOnce({
          score: 0.4,
          passed: false,
          shouldEscalate: false,
          feedback: 'Scene 1 needs improvement - animations too simple',
          details: { codeQuality: 0.5, visualAppeal: 0.3, brandAlignment: 0.5, technicalCorrectness: 0.4 },
          issues: [{ category: 'visual', severity: 'high', description: 'Animations too basic' }],
          suggestions: ['Add spring animations'],
          evaluationTimeMs: 100,
        })
        .mockResolvedValueOnce({
          score: 0.85,
          passed: true,
          shouldEscalate: false,
          feedback: 'Scene 1 improved significantly',
          details: { codeQuality: 0.85, visualAppeal: 0.85, brandAlignment: 0.85, technicalCorrectness: 0.85 },
          issues: [],
          suggestions: [],
          evaluationTimeMs: 100,
        });

      const inputState = {
        projectId: 'integration-test-refinement',
        brandContext: TEST_BRAND,
        scenes: [],
      };

      const result = await directorGraph.invoke(inputState, { recursionLimit: 50 });

      expect(result.status).toBe('completed');
      expect(result.scenes).toHaveLength(2);

      // Scene 0 should pass on first try
      const scene0 = result.scenes.find((s: any) => s.sceneIndex === 0);
      expect(scene0?.status).toBe('passed');
      expect(scene0?.attempts).toBe(1);

      // Scene 1 should have been refined
      const scene1 = result.scenes.find((s: any) => s.sceneIndex === 1);
      expect(scene1?.status).toBe('passed');
      expect(scene1?.attempts).toBe(2);

      // Verify generation was called 3 times (1 for scene-0, 2 for scene-1)
      expect(GenerationService.generateScene).toHaveBeenCalledTimes(3);
    }, 30000);
  });

  // Only run real AI tests if we have an API key
  (hasApiKey ? describe : describe.skip)('with real AI services (requires GEMINI_API_KEY)', () => {
    beforeAll(() => {
      // Restore AI mocks but keep render/concat mocked
      jest.spyOn(PlanningService, 'createVideoPlan').mockRestore();
      jest.spyOn(GenerationService, 'generateScene').mockRestore();
      jest.spyOn(EvaluationService, 'evaluateScene').mockRestore();
    });

    it('should generate a real video plan from brand context', async () => {
      const plan = await PlanningService.createVideoPlan(TEST_BRAND);

      expect(plan).toBeDefined();
      expect(plan.scenes.length).toBeGreaterThanOrEqual(2);
      expect(plan.totalFrames).toBe(VIDEO_CONFIG.TOTAL_FRAMES);
      expect(plan.fps).toBe(VIDEO_CONFIG.FPS);

      console.log('Generated plan:', JSON.stringify(plan.scenes.map(s => ({
        title: s.title,
        duration: s.durationFrames,
      })), null, 2));
    }, 60000);

    it('should generate valid Remotion code for a scene', async () => {
      const result = await GenerationService.generateScene(
        'real-test-project',
        'scene-0',
        0,
        1,
        'Create a simple welcome animation with the brand name fading in',
        TEST_BRAND,
      );

      expect(result.code).toBeDefined();
      expect(result.code).toContain('export default');
      expect(result.code).toMatch(/from\s+['"]remotion['"]/);
      expect(result.generationTimeMs).toBeGreaterThan(0);

      console.log('Generated code length:', result.code.length);
      console.log('Generation time:', result.generationTimeMs, 'ms');
    }, 180000);

    it('should evaluate generated code', async () => {
      // First generate code
      const genResult = await GenerationService.generateScene(
        'eval-test-project',
        'scene-0',
        0,
        1,
        'Create a logo reveal animation',
        TEST_BRAND,
      );

      // Then evaluate it
      const evalResult = await EvaluationService.evaluateScene({
        projectId: 'eval-test-project',
        sceneId: 'scene-0',
        sceneIndex: 0,
        version: 1,
        code: genResult.code,
        brandContext: TEST_BRAND,
        sceneDescription: 'Logo reveal animation',
      });

      expect(evalResult.score).toBeGreaterThan(0);
      expect(evalResult.score).toBeLessThanOrEqual(1);
      expect(evalResult.feedback).toBeDefined();

      console.log('Evaluation result:', {
        score: evalResult.score,
        passed: evalResult.passed,
        feedback: evalResult.feedback,
        details: evalResult.details,
      });
    }, 180000);
  });
});
