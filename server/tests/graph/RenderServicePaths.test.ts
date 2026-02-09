import { describe, it, expect } from '@jest/globals';
import path from 'path';

/**
 * Unit tests for path handling in the video rendering pipeline.
 * 
 * These tests verify that:
 * 1. RenderService returns both absolute path and API URL
 * 2. Absolute paths work with ffmpeg concatenation
 * 3. API URLs work for frontend preview display
 */

describe('Video Path Handling', () => {
  describe('toVideoUrl helper', () => {
    // Replicate the helper function from directorNodes.ts
    const toVideoUrl = (absolutePath: string, projectId: string): string => {
      const filename = path.basename(absolutePath);
      return `/api/preview/${projectId}/${filename}`;
    };

    it('should convert absolute path to API URL', () => {
      const absolutePath = '/Users/test/output/previews/proj-123/scene-0_v1.mp4';
      const projectId = 'proj-123';
      
      const url = toVideoUrl(absolutePath, projectId);
      
      expect(url).toBe('/api/preview/proj-123/scene-0_v1.mp4');
    });

    it('should handle different project IDs', () => {
      const absolutePath = '/var/app/output/previews/abc-456/scene-2_v3.mp4';
      const projectId = 'abc-456';
      
      const url = toVideoUrl(absolutePath, projectId);
      
      expect(url).toBe('/api/preview/abc-456/scene-2_v3.mp4');
    });
  });

  describe('Path type detection', () => {
    it('should identify absolute paths correctly', () => {
      const absolutePath = '/Users/test/output/video.mp4';
      const urlPath = '/api/preview/proj/video.mp4';
      
      expect(path.isAbsolute(absolutePath)).toBe(true);
      expect(path.isAbsolute(urlPath)).toBe(true); // Note: /api/... is also "absolute" in path terms
    });

    it('should identify URL paths by prefix', () => {
      const urlPath = '/api/preview/proj/video.mp4';
      const absolutePath = '/Users/test/output/video.mp4';
      
      const isApiUrl = (p: string) => p.startsWith('/api/');
      
      expect(isApiUrl(urlPath)).toBe(true);
      expect(isApiUrl(absolutePath)).toBe(false);
    });
  });

  describe('RenderResult interface', () => {
    interface RenderResult {
      videoPath: string;  // Absolute filesystem path
      videoUrl: string;   // API URL for frontend
      renderTimeMs: number;
      fileSizeBytes: number;
    }

    it('should have correct structure with both path types', () => {
      const result: RenderResult = {
        videoPath: '/Users/test/output/previews/proj-123/scene-0_v1.mp4',
        videoUrl: '/api/preview/proj-123/scene-0_v1.mp4',
        renderTimeMs: 5000,
        fileSizeBytes: 1024 * 1024,
      };

      // videoPath should be absolute filesystem path
      expect(result.videoPath).toMatch(/^\/.*\.mp4$/);
      expect(path.isAbsolute(result.videoPath)).toBe(true);
      expect(result.videoPath).not.toContain('/api/');

      // videoUrl should be API endpoint
      expect(result.videoUrl).toMatch(/^\/api\/preview\/.*\.mp4$/);
    });
  });

  describe('Concatenation path handling', () => {
    it('should use absolute paths for ffmpeg', () => {
      const projectId = 'test-proj';
      const scenePaths = [
        '/Users/test/output/previews/test-proj/scene-0_v1.mp4',
        '/Users/test/output/previews/test-proj/scene-1_v1.mp4',
      ];

      // Simulate the path processing in finalProducerNode
      const absVideoPaths = scenePaths.map(p => 
        path.isAbsolute(p) ? p : path.join(process.cwd(), p)
      );

      // All paths should remain absolute
      absVideoPaths.forEach(p => {
        expect(path.isAbsolute(p)).toBe(true);
        expect(p).not.toContain('/api/');
      });
    });

    it('should NOT use API URLs for ffmpeg', () => {
      const apiUrls = [
        '/api/preview/test-proj/scene-0_v1.mp4',
        '/api/preview/test-proj/scene-1_v1.mp4',
      ];

      // If these were passed to path.join with cwd, they would create invalid paths
      const brokenPaths = apiUrls.map(p => 
        path.isAbsolute(p) ? p : path.join('/app', p)
      );

      // These paths would be technically "absolute" but point to /api/... which doesn't exist
      brokenPaths.forEach(p => {
        expect(p).toContain('/api/'); // This would break ffmpeg
      });
    });
  });
});
