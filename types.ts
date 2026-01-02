
export type MotionStyle = 'fluid' | 'geometric' | 'minimalist' | 'brutalist' | 'cinematic';

export interface BrandContext {
  name: string;
  industry: string;
  colors: string[];
  logoBase64?: string;
  tagline: string;
}

export interface VideoConfig {
  style: MotionStyle;
  aspectRatio: '16:9' | '9:16';
  resolution: '720p' | '1080p';
  prompt: string;
}

export interface GenerationState {
  isGenerating: boolean;
  progressMessage: string;
  videoUrl?: string;
  error?: string;
}

export interface WizardStep {
  id: string;
  title: string;
  description: string;
  isComplete: boolean;
}
