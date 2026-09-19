import { ExperienceLevel } from '@prisma/client';

export interface GeneratedIdea {
  id: string;
  title: string;
  description: string;
  problem: string;
  domain: string;
  techStack: string[];
  difficulty: ExperienceLevel;
  estimatedDuration: string;
  teamSize: string;
  features: string[];
  roadmap: string[];
  isCached?: boolean;
}
