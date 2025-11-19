import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Sidebar from './Sidebar';

describe('Sidebar', () => {
  it('should render all menu items', () => {
    const mockOnViewChange = () => {};
    render(<Sidebar currentView="dashboard" onViewChange={mockOnViewChange} />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Tasks')).toBeInTheDocument();
    expect(screen.getByText('Focus Mode')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('should show Aukaat branding', () => {
    const mockOnViewChange = () => {};
    render(<Sidebar currentView="dashboard" onViewChange={mockOnViewChange} />);

    expect(screen.getByText('Aukaat')).toBeInTheDocument();
    expect(screen.getByText('Productivity OS')).toBeInTheDocument();
  });

  it('should highlight active view', () => {
    const mockOnViewChange = () => {};
    const { container } = render(<Sidebar currentView="tasks" onViewChange={mockOnViewChange} />);

    // The active button should have bg-primary-500 class
    const tasksButton = screen.getByText('Tasks').closest('button');
    expect(tasksButton?.className).toContain('bg-primary-500');
  });
});
