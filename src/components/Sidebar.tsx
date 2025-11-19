import {
  LayoutDashboard,
  ListTodo,
  Focus,
  BarChart3,
  Settings,
  Zap,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: any) => void;
}

export default function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const { isFocusMode } = useAppStore();

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', shortcut: '⌘1' },
    { id: 'tasks', icon: ListTodo, label: 'Tasks', shortcut: '⌘2' },
    { id: 'focus', icon: Focus, label: 'Focus Mode', shortcut: '⌘3' },
    { id: 'analytics', icon: BarChart3, label: 'Analytics', shortcut: '⌘4' },
    { id: 'settings', icon: Settings, label: 'Settings', shortcut: '⌘5' },
  ];

  return (
    <aside className="w-64 bg-dark-900 border-r border-dark-700 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-dark-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Aukaat</h1>
            <p className="text-xs text-dark-400">Productivity OS</p>
          </div>
        </div>
      </div>

      {/* Focus mode indicator */}
      {isFocusMode && (
        <div className="mx-4 mt-4 p-3 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-purple-200">Focus Mode Active</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                  : 'text-dark-300 hover:bg-dark-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </div>
              <span className="text-xs opacity-50">{item.shortcut}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-dark-700">
        <div className="text-xs text-dark-500 text-center">
          <p>Press <kbd className="px-2 py-1 bg-dark-800 rounded">⌘K</kbd> for commands</p>
        </div>
      </div>
    </aside>
  );
}
