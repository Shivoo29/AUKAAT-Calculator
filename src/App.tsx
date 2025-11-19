import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Tasks from './components/Tasks';
import FocusMode from './components/FocusMode';
import Analytics from './components/Analytics';
import Settings from './components/Settings';
import CommandPalette from './components/CommandPalette';
import Onboarding from './components/Onboarding';
import ErrorBoundary from './components/ErrorBoundary';
import { useAppStore } from './store/useAppStore';

type View = 'dashboard' | 'tasks' | 'focus' | 'analytics' | 'settings';

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    const hasCompletedOnboarding = localStorage.getItem('onboarding_completed');
    return !hasCompletedOnboarding;
  });
  const { isFocusMode, loadInitialData } = useAppStore();

  const handleOnboardingComplete = () => {
    localStorage.setItem('onboarding_completed', 'true');
    setShowOnboarding(false);
  };

  useEffect(() => {
    if (!showOnboarding) {
      loadInitialData();
    }

    const cleanup = window.electronAPI.onCommandPaletteToggle(() => {
      setShowCommandPalette((prev) => !prev);
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }

      if (e.key === 'Escape') {
        setShowCommandPalette(false);
      }

      if ((e.metaKey || e.ctrlKey) && e.key >= '1' && e.key <= '5') {
        e.preventDefault();
        const views: View[] = ['dashboard', 'tasks', 'focus', 'analytics', 'settings'];
        setCurrentView(views[parseInt(e.key) - 1]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      cleanup();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [loadInitialData, showOnboarding]);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'tasks':
        return <Tasks />;
      case 'focus':
        return <FocusMode />;
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <ErrorBoundary>
      {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}

      <div className={`flex h-screen overflow-hidden ${isFocusMode ? 'focus-mode-active' : ''}`}>
        <Sidebar currentView={currentView} onViewChange={setCurrentView} />

        <main className="flex-1 overflow-auto bg-dark-950">
          <div className="max-w-7xl mx-auto p-6">
            <ErrorBoundary>
              {renderView()}
            </ErrorBoundary>
          </div>
        </main>

        {showCommandPalette && (
          <CommandPalette
            onClose={() => setShowCommandPalette(false)}
            onViewChange={(view) => setCurrentView(view as View)}
          />
        )}

        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid #334155',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#f1f5f9',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#f1f5f9',
              },
            },
          }}
        />
      </div>
    </ErrorBoundary>
  );
}

export default App;
