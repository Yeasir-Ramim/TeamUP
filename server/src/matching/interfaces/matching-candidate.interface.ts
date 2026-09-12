import { ExperienceLevel } from '@prisma/client';

export interface MatchingCandidate {
  id: string;
  userId: string;
  fullName: string;
  email?: string;
  avatarUrl?: string;
  bio?: string;
  department?: string;
  semester?: string;
  experienceLevel?: ExperienceLevel;
  matchScore: number; // 0 to 100 percentage
  matchingSkills: string[];
  skills: Array<{ id: string; skillName: string }>;
  githubUsername?: string;
  contributionsThisYear?: number;
  publicRepos?: number;
  invited: boolean;
}
