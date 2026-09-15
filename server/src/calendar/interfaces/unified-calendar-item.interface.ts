export interface UnifiedCalendarItem {
  id: string;
  source: 'CALENDAR_EVENT' | 'TASK' | 'MEETING';
  projectId: string;
  projectTitle: string;
  title: string;
  description: string | null;
  eventType: 'MEETING' | 'DEADLINE' | 'MILESTONE' | 'TASK';
  startDate: string;
  endDate: string | null;
  priority?: string;
  isCompleted?: boolean;
  isAssignee?: boolean;
  status?: string;
}
