import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { formatDuration, formatPercentage, getCategoryColor } from '../utils/formatters';
import { Clock, TrendingUp, Target, Zap, CheckCircle2, Brain } from 'lucide-react';

export default function Dashboard() {
  const {
    activitySummary,
    tasks,
    predictedTasks,
    focusStats,
    loadActivitySummary,
    loadTasks,
    loadPredictedTasks,
    isLoadingActivity,
  } = useAppStore();

  useEffect(() => {
    loadActivitySummary('today');
    loadTasks();
    loadPredictedTasks();
  }, [loadActivitySummary, loadTasks, loadPredictedTasks]);

  const productivityPercentage = activitySummary
    ? Math.round((activitySummary.productiveTime / activitySummary.totalTime) * 100) || 0
    : 0;

  const completedToday = tasks.filter(
    (t) =>
      t.status === 'completed' &&
      t.completedAt &&
      new Date(t.completedAt * 1000).toDateString() === new Date().toDateString()
  ).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Welcome back!</h1>
        <p className="text-dark-400">Here's your productivity overview for today</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Clock}
          label="Total Time"
          value={formatDuration(activitySummary?.totalTime || 0)}
          color="bg-blue-500"
          loading={isLoadingActivity}
        />
        <StatCard
          icon={TrendingUp}
          label="Productive Time"
          value={formatDuration(activitySummary?.productiveTime || 0)}
          color="bg-green-500"
          loading={isLoadingActivity}
          subtitle={`${productivityPercentage}% of total`}
        />
        <StatCard
          icon={CheckCircle2}
          label="Tasks Completed"
          value={completedToday}
          color="bg-purple-500"
          subtitle={`${tasks.filter((t) => t.status === 'pending').length} pending`}
        />
        <StatCard
          icon={Target}
          label="Focus Sessions"
          value={focusStats?.stats?.totalSessions || 0}
          color="bg-pink-500"
          subtitle={
            focusStats?.stats?.avgFocusScore
              ? `${Math.round(focusStats.stats.avgFocusScore * 100)}% avg score`
              : 'No sessions yet'
          }
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Breakdown */}
        <div className="glass rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary-400" />
            Activity Breakdown
          </h2>

          {isLoadingActivity ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-dark-800 rounded animate-pulse" />
              ))}
            </div>
          ) : activitySummary && activitySummary.byApp.length > 0 ? (
            <div className="space-y-3">
              {activitySummary.byApp.slice(0, 5).map((app, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg ${getCategoryColor(app.appName)} flex items-center justify-center text-white font-bold`}
                  >
                    {app.appName[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-white">{app.appName}</span>
                      <span className="text-sm text-dark-400">{formatDuration(app.duration)}</span>
                    </div>
                    <div className="h-2 bg-dark-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full"
                        style={{
                          width: formatPercentage(app.duration, activitySummary.totalTime),
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-dark-500">
              <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No activity tracked yet today</p>
            </div>
          )}
        </div>

        {/* AI Task Suggestions */}
        <div className="glass rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400" />
            AI Task Suggestions
          </h2>

          {predictedTasks.length > 0 ? (
            <div className="space-y-3">
              {predictedTasks.slice(0, 5).map((task, index) => (
                <div
                  key={index}
                  className="p-3 bg-dark-800 rounded-lg border border-dark-700 hover:border-purple-500/50 transition-all cursor-pointer group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded border-2 border-dark-600 group-hover:border-purple-400 transition-colors mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-medium text-white group-hover:text-purple-300 transition-colors">
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-sm text-dark-400 mt-1">{task.description}</p>
                      )}
                      {task.predictedBy === 'ai' && (
                        <span className="inline-block mt-2 text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded">
                          AI Suggested
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-dark-500">
              <Brain className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No task suggestions available</p>
              <p className="text-sm mt-1">Keep working and I'll learn your patterns</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="glass rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-green-400" />
          Recent Tasks
        </h2>

        {tasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {tasks.slice(0, 6).map((task) => (
              <div
                key={task.id}
                className={`p-4 rounded-lg border ${
                  task.status === 'completed'
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-dark-800 border-dark-700'
                }`}
              >
                <div className="flex items-start gap-2">
                  {task.status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5" />
                  ) : (
                    <div className="w-5 h-5 rounded border-2 border-dark-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h3 className={`font-medium ${task.status === 'completed' ? 'text-dark-400 line-through' : 'text-white'}`}>
                      {task.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          task.priority === 'high'
                            ? 'bg-red-500/20 text-red-300'
                            : task.priority === 'medium'
                            ? 'bg-yellow-500/20 text-yellow-300'
                            : 'bg-green-500/20 text-green-300'
                        }`}
                      >
                        {task.priority}
                      </span>
                      <span className="text-xs text-dark-500">{task.status}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-dark-500">
            <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No tasks yet. Start adding some!</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
  loading?: boolean;
  subtitle?: string;
}

function StatCard({ icon: Icon, label, value, color, loading, subtitle }: StatCardProps) {
  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-dark-400 mb-1">{label}</p>
          {loading ? (
            <div className="h-8 w-20 bg-dark-800 rounded animate-pulse" />
          ) : (
            <>
              <p className="text-2xl font-bold text-white">{value}</p>
              {subtitle && <p className="text-xs text-dark-500 mt-1">{subtitle}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
