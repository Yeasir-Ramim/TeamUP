import { api } from '../api/client';

export interface TaskCompletionDataPoint {
  date: string;       // ISO date string e.g. "2026-09-15"
  completed: number;
  created: number;
}

export interface MemberContribution {
  memberId: string;
  memberName: string;
  avatarInitial: string;
  tasksCompleted: number;
  tasksAssigned: number;
  completionRate: number; // 0–100
}

export interface ActivityDataPoint {
  date: string;
  commits?: number;
  messages: number;
  tasksUpdated: number;
}

export interface ProjectAnalytics {
  projectId: string;
  generatedAt: string;

  // Summary totals
  totalTasks: number;
  completedTasks: number;
  overallCompletionRate: number; // 0–100

  // Task status breakdown
  tasksByStatus: {
    TODO: number;
    IN_PROGRESS: number;
    TESTING: number;
    DONE: number;
  };

  // Task priority breakdown
  tasksByPriority: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
  };

  // Time-series data (last 14 days by default)
  taskCompletionOverTime: TaskCompletionDataPoint[];

  // Per-member contribution
  memberContributions: MemberContribution[];

  // Team activity over time
  activityOverTime: ActivityDataPoint[];

  // File & chat stats
  totalFiles: number;
  totalMessages: number;
}

export function normalizeProjectAnalytics(raw: any, projectId: string = ''): ProjectAnalytics {
  if (!raw) {
    return {
      projectId,
      generatedAt: new Date().toISOString(),
      totalTasks: 0,
      completedTasks: 0,
      overallCompletionRate: 0,
      tasksByStatus: { TODO: 0, IN_PROGRESS: 0, TESTING: 0, DONE: 0 },
      tasksByPriority: { LOW: 0, MEDIUM: 0, HIGH: 0 },
      taskCompletionOverTime: [],
      memberContributions: [],
      activityOverTime: [],
      totalFiles: 0,
      totalMessages: 0,
    };
  }

  // Task status breakdown
  const rawStatus = raw.tasksByStatus || raw.tasks?.byStatus || {};
  const tasksByStatus = {
    TODO: Number(rawStatus.TODO ?? 0),
    IN_PROGRESS: Number(rawStatus.IN_PROGRESS ?? 0),
    TESTING: Number(rawStatus.TESTING ?? 0),
    DONE: Number(rawStatus.DONE ?? 0),
  };

  // Task priority breakdown
  const rawPriority = raw.tasksByPriority || raw.tasks?.byPriority || {};
  const tasksByPriority = {
    LOW: Number(rawPriority.LOW ?? 0),
    MEDIUM: Number(rawPriority.MEDIUM ?? 0),
    HIGH: Number(rawPriority.HIGH ?? 0),
  };

  // Totals
  const totalTasks = Number(
    raw.totalTasks ??
    raw.tasks?.byStatus?.total ??
    (tasksByStatus.TODO + tasksByStatus.IN_PROGRESS + tasksByStatus.TESTING + tasksByStatus.DONE)
  );
  const completedTasks = Number(raw.completedTasks ?? tasksByStatus.DONE);
  const overallCompletionRate = Number(
    raw.overallCompletionRate ??
    raw.tasks?.completionRate ??
    (totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0)
  );

  // Files & Messages
  const totalFiles = Number(
    raw.totalFiles ??
    raw.activity?.files?.total ??
    0
  );
  const totalMessages = Number(
    raw.totalMessages ??
    raw.activity?.messages?.total ??
    0
  );

  // Member contributions
  let memberContributions: MemberContribution[] = [];
  if (Array.isArray(raw.memberContributions)) {
    memberContributions = raw.memberContributions;
  } else if (Array.isArray(raw.members?.members)) {
    memberContributions = raw.members.members.map((m: any) => {
      const name = m.user?.profile?.fullName || m.user?.email || 'Member';
      return {
        memberId: m.user?.id || '',
        memberName: name,
        avatarInitial: (name.charAt(0) || 'M').toUpperCase(),
        tasksCompleted: Number(m.contributions?.tasksCompleted ?? 0),
        tasksAssigned: Number(m.contributions?.tasksAssigned ?? 0),
        completionRate: Number(m.contributions?.taskCompletionRate ?? 0),
      };
    });
  }

  // Activity over time
  let activityOverTime: ActivityDataPoint[] = [];
  if (Array.isArray(raw.activityOverTime)) {
    activityOverTime = raw.activityOverTime;
  } else if (Array.isArray(raw.activity?.dailyActivity)) {
    activityOverTime = raw.activity.dailyActivity.map((a: any) => ({
      date: a.date,
      messages: Number(a.messages ?? 0),
      tasksUpdated: Number(a.tasks ?? 0),
      commits: 0,
    }));
  }

  // Task completion over time
  let taskCompletionOverTime: TaskCompletionDataPoint[] = [];
  if (Array.isArray(raw.taskCompletionOverTime)) {
    taskCompletionOverTime = raw.taskCompletionOverTime;
  } else if (activityOverTime.length > 0) {
    taskCompletionOverTime = activityOverTime.map((a) => ({
      date: a.date,
      completed: a.tasksUpdated,
      created: 0,
    }));
  }

  return {
    projectId: raw.projectId || raw.project?.id || projectId,
    generatedAt: raw.generatedAt || new Date().toISOString(),
    totalTasks,
    completedTasks,
    overallCompletionRate,
    tasksByStatus,
    tasksByPriority,
    taskCompletionOverTime,
    memberContributions,
    activityOverTime,
    totalFiles,
    totalMessages,
  };
}

export const analyticsService = {
  /**
   * Get analytics aggregation for a project.
   * GET /projects/:id/analytics
   */
  getProjectAnalytics: async (projectId: string): Promise<ProjectAnalytics> => {
    const raw = await api.get<any>(`/projects/${projectId}/analytics`);
    return normalizeProjectAnalytics(raw, projectId);
  },
};
