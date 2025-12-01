export enum EntityCategory {
  ANCHOR = 'News Anchor',
  REPORTER = 'Reporter',
  PERSONALITY = 'Famous Personality',
  POLITICIAN = 'Politician',
  ATHLETE = 'Athlete',
  OTHER = 'Other'
}

export interface ProcessedNameEntry {
  id: string;
  correctName: string;
  originalVariations: string[];
  description: string;
  sourceUrl?: string;
  isVerified: boolean;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface ProcessingResult {
  entries: ProcessedNameEntry[];
  groundingSources: GroundingSource[];
}

export type ProcessingStatus = 'idle' | 'parsing' | 'processing' | 'complete' | 'error';
