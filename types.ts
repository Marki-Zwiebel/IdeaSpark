
export enum IdeaStatus {
  IDEA = 'Idea',
  DEVELOPMENT = 'Development',
  TESTING = 'Testing',
  PUBLISHED = 'Published'
}

export type IdeaCategory = 'Work' | 'Leisure' | 'Side Project' | 'Other';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
}

export interface AppIdea {
  id: string;
  userId: string;
  title: string;
  description: string;
  status: IdeaStatus;
  category: IdeaCategory;
  importance: number; // 1-5
  targetAudience: string;
  platform: string; // Desktop, Mobile, Tablet, TV
  appUrl?: string;
  devPrompt: string;
  createdAt: number;
  tags: string[];
  imageUrl?: string;
}

export interface VoiceAnalysisResponse {
  title: string;
  description: string;
  category: IdeaCategory;
  importance: number;
  targetAudience: string;
  platform: string;
  tags: string[];
  devPrompt: string;
}
