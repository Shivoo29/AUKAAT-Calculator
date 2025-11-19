import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from './useAppStore';

describe('useAppStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const store = useAppStore.getState();
    store.activitySummary = null;
    store.tasks = [];
    store.predictedTasks = [];
    store.isFocusMode = false;
    store.focusStats = null;
    store.settings = null;
    store.dailyReport = null;
  });

  it('should have initial state', () => {
    const state = useAppStore.getState();
    expect(state.activitySummary).toBeNull();
    expect(state.tasks).toEqual([]);
    expect(state.predictedTasks).toEqual([]);
    expect(state.isFocusMode).toBe(false);
    expect(state.focusStats).toBeNull();
    expect(state.settings).toBeNull();
    expect(state.dailyReport).toBeNull();
  });

  it('should have all required actions', () => {
    const state = useAppStore.getState();
    expect(typeof state.loadInitialData).toBe('function');
    expect(typeof state.loadActivitySummary).toBe('function');
    expect(typeof state.loadTasks).toBe('function');
    expect(typeof state.addTask).toBe('function');
    expect(typeof state.completeTask).toBe('function');
    expect(typeof state.toggleFocusMode).toBe('function');
  });

  it('should update loading states', () => {
    const state = useAppStore.getState();
    expect(state.isLoadingActivity).toBe(false);
    expect(state.isLoadingTasks).toBe(false);
    expect(state.isLoadingFocus).toBe(false);
    expect(state.isLoadingSettings).toBe(false);
    expect(state.isLoadingReport).toBe(false);
  });
});
