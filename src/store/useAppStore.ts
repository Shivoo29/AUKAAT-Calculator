import { create } from 'zustand';
import {
  Task,
  ActivitySummary,
  FocusStats,
  Settings,
  DailyReport,
} from '../types';

interface AppState {
  // Activity data
  activitySummary: ActivitySummary | null;
  isLoadingActivity: boolean;

  // Tasks
  tasks: Task[];
  predictedTasks: Task[];
  isLoadingTasks: boolean;

  // Focus mode
  isFocusMode: boolean;
  focusStats: FocusStats | null;
  isLoadingFocus: boolean;

  // Settings
  settings: Settings | null;
  isLoadingSettings: boolean;

  // Daily report
  dailyReport: DailyReport | null;
  isLoadingReport: boolean;

  // Actions
  loadInitialData: () => Promise<void>;
  loadActivitySummary: (timeRange: string) => Promise<void>;
  loadTasks: () => Promise<void>;
  loadPredictedTasks: () => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<void>;
  completeTask: (taskId: number) => Promise<void>;
  toggleFocusMode: () => Promise<void>;
  loadFocusStats: () => Promise<void>;
  loadSettings: () => Promise<void>;
  updateSettings: (settings: Settings) => Promise<void>;
  loadDailyReport: (date: string) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  activitySummary: null,
  isLoadingActivity: false,
  tasks: [],
  predictedTasks: [],
  isLoadingTasks: false,
  isFocusMode: false,
  focusStats: null,
  isLoadingFocus: false,
  settings: null,
  isLoadingSettings: false,
  dailyReport: null,
  isLoadingReport: false,

  // Actions
  loadInitialData: async () => {
    await Promise.all([
      get().loadActivitySummary('today'),
      get().loadTasks(),
      get().loadPredictedTasks(),
      get().loadFocusStats(),
      get().loadSettings(),
    ]);
  },

  loadActivitySummary: async (timeRange: string) => {
    set({ isLoadingActivity: true });
    try {
      const summary = await window.electronAPI.getActivitySummary(timeRange);
      set({ activitySummary: summary, isLoadingActivity: false });
    } catch (error) {
      console.error('Error loading activity summary:', error);
      set({ isLoadingActivity: false });
    }
  },

  loadTasks: async () => {
    set({ isLoadingTasks: true });
    try {
      // In a real app, we'd have an API to get tasks
      // For now, we'll use predicted tasks as a placeholder
      const tasks = await window.electronAPI.getPredictedTasks();
      set({ tasks, isLoadingTasks: false });
    } catch (error) {
      console.error('Error loading tasks:', error);
      set({ isLoadingTasks: false });
    }
  },

  loadPredictedTasks: async () => {
    try {
      const predictedTasks = await window.electronAPI.getPredictedTasks();
      set({ predictedTasks });
    } catch (error) {
      console.error('Error loading predicted tasks:', error);
    }
  },

  addTask: async (task) => {
    try {
      const newTask = await window.electronAPI.addTask({
        ...task,
        createdAt: Math.floor(Date.now() / 1000),
      });
      set((state) => ({ tasks: [newTask, ...state.tasks] }));
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  },

  completeTask: async (taskId: number) => {
    try {
      await window.electronAPI.completeTask(taskId);
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === taskId
            ? { ...task, status: 'completed' as const, completedAt: Math.floor(Date.now() / 1000) }
            : task
        ),
      }));
    } catch (error) {
      console.error('Error completing task:', error);
      throw error;
    }
  },

  toggleFocusMode: async () => {
    try {
      const newFocusMode = !get().isFocusMode;
      await window.electronAPI.toggleFocusMode(newFocusMode);
      set({ isFocusMode: newFocusMode });
      await get().loadFocusStats();
    } catch (error) {
      console.error('Error toggling focus mode:', error);
      throw error;
    }
  },

  loadFocusStats: async () => {
    set({ isLoadingFocus: true });
    try {
      const stats = await window.electronAPI.getFocusStats();
      set({
        focusStats: stats,
        isFocusMode: stats.isFocusMode,
        isLoadingFocus: false,
      });
    } catch (error) {
      console.error('Error loading focus stats:', error);
      set({ isLoadingFocus: false });
    }
  },

  loadSettings: async () => {
    set({ isLoadingSettings: true });
    try {
      const settings = await window.electronAPI.getSettings();
      set({ settings, isLoadingSettings: false });
    } catch (error) {
      console.error('Error loading settings:', error);
      set({ isLoadingSettings: false });
    }
  },

  updateSettings: async (settings: Settings) => {
    try {
      await window.electronAPI.updateSettings(settings);
      set({ settings });
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  },

  loadDailyReport: async (date: string) => {
    set({ isLoadingReport: true });
    try {
      const report = await window.electronAPI.getDailyReport(date);
      set({ dailyReport: report, isLoadingReport: false });
    } catch (error) {
      console.error('Error loading daily report:', error);
      set({ isLoadingReport: false });
    }
  },
}));
