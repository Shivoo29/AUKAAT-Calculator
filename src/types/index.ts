export interface Activity {
  id?: number;
  timestamp: number;
  appName: string;
  windowTitle: string;
  duration: number;
  category?: string;
  isProductive?: boolean;
}

export interface Task {
  id?: number;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  createdAt: number;
  completedAt?: number;
  predictedBy?: 'user' | 'ai';
  relatedFiles?: string[];
  tags?: string[];
}

export interface ActivitySummary {
  totalTime: number;
  productiveTime: number;
  byApp: Array<{
    appName: string;
    duration: number;
    count: number;
  }>;
  startTime: number;
  endTime: number;
}

export interface FocusStats {
  isFocusMode: boolean;
  currentSession: FocusSession | null;
  stats: {
    totalSessions: number;
    totalDuration: number;
    avgFocusScore: number;
    totalTasksCompleted: number;
  };
}

export interface FocusSession {
  id?: number;
  startTime: number;
  endTime?: number;
  duration?: number;
  distractionCount: number;
  blockedAttempts: number;
  tasksCompleted: number;
  focusScore?: number;
}

export interface Settings {
  focusMode: {
    blockedApps: string[];
    blockedWebsites: string[];
    workHoursStart: string;
    workHoursEnd: string;
  };
  fileOrganization: {
    autoOrganize: boolean;
    watchedDirectories: string[];
    organizationRules: Record<string, string>;
  };
  notifications: {
    enabled: boolean;
    focusReminders: boolean;
    taskSuggestions: boolean;
  };
  privacy: {
    trackWebBrowsing: boolean;
    trackTyping: boolean;
    dataRetentionDays: number;
  };
}

export interface DailyReport {
  date: string;
  activities: ActivitySummary;
  tasks: Task[];
  focusSessions: FocusSession[];
  summary: {
    totalTime: number;
    productiveTime: number;
    tasksCompleted: number;
    focusSessionCount: number;
  };
}
