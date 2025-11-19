import { useState, useEffect, useRef } from 'react';
import { Search, X, Zap } from 'lucide-react';

interface Command {
  id: string;
  label: string;
  description?: string;
  shortcut?: string;
  action: () => void;
  category: string;
}

interface CommandPaletteProps {
  onClose: () => void;
  onViewChange: (view: string) => void;
}

export default function CommandPalette({ onClose, onViewChange }: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: Command[] = [
    {
      id: 'view-dashboard',
      label: 'View Dashboard',
      description: 'Go to main dashboard',
      shortcut: '⌘1',
      action: () => {
        onViewChange('dashboard');
        onClose();
      },
      category: 'Navigation',
    },
    {
      id: 'view-tasks',
      label: 'View Tasks',
      description: 'Manage your tasks',
      shortcut: '⌘2',
      action: () => {
        onViewChange('tasks');
        onClose();
      },
      category: 'Navigation',
    },
    {
      id: 'view-focus',
      label: 'View Focus Mode',
      description: 'Access focus mode controls',
      shortcut: '⌘3',
      action: () => {
        onViewChange('focus');
        onClose();
      },
      category: 'Navigation',
    },
    {
      id: 'view-analytics',
      label: 'View Analytics',
      description: 'View productivity analytics',
      shortcut: '⌘4',
      action: () => {
        onViewChange('analytics');
        onClose();
      },
      category: 'Navigation',
    },
    {
      id: 'view-settings',
      label: 'View Settings',
      description: 'Customize your experience',
      shortcut: '⌘5',
      action: () => {
        onViewChange('settings');
        onClose();
      },
      category: 'Navigation',
    },
  ];

  const filteredCommands = commands.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(search.toLowerCase()) ||
      cmd.description?.toLowerCase().includes(search.toLowerCase()) ||
      cmd.category.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        filteredCommands[selectedIndex]?.action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredCommands, selectedIndex, onClose]);

  // Group commands by category
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) {
      acc[cmd.category] = [];
    }
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, Command[]>);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 pt-20">
      <div className="w-full max-w-2xl glass-light rounded-xl overflow-hidden animate-slide-in">
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b border-dark-700">
          <Search className="w-5 h-5 text-dark-400" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent text-white placeholder-dark-400 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 hover:bg-dark-700 rounded transition-colors"
          >
            <X className="w-5 h-5 text-dark-400" />
          </button>
        </div>

        {/* Commands List */}
        <div className="max-h-96 overflow-y-auto">
          {Object.entries(groupedCommands).length > 0 ? (
            Object.entries(groupedCommands).map(([category, cmds]) => (
              <div key={category} className="p-2">
                <div className="px-3 py-2 text-xs font-semibold text-dark-500 uppercase">
                  {category}
                </div>
                <div className="space-y-1">
                  {cmds.map((cmd, index) => {
                    const globalIndex = filteredCommands.indexOf(cmd);
                    const isSelected = globalIndex === selectedIndex;

                    return (
                      <button
                        key={cmd.id}
                        onClick={() => cmd.action()}
                        className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                          isSelected
                            ? 'bg-primary-500 text-white'
                            : 'text-dark-300 hover:bg-dark-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              isSelected
                                ? 'bg-white/20'
                                : 'bg-dark-700'
                            }`}
                          >
                            <Zap className="w-4 h-4" />
                          </div>
                          <div className="text-left">
                            <div className="font-medium">{cmd.label}</div>
                            {cmd.description && (
                              <div
                                className={`text-sm ${
                                  isSelected ? 'text-white/70' : 'text-dark-500'
                                }`}
                              >
                                {cmd.description}
                              </div>
                            )}
                          </div>
                        </div>
                        {cmd.shortcut && (
                          <kbd
                            className={`px-2 py-1 rounded text-xs font-mono ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-dark-800 text-dark-400'
                            }`}
                          >
                            {cmd.shortcut}
                          </kbd>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-dark-500">
              <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No commands found</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-3 border-t border-dark-700 bg-dark-900/50">
          <div className="flex items-center gap-4 text-xs text-dark-500">
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-dark-800 rounded">↑</kbd>
              <kbd className="px-2 py-1 bg-dark-800 rounded">↓</kbd>
              <span>Navigate</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-dark-800 rounded">↵</kbd>
              <span>Select</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-dark-800 rounded">Esc</kbd>
              <span>Close</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
