import { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { BarChart3, TrendingUp, Clock, Target } from 'lucide-react';
import { formatDuration, getCategoryColor } from '../utils/formatters';

export default function Analytics() {
  const { dailyReport, loadDailyReport, isLoadingReport } = useAppStore();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  useEffect(() => {
    loadDailyReport(selectedDate);
  }, [selectedDate, loadDailyReport]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Analytics</h1>
          <p className="text-dark-400">Track your productivity over time</p>
        </div>

        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
        />
      </div>

      {isLoadingReport ? (
        <div className="glass rounded-xl p-8 text-center">
          <div className="inline-block w-12 h-12 border-4 border-dark-700 border-t-primary-500 rounded-full animate-spin" />
        </div>
      ) : dailyReport ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <SummaryCard
              icon={Clock}
              label="Total Time"
              value={formatDuration(dailyReport.summary.totalTime)}
              color="bg-blue-500"
            />
            <SummaryCard
              icon={TrendingUp}
              label="Productive Time"
              value={formatDuration(dailyReport.summary.productiveTime)}
              color="bg-green-500"
              subtitle={`${Math.round(
                (dailyReport.summary.productiveTime / dailyReport.summary.totalTime) *
                  100 || 0
              )}%`}
            />
            <SummaryCard
              icon={Target}
              label="Tasks Completed"
              value={dailyReport.summary.tasksCompleted}
              color="bg-purple-500"
            />
            <SummaryCard
              icon={BarChart3}
              label="Focus Sessions"
              value={dailyReport.summary.focusSessionCount}
              color="bg-pink-500"
            />
          </div>

          {/* Activity Breakdown */}
          <div className="glass rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-primary-400" />
              Activity Breakdown
            </h2>

            {dailyReport.activities.byApp.length > 0 ? (
              <div className="space-y-4">
                {dailyReport.activities.byApp.map((app, index) => {
                  const percentage = Math.round(
                    (app.duration / dailyReport.summary.totalTime) * 100 || 0
                  );

                  return (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg ${getCategoryColor(
                              app.appName
                            )} flex items-center justify-center text-white text-sm font-bold`}
                          >
                            {app.appName[0]}
                          </div>
                          <span className="text-white font-medium">{app.appName}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-white font-medium">
                            {formatDuration(app.duration)}
                          </span>
                          <span className="text-dark-500 text-sm ml-2">({percentage}%)</span>
                        </div>
                      </div>
                      <div className="h-3 bg-dark-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getCategoryColor(
                            app.appName
                          )} transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-dark-500">
                <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No activity data for this day</p>
              </div>
            )}
          </div>

          {/* Tasks Timeline */}
          <div className="glass rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Target className="w-6 h-6 text-green-400" />
              Tasks ({dailyReport.tasks.length})
            </h2>

            {dailyReport.tasks.length > 0 ? (
              <div className="space-y-3">
                {dailyReport.tasks.map((task: any) => (
                  <div
                    key={task.id}
                    className={`p-4 rounded-lg border ${
                      task.status === 'completed'
                        ? 'bg-green-500/10 border-green-500/30'
                        : 'bg-dark-800 border-dark-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3
                          className={`font-medium ${
                            task.status === 'completed'
                              ? 'text-dark-400 line-through'
                              : 'text-white'
                          }`}
                        >
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className="text-sm text-dark-400 mt-1">{task.description}</p>
                        )}
                      </div>
                      <span
                        className={`px-3 py-1 rounded text-sm font-medium ${
                          task.status === 'completed'
                            ? 'bg-green-500/20 text-green-300'
                            : 'bg-yellow-500/20 text-yellow-300'
                        }`}
                      >
                        {task.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-dark-500">
                <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No tasks for this day</p>
              </div>
            )}
          </div>

          {/* Focus Sessions */}
          {dailyReport.focusSessions.length > 0 && (
            <div className="glass rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-6">Focus Sessions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dailyReport.focusSessions.map((session: any, index: number) => (
                  <div key={index} className="p-4 bg-dark-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-dark-400 text-sm">Session {index + 1}</span>
                      <span className="text-white font-bold">
                        {formatDuration(session.duration || 0)}
                      </span>
                    </div>
                    {session.focusScore !== undefined && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-dark-400 mb-1">
                          <span>Focus Score</span>
                          <span>{Math.round(session.focusScore * 100)}%</span>
                        </div>
                        <div className="h-2 bg-dark-900 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-500 to-blue-500"
                            style={{ width: `${session.focusScore * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="glass rounded-xl p-8 text-center text-dark-500">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>No data available for this date</p>
        </div>
      )}
    </div>
  );
}

interface SummaryCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
  subtitle?: string;
}

function SummaryCard({ icon: Icon, label, value, color, subtitle }: SummaryCardProps) {
  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-center gap-4 mb-2">
        <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-dark-400 mb-1">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {subtitle && <p className="text-xs text-dark-500 mt-1">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}
