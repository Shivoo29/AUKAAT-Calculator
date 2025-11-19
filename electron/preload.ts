import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Activity tracking
  getActivitySummary: (timeRange: string) =>
    ipcRenderer.invoke('get-activity-summary', timeRange),

  // Tasks
  getPredictedTasks: () =>
    ipcRenderer.invoke('get-predicted-tasks'),

  addTask: (task: any) =>
    ipcRenderer.invoke('add-task', task),

  completeTask: (taskId: number) =>
    ipcRenderer.invoke('complete-task', taskId),

  // Focus mode
  toggleFocusMode: (enabled: boolean) =>
    ipcRenderer.invoke('toggle-focus-mode', enabled),

  getFocusStats: () =>
    ipcRenderer.invoke('get-focus-stats'),

  // File operations
  organizeFiles: (directory: string) =>
    ipcRenderer.invoke('organize-files', directory),

  // Reports
  getDailyReport: (date: string) =>
    ipcRenderer.invoke('get-daily-report', date),

  // Settings
  getSettings: () =>
    ipcRenderer.invoke('get-settings'),

  updateSettings: (settings: any) =>
    ipcRenderer.invoke('update-settings', settings),

  // Event listeners
  onCommandPaletteToggle: (callback: () => void) => {
    ipcRenderer.on('toggle-command-palette', callback);
    return () => ipcRenderer.removeListener('toggle-command-palette', callback);
  },

  onFocusModeChange: (callback: (enabled: boolean) => void) => {
    const handler = (_event: any, enabled: boolean) => callback(enabled);
    ipcRenderer.on('focus-mode-changed', handler);
    return () => ipcRenderer.removeListener('focus-mode-changed', handler);
  },
});

// Type definitions for TypeScript
export interface ElectronAPI {
  getActivitySummary: (timeRange: string) => Promise<any>;
  getPredictedTasks: () => Promise<any[]>;
  addTask: (task: any) => Promise<any>;
  completeTask: (taskId: number) => Promise<void>;
  toggleFocusMode: (enabled: boolean) => Promise<void>;
  getFocusStats: () => Promise<any>;
  organizeFiles: (directory: string) => Promise<any>;
  getDailyReport: (date: string) => Promise<any>;
  getSettings: () => Promise<any>;
  updateSettings: (settings: any) => Promise<void>;
  onCommandPaletteToggle: (callback: () => void) => () => void;
  onFocusModeChange: (callback: (enabled: boolean) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
