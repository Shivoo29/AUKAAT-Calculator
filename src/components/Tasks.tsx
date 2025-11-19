import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Plus, CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react';
import { formatTimestamp } from '../utils/formatters';
import toast from 'react-hot-toast';

export default function Tasks() {
  const { tasks, predictedTasks, addTask, completeTask } = useAppStore();
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
  });

  const handleAddTask = async () => {
    if (!newTask.title.trim()) {
      toast.error('Please enter a task title');
      return;
    }

    try {
      await addTask({
        ...newTask,
        status: 'pending',
      });
      setNewTask({ title: '', description: '', priority: 'medium' });
      setShowAddTask(false);
      toast.success('Task added successfully!');
    } catch (error) {
      toast.error('Failed to add task');
    }
  };

  const handleCompleteTask = async (taskId: number) => {
    try {
      await completeTask(taskId);
      toast.success('Task completed!');
    } catch (error) {
      toast.error('Failed to complete task');
    }
  };

  const pendingTasks = tasks.filter((t) => t.status === 'pending');
  const completedTasks = tasks.filter((t) => t.status === 'completed');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Tasks</h1>
          <p className="text-dark-400">
            {pendingTasks.length} pending · {completedTasks.length} completed
          </p>
        </div>
        <button
          onClick={() => setShowAddTask(true)}
          className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Task
        </button>
      </div>

      {/* Add Task Modal */}
      {showAddTask && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-light rounded-xl p-6 w-full max-w-md animate-slide-in">
            <h2 className="text-xl font-bold text-white mb-4">Add New Task</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Task Title *
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                  placeholder="Enter task title..."
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Description
                </label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:border-primary-500 resize-none"
                  rows={3}
                  placeholder="Add details..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Priority
                </label>
                <div className="flex gap-2">
                  {(['low', 'medium', 'high'] as const).map((priority) => (
                    <button
                      key={priority}
                      onClick={() => setNewTask({ ...newTask, priority })}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                        newTask.priority === priority
                          ? priority === 'high'
                            ? 'bg-red-500 text-white'
                            : priority === 'medium'
                            ? 'bg-yellow-500 text-white'
                            : 'bg-green-500 text-white'
                          : 'bg-dark-800 text-dark-400 hover:text-white'
                      }`}
                    >
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddTask(false)}
                className="flex-1 px-4 py-2 bg-dark-800 hover:bg-dark-700 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTask}
                className="flex-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
              >
                Add Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Suggestions */}
      {predictedTasks.length > 0 && (
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-purple-400" />
            AI Suggested Tasks
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {predictedTasks.map((task, index) => (
              <div
                key={index}
                className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg hover:border-purple-500/50 transition-all cursor-pointer group"
              >
                <h3 className="font-medium text-white group-hover:text-purple-300">
                  {task.title}
                </h3>
                {task.description && (
                  <p className="text-sm text-dark-400 mt-1">{task.description}</p>
                )}
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded">
                    AI Suggested
                  </span>
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
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Tasks */}
      <div className="glass rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-yellow-400" />
          Pending Tasks ({pendingTasks.length})
        </h2>

        {pendingTasks.length > 0 ? (
          <div className="space-y-3">
            {pendingTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onComplete={() => task.id && handleCompleteTask(task.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-dark-500">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No pending tasks. Great job!</p>
          </div>
        )}
      </div>

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            Completed Tasks ({completedTasks.length})
          </h2>
          <div className="space-y-3">
            {completedTasks.slice(0, 10).map((task) => (
              <TaskItem key={task.id} task={task} completed />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface TaskItemProps {
  task: any;
  completed?: boolean;
  onComplete?: () => void;
}

function TaskItem({ task, completed, onComplete }: TaskItemProps) {
  return (
    <div
      className={`p-4 rounded-lg border transition-all ${
        completed
          ? 'bg-green-500/10 border-green-500/30'
          : 'bg-dark-800 border-dark-700 hover:border-primary-500/50'
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={onComplete}
          disabled={completed}
          className="mt-1 focus:outline-none"
        >
          {completed ? (
            <CheckCircle2 className="w-5 h-5 text-green-400" />
          ) : (
            <Circle className="w-5 h-5 text-dark-600 hover:text-primary-400 transition-colors" />
          )}
        </button>

        <div className="flex-1">
          <h3
            className={`font-medium ${
              completed ? 'text-dark-400 line-through' : 'text-white'
            }`}
          >
            {task.title}
          </h3>
          {task.description && (
            <p className="text-sm text-dark-400 mt-1">{task.description}</p>
          )}

          <div className="flex items-center gap-2 mt-3">
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
            {task.predictedBy === 'ai' && (
              <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded">
                AI
              </span>
            )}
            {task.createdAt && (
              <span className="text-xs text-dark-500">
                {formatTimestamp(task.createdAt, 'date')}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
