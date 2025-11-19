import { describe, it, expect, beforeEach, vi } from 'vitest';
import { formatDuration, formatDetailedDuration, formatTimestamp, calculatePercentage, formatPercentage, getRelativeTime, getPriorityColor, getCategoryColor, truncate } from '../utils/formatters';

describe('formatDuration', () => {
  it('should format seconds correctly', () => {
    expect(formatDuration(30)).toBe('30s');
    expect(formatDuration(45)).toBe('45s');
  });

  it('should format minutes correctly', () => {
    expect(formatDuration(60)).toBe('1m');
    expect(formatDuration(120)).toBe('2m');
    expect(formatDuration(90)).toBe('1m');
  });

  it('should format hours correctly', () => {
    expect(formatDuration(3600)).toBe('1h');
    expect(formatDuration(7200)).toBe('2h');
    expect(formatDuration(3660)).toBe('1h 1m');
    expect(formatDuration(7380)).toBe('2h 3m');
  });
});

describe('formatDetailedDuration', () => {
  it('should format with all units', () => {
    // When seconds > 0 but hours > 0, seconds are not shown
    expect(formatDetailedDuration(3661)).toBe('1 hour, 1 minute');
  });

  it('should handle plural correctly', () => {
    expect(formatDetailedDuration(7322)).toBe('2 hours, 2 minutes');
  });

  it('should skip zero values', () => {
    expect(formatDetailedDuration(3600)).toBe('1 hour');
    expect(formatDetailedDuration(60)).toBe('1 minute');
  });

  it('should handle zero', () => {
    expect(formatDetailedDuration(0)).toBe('0 seconds');
  });
});

describe('calculatePercentage', () => {
  it('should calculate percentage correctly', () => {
    expect(calculatePercentage(25, 100)).toBe(25);
    expect(calculatePercentage(50, 200)).toBe(25);
    expect(calculatePercentage(75, 100)).toBe(75);
  });

  it('should handle zero total', () => {
    expect(calculatePercentage(10, 0)).toBe(0);
  });

  it('should round to nearest integer', () => {
    expect(calculatePercentage(33, 100)).toBe(33);
    expect(calculatePercentage(1, 3)).toBe(33);
  });
});

describe('formatPercentage', () => {
  it('should format percentage with % sign', () => {
    expect(formatPercentage(25, 100)).toBe('25%');
    expect(formatPercentage(50, 200)).toBe('25%');
  });
});

describe('getRelativeTime', () => {
  const now = Math.floor(Date.now() / 1000);

  it('should return "just now" for recent times', () => {
    expect(getRelativeTime(now - 30)).toBe('just now');
  });

  it('should return minutes ago', () => {
    expect(getRelativeTime(now - 120)).toBe('2m ago');
  });

  it('should return hours ago', () => {
    expect(getRelativeTime(now - 7200)).toBe('2h ago');
  });

  it('should return days ago', () => {
    expect(getRelativeTime(now - 172800)).toBe('2d ago');
  });
});

describe('getPriorityColor', () => {
  it('should return correct colors for priorities', () => {
    expect(getPriorityColor('low')).toBe('text-green-400');
    expect(getPriorityColor('medium')).toBe('text-yellow-400');
    expect(getPriorityColor('high')).toBe('text-red-400');
  });
});

describe('getCategoryColor', () => {
  it('should return correct colors for known categories', () => {
    expect(getCategoryColor('Development')).toBe('bg-blue-500');
    expect(getCategoryColor('Web Browsing')).toBe('bg-purple-500');
    expect(getCategoryColor('Office Work')).toBe('bg-green-500');
  });

  it('should return default color for unknown categories', () => {
    expect(getCategoryColor('Unknown')).toBe('bg-gray-500');
  });
});

describe('truncate', () => {
  it('should not truncate short text', () => {
    expect(truncate('Hello', 10)).toBe('Hello');
  });

  it('should truncate long text', () => {
    expect(truncate('Hello World', 8)).toBe('Hello...');
  });

  it('should handle exact length', () => {
    expect(truncate('Hello', 5)).toBe('Hello');
  });
});
