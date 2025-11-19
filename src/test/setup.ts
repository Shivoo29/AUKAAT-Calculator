import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.electronAPI
global.window.electronAPI = {
  getActivitySummary: vi.fn(),
  getPredictedTasks: vi.fn(),
  addTask: vi.fn(),
  completeTask: vi.fn(),
  toggleFocusMode: vi.fn(),
  getFocusStats: vi.fn(),
  organizeFiles: vi.fn(),
  getDailyReport: vi.fn(),
  getSettings: vi.fn(),
  updateSettings: vi.fn(),
  onCommandPaletteToggle: vi.fn(() => () => {}),
  onFocusModeChange: vi.fn(() => () => {}),
};
