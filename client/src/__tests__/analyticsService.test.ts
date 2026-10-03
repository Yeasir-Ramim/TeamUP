import { normalizeProjectAnalytics } from '../services/analyticsService';

describe('normalizeProjectAnalytics', () => {
  it('returns default zeroed analytics when raw is null or undefined', () => {
    const result = normalizeProjectAnalytics(null, 'proj-123');
    expect(result.projectId).toBe('proj-123');
    expect(result.totalTasks).toBe(0);
    expect(result.completedTasks).toBe(0);
    expect(result.overallCompletionRate).toBe(0);
    expect(result.tasksByStatus).toEqual({
      TODO: 0,
      IN_PROGRESS: 0,
      TESTING: 0,
      DONE: 0,
    });
    expect(result.tasksByPriority).toEqual({
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
    });
    expect(result.memberContributions).toEqual([]);
    expect(result.activityOverTime).toEqual([]);
    expect(result.taskCompletionOverTime).toEqual([]);
    expect(result.totalFiles).toBe(0);
    expect(result.totalMessages).toBe(0);
  });

  it('preserves flat mock analytics payload', () => {
    const flatData = {
      projectId: 'proj-1',
      generatedAt: '2026-10-03T10:00:00Z',
      totalTasks: 12,
      completedTasks: 6,
      overallCompletionRate: 50,
      tasksByStatus: { TODO: 3, IN_PROGRESS: 3, TESTING: 0, DONE: 6 },
      tasksByPriority: { LOW: 4, MEDIUM: 4, HIGH: 4 },
      taskCompletionOverTime: [{ date: '2026-10-01', completed: 3, created: 3 }],
      memberContributions: [
        {
          memberId: 'user-1',
          memberName: 'Alice',
          avatarInitial: 'A',
          tasksCompleted: 4,
          tasksAssigned: 6,
          completionRate: 67,
        },
      ],
      activityOverTime: [{ date: '2026-10-01', messages: 10, tasksUpdated: 3, commits: 0 }],
      totalFiles: 5,
      totalMessages: 20,
    };

    const result = normalizeProjectAnalytics(flatData, 'proj-1');
    expect(result.projectId).toBe('proj-1');
    expect(result.totalTasks).toBe(12);
    expect(result.completedTasks).toBe(6);
    expect(result.overallCompletionRate).toBe(50);
    expect(result.tasksByStatus.TODO).toBe(3);
    expect(result.tasksByStatus.DONE).toBe(6);
    expect(result.tasksByPriority.HIGH).toBe(4);
    expect(result.memberContributions).toHaveLength(1);
    expect(result.totalFiles).toBe(5);
    expect(result.totalMessages).toBe(20);
  });

  it('normalizes nested live backend analytics payload', () => {
    const liveBackendData = {
      project: {
        id: 'proj-live-1',
        name: 'Live Project',
        key: 'LP',
      },
      tasks: {
        byStatus: {
          TODO: 5,
          IN_PROGRESS: 3,
          TESTING: 2,
          DONE: 10,
          total: 20,
        },
        byPriority: {
          LOW: 6,
          MEDIUM: 8,
          HIGH: 6,
        },
        completionRate: 50,
        overdue: 1,
      },
      members: {
        totalMembers: 2,
        members: [
          {
            user: {
              id: 'u-1',
              email: 'john@example.com',
              profile: { fullName: 'John Doe', avatarUrl: null },
            },
            contributions: {
              tasksAssigned: 10,
              tasksCompleted: 6,
              taskCompletionRate: 60,
            },
          },
          {
            user: {
              id: 'u-2',
              email: 'jane@example.com',
              profile: null,
            },
            contributions: {
              tasksAssigned: 10,
              tasksCompleted: 4,
              taskCompletionRate: 40,
            },
          },
        ],
      },
      activity: {
        messages: { total: 42 },
        files: { total: 8 },
        dailyActivity: [
          { date: '2026-10-01', messages: 15, tasks: 4 },
          { date: '2026-10-02', messages: 27, tasks: 6 },
        ],
      },
    };

    const result = normalizeProjectAnalytics(liveBackendData, 'proj-live-1');
    expect(result.projectId).toBe('proj-live-1');
    expect(result.totalTasks).toBe(20);
    expect(result.completedTasks).toBe(10);
    expect(result.overallCompletionRate).toBe(50);
    expect(result.tasksByStatus).toEqual({
      TODO: 5,
      IN_PROGRESS: 3,
      TESTING: 2,
      DONE: 10,
    });
    expect(result.tasksByPriority).toEqual({
      LOW: 6,
      MEDIUM: 8,
      HIGH: 6,
    });
    expect(result.totalFiles).toBe(8);
    expect(result.totalMessages).toBe(42);
    expect(result.memberContributions).toHaveLength(2);
    expect(result.memberContributions[0]).toEqual({
      memberId: 'u-1',
      memberName: 'John Doe',
      avatarInitial: 'J',
      tasksCompleted: 6,
      tasksAssigned: 10,
      completionRate: 60,
    });
    expect(result.memberContributions[1].memberName).toBe('jane@example.com');
    expect(result.activityOverTime).toHaveLength(2);
    expect(result.activityOverTime[0]).toEqual({
      date: '2026-10-01',
      messages: 15,
      tasksUpdated: 4,
      commits: 0,
    });
    expect(result.taskCompletionOverTime).toHaveLength(2);
    expect(result.taskCompletionOverTime[0]).toEqual({
      date: '2026-10-01',
      completed: 4,
      created: 0,
    });
  });
});
