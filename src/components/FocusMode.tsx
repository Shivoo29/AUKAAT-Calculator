import { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Focus, Play, Pause, Target, Zap, TrendingUp } from 'lucide-react';
import { formatDuration, formatDetailedDuration } from '../utils/formatters';
import toast from 'react-hot-toast';

export default function FocusMode() {
  const { isFocusMode, focusStats, toggleFocusMode, loadFocusStats } = useAppStore();
  const [sessionDuration, setSessionDuration] = useState(0);

  useEffect(() => {
    loadFocusStats();
  }, [loadFocusStats]);

  useEffect(() => {
    if (isFocusMode && focusStats?.currentSession) {
      const interval = setInterval(() => {
        const elapsed = Math.floor(Date.now() / 1000) - focusStats.currentSession!.startTime;
        setSessionDuration(elapsed);
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setSessionDuration(0);
    }
  }, [isFocusMode, focusStats]);

  const handleToggleFocus = async () => {
    try {
      await toggleFocusMode();
      toast.success(isFocusMode ? 'Focus mode ended' : 'Focus mode activated!');
    } catch (error) {
      toast.error('Failed to toggle focus mode');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Focus Mode</h1>
        <p className="text-dark-400">
          Block distractions and maximize your productivity
        </p>
      </div>

      {/* Focus Mode Control */}
      <div className="glass rounded-xl p-8">
        <div className="text-center">
          {isFocusMode ? (
            <>
              <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-6 animate-pulse-slow">
                <Focus className="w-16 h-16 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Focus Mode Active</h2>
              <p className="text-dark-400 mb-6">
                Distracting apps and websites are blocked
              </p>

              {/* Timer */}
              <div className="text-6xl font-bold text-white mb-8 font-mono">
                {formatTime(sessionDuration)}
              </div>

              {/* Session Stats */}
              {focusStats?.currentSession && (
                <div className="grid grid-cols-3 gap-4 mb-8 max-w-md mx-auto">
                  <div className="p-4 bg-dark-800 rounded-lg">
                    <p className="text-sm text-dark-400 mb-1">Tasks Done</p>
                    <p className="text-2xl font-bold text-white">
                      {focusStats.currentSession.tasksCompleted}
                    </p>
                  </div>
                  <div className="p-4 bg-dark-800 rounded-lg">
                    <p className="text-sm text-dark-400 mb-1">Distractions</p>
                    <p className="text-2xl font-bold text-yellow-400">
                      {focusStats.currentSession.distractionCount}
                    </p>
                  </div>
                  <div className="p-4 bg-dark-800 rounded-lg">
                    <p className="text-sm text-dark-400 mb-1">Blocked</p>
                    <p className="text-2xl font-bold text-red-400">
                      {focusStats.currentSession.blockedAttempts}
                    </p>
                  </div>
                </div>
              )}

              <button
                onClick={handleToggleFocus}
                className="px-8 py-4 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-lg font-bold text-lg flex items-center gap-3 mx-auto transition-all"
              >
                <Pause className="w-6 h-6" />
                End Focus Session
              </button>
            </>
          ) : (
            <>
              <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 mb-6">
                <Focus className="w-16 h-16 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Ready to Focus?</h2>
              <p className="text-dark-400 mb-8">
                Start a focus session to block distractions and boost productivity
              </p>

              <button
                onClick={handleToggleFocus}
                className="px-8 py-4 gradient-primary hover:shadow-lg hover:shadow-primary-500/50 text-white rounded-lg font-bold text-lg flex items-center gap-3 mx-auto transition-all"
              >
                <Play className="w-6 h-6" />
                Start Focus Session
              </button>
            </>
          )}
        </div>
      </div>

      {/* Focus Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass rounded-xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-dark-400">Total Sessions</p>
              <p className="text-2xl font-bold text-white">
                {focusStats?.stats?.totalSessions || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="glass rounded-xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-dark-400">Total Focus Time</p>
              <p className="text-2xl font-bold text-white">
                {formatDuration(focusStats?.stats?.totalDuration || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="glass rounded-xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-lg bg-purple-500 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-dark-400">Avg Focus Score</p>
              <p className="text-2xl font-bold text-white">
                {focusStats?.stats?.avgFocusScore
                  ? `${Math.round(focusStats.stats.avgFocusScore * 100)}%`
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="glass rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Focus Tips</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Tip
            title="Pomodoro Technique"
            description="Work for 25 minutes, then take a 5-minute break. Repeat 4 times, then take a longer break."
          />
          <Tip
            title="Eliminate Distractions"
            description="During focus mode, distracting apps and websites are automatically blocked."
          />
          <Tip
            title="Set Clear Goals"
            description="Before starting, know exactly what you want to accomplish in this focus session."
          />
          <Tip
            title="Track Your Progress"
            description="Review your focus stats regularly to identify patterns and improve your productivity."
          />
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

interface TipProps {
  title: string;
  description: string;
}

function Tip({ title, description }: TipProps) {
  return (
    <div className="p-4 bg-dark-800 rounded-lg">
      <h4 className="font-medium text-white mb-2">{title}</h4>
      <p className="text-sm text-dark-400">{description}</p>
    </div>
  );
}
