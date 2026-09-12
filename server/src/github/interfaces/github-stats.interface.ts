export interface GitHubStats {
  username?: string;
  publicRepos?: number;
  followers?: number;
  contributionsThisYear?: number;
  totalStars?: number;
  topLanguages?: string[];
  avatarUrl?: string;
  connected: boolean;
  cached?: boolean;
  warning?: string;
  error?: string;
  fetchedAt?: number;
}
