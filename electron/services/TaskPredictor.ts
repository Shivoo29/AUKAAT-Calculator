import { DatabaseService, Task } from './DatabaseService';

interface ActivityPattern {
  appName: string;
  windowTitle: string;
  frequency: number;
  avgDuration: number;
  timeOfDay: number[];
  relatedFiles: string[];
}

interface TaskSuggestion {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  confidence: number;
  reason: string;
  relatedActivity?: string;
}

export class TaskPredictor {
  private database: DatabaseService;
  private patterns: Map<string, ActivityPattern> = new Map();
  private lastAnalysis: number = 0;

  // Task templates based on common workflows
  private taskTemplates = [
    {
      pattern: /^(.+)\.(pdf|doc|docx)$/i,
      template: (filename: string) => ({
        title: `Review and complete ${filename}`,
        description: `Document work detected`,
        priority: 'medium' as const,
      }),
    },
    {
      pattern: /presentation|slide|ppt/i,
      template: (context: string) => ({
        title: `Finish presentation slides`,
        description: `Based on ${context}`,
        priority: 'high' as const,
      }),
    },
    {
      pattern: /code|programming|development/i,
      template: (context: string) => ({
        title: `Continue coding session`,
        description: `Working on ${context}`,
        priority: 'medium' as const,
      }),
    },
    {
      pattern: /meeting|zoom|teams|call/i,
      template: (context: string) => ({
        title: `Follow up on meeting`,
        description: `Meeting: ${context}`,
        priority: 'high' as const,
      }),
    },
  ];

  constructor(database: DatabaseService) {
    this.database = database;
    this.analyzePatterns();
  }

  private async analyzePatterns() {
    try {
      const now = Math.floor(Date.now() / 1000);
      const weekAgo = now - 7 * 24 * 60 * 60;

      const activities = this.database.getActivities(weekAgo, now);

      // Group by app and window title
      const activityGroups = new Map<string, any[]>();

      activities.forEach((activity) => {
        const key = `${activity.appName}:${activity.windowTitle}`;
        if (!activityGroups.has(key)) {
          activityGroups.set(key, []);
        }
        activityGroups.get(key)!.push(activity);
      });

      // Analyze each group
      activityGroups.forEach((group, key) => {
        if (group.length < 3) return; // Need at least 3 occurrences

        const totalDuration = group.reduce((sum, a) => sum + a.duration, 0);
        const avgDuration = totalDuration / group.length;

        const timeOfDay = group.map((a) => {
          const date = new Date(a.timestamp * 1000);
          return date.getHours();
        });

        const pattern: ActivityPattern = {
          appName: group[0].appName,
          windowTitle: group[0].windowTitle,
          frequency: group.length,
          avgDuration,
          timeOfDay,
          relatedFiles: [],
        };

        this.patterns.set(key, pattern);
      });

      this.lastAnalysis = now;
    } catch (error) {
      console.error('Error analyzing patterns:', error);
    }
  }

  async getPredictedTasks(): Promise<Task[]> {
    try {
      // Re-analyze if stale (> 1 hour)
      if (Date.now() / 1000 - this.lastAnalysis > 3600) {
        await this.analyzePatterns();
      }

      const suggestions: TaskSuggestion[] = [];

      // 1. Analyze recent activity (last 4 hours)
      const now = Math.floor(Date.now() / 1000);
      const recentStart = now - 4 * 60 * 60;
      const recentActivities = this.database.getActivities(recentStart, now);

      // Find incomplete work sessions
      const workSessions = this.identifyWorkSessions(recentActivities);
      suggestions.push(...this.suggestTasksFromSessions(workSessions));

      // 2. Analyze file events (recent file opens)
      // This would integrate with file watcher data
      // TODO: Implement file-based task suggestions

      // 3. Check for recurring patterns not completed
      const recurringTasks = this.suggestRecurringTasks();
      suggestions.push(...recurringTasks);

      // 4. Check existing tasks and suggest follow-ups
      const existingTasks = this.database.getTasks('pending');
      const followUpTasks = this.suggestFollowUpTasks(existingTasks);
      suggestions.push(...followUpTasks);

      // Convert suggestions to tasks
      const tasks = suggestions
        .filter((s) => s.confidence > 0.5)
        .slice(0, 5) // Top 5 suggestions
        .map((suggestion) => ({
          title: suggestion.title,
          description: suggestion.description,
          status: 'pending' as const,
          priority: suggestion.priority,
          createdAt: now,
          predictedBy: 'ai' as const,
          tags: ['predicted'],
        }));

      return tasks;
    } catch (error) {
      console.error('Error predicting tasks:', error);
      return [];
    }
  }

  private identifyWorkSessions(activities: any[]) {
    const sessions: any[] = [];
    let currentSession: any = null;

    activities.forEach((activity, index) => {
      if (activity.isProductive) {
        if (!currentSession) {
          currentSession = {
            start: activity.timestamp,
            end: activity.timestamp + activity.duration,
            activities: [activity],
            appName: activity.appName,
            windowTitle: activity.windowTitle,
          };
        } else {
          const timeSinceLastActivity =
            activity.timestamp - currentSession.end;

          // If less than 5 minutes gap, extend session
          if (timeSinceLastActivity < 300) {
            currentSession.end = activity.timestamp + activity.duration;
            currentSession.activities.push(activity);
          } else {
            // Session ended, start new one
            sessions.push(currentSession);
            currentSession = {
              start: activity.timestamp,
              end: activity.timestamp + activity.duration,
              activities: [activity],
              appName: activity.appName,
              windowTitle: activity.windowTitle,
            };
          }
        }
      }
    });

    if (currentSession) {
      sessions.push(currentSession);
    }

    return sessions;
  }

  private suggestTasksFromSessions(sessions: any[]): TaskSuggestion[] {
    const suggestions: TaskSuggestion[] = [];

    sessions.forEach((session) => {
      const duration = session.end - session.start;

      // Sessions longer than 30 minutes but not super long (not completed)
      if (duration > 1800 && duration < 7200) {
        const context = session.windowTitle || session.appName;

        // Try to match against templates
        for (const template of this.taskTemplates) {
          if (template.pattern.test(context)) {
            const task = template.template(context);
            suggestions.push({
              ...task,
              confidence: 0.7,
              reason: 'Incomplete work session detected',
              relatedActivity: session.appName,
            });
            break;
          }
        }

        // Generic suggestion if no template matched
        if (suggestions.length === 0) {
          suggestions.push({
            title: `Continue work on ${session.appName}`,
            description: `You spent ${Math.floor(duration / 60)} minutes on this`,
            priority: 'medium',
            confidence: 0.6,
            reason: 'Long work session detected',
            relatedActivity: session.appName,
          });
        }
      }
    });

    return suggestions;
  }

  private suggestRecurringTasks(): TaskSuggestion[] {
    const suggestions: TaskSuggestion[] = [];
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();

    // Morning tasks (8-10 AM)
    if (hour >= 8 && hour < 10) {
      suggestions.push({
        title: 'Review daily goals and priorities',
        description: 'Start your day with clarity',
        priority: 'high',
        confidence: 0.8,
        reason: 'Morning routine suggestion',
      });
    }

    // End of day (5-6 PM)
    if (hour >= 17 && hour < 18) {
      suggestions.push({
        title: 'Review completed tasks and plan tomorrow',
        description: 'Daily wrap-up and planning',
        priority: 'medium',
        confidence: 0.7,
        reason: 'End of day routine',
      });
    }

    // Monday morning
    if (dayOfWeek === 1 && hour >= 8 && hour < 11) {
      suggestions.push({
        title: 'Plan weekly priorities',
        description: 'Set goals for the week',
        priority: 'high',
        confidence: 0.75,
        reason: 'Weekly planning routine',
      });
    }

    // Friday afternoon
    if (dayOfWeek === 5 && hour >= 14 && hour < 17) {
      suggestions.push({
        title: 'Weekly review and cleanup',
        description: 'Review achievements and organize workspace',
        priority: 'medium',
        confidence: 0.7,
        reason: 'Weekly review routine',
      });
    }

    return suggestions;
  }

  private suggestFollowUpTasks(existingTasks: Task[]): TaskSuggestion[] {
    const suggestions: TaskSuggestion[] = [];

    existingTasks.forEach((task) => {
      // If task is old (> 3 days) and still pending
      const now = Math.floor(Date.now() / 1000);
      const age = now - task.createdAt;

      if (age > 3 * 24 * 60 * 60 && task.status === 'pending') {
        suggestions.push({
          title: `Follow up: ${task.title}`,
          description: `This task has been pending for ${Math.floor(age / 86400)} days`,
          priority: task.priority,
          confidence: 0.65,
          reason: 'Overdue task reminder',
        });
      }

      // If task mentions review/check, suggest a verification task
      if (/review|check|verify/i.test(task.title) && task.status === 'completed') {
        const completedAge = task.completedAt ? now - task.completedAt : 0;
        if (completedAge > 24 * 60 * 60 && completedAge < 7 * 24 * 60 * 60) {
          suggestions.push({
            title: `Verify completion: ${task.title}`,
            description: 'Double-check that everything is complete',
            priority: 'low',
            confidence: 0.55,
            reason: 'Verification follow-up',
          });
        }
      }
    });

    return suggestions;
  }

  // Manually trigger task creation from current context
  async suggestTaskFromContext(context: {
    appName?: string;
    fileName?: string;
    customText?: string;
  }): Promise<Task | null> {
    const now = Math.floor(Date.now() / 1000);

    // Try file name pattern
    if (context.fileName) {
      for (const template of this.taskTemplates) {
        if (template.pattern.test(context.fileName)) {
          const taskData = template.template(context.fileName);
          return {
            ...taskData,
            status: 'pending',
            createdAt: now,
            predictedBy: 'ai',
            tags: ['predicted', 'file-based'],
          };
        }
      }
    }

    // Try app name pattern
    if (context.appName) {
      for (const template of this.taskTemplates) {
        if (template.pattern.test(context.appName)) {
          const taskData = template.template(context.appName);
          return {
            ...taskData,
            status: 'pending',
            createdAt: now,
            predictedBy: 'ai',
            tags: ['predicted', 'app-based'],
          };
        }
      }
    }

    return null;
  }
}
