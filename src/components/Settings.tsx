import { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Settings as SettingsIcon, Shield, Bell, FolderOpen, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Settings() {
  const { settings, loadSettings, updateSettings, isLoadingSettings } = useAppStore();
  const [localSettings, setLocalSettings] = useState(settings);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const handleSave = async () => {
    if (!localSettings) return;

    try {
      await updateSettings(localSettings);
      setHasChanges(false);
      toast.success('Settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save settings');
    }
  };

  const updateLocalSettings = (updates: any) => {
    setLocalSettings((prev: any) => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  if (isLoadingSettings || !localSettings) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 border-4 border-dark-700 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-dark-400">Customize your productivity experience</p>
        </div>

        {hasChanges && (
          <button
            onClick={handleSave}
            className="px-6 py-3 gradient-primary text-white rounded-lg font-medium flex items-center gap-2 hover:shadow-lg hover:shadow-primary-500/50 transition-all"
          >
            <Save className="w-5 h-5" />
            Save Changes
          </button>
        )}
      </div>

      {/* Focus Mode Settings */}
      <div className="glass rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-primary-400" />
          Focus Mode
        </h2>

        <div className="space-y-6">
          {/* Blocked Apps */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Blocked Apps
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {localSettings.focusMode.blockedApps.map((app: string, index: number) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-red-500/20 text-red-300 rounded-lg text-sm flex items-center gap-2"
                >
                  {app}
                  <button
                    onClick={() => {
                      const newApps = [...localSettings.focusMode.blockedApps];
                      newApps.splice(index, 1);
                      updateLocalSettings({
                        focusMode: { ...localSettings.focusMode, blockedApps: newApps },
                      });
                    }}
                    className="hover:text-red-200"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              placeholder="Add app name and press Enter"
              className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  updateLocalSettings({
                    focusMode: {
                      ...localSettings.focusMode,
                      blockedApps: [
                        ...localSettings.focusMode.blockedApps,
                        e.currentTarget.value.trim(),
                      ],
                    },
                  });
                  e.currentTarget.value = '';
                }
              }}
            />
          </div>

          {/* Blocked Websites */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Blocked Websites
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {localSettings.focusMode.blockedWebsites.map((site: string, index: number) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-red-500/20 text-red-300 rounded-lg text-sm flex items-center gap-2"
                >
                  {site}
                  <button
                    onClick={() => {
                      const newSites = [...localSettings.focusMode.blockedWebsites];
                      newSites.splice(index, 1);
                      updateLocalSettings({
                        focusMode: {
                          ...localSettings.focusMode,
                          blockedWebsites: newSites,
                        },
                      });
                    }}
                    className="hover:text-red-200"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              placeholder="Add website domain and press Enter"
              className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  updateLocalSettings({
                    focusMode: {
                      ...localSettings.focusMode,
                      blockedWebsites: [
                        ...localSettings.focusMode.blockedWebsites,
                        e.currentTarget.value.trim(),
                      ],
                    },
                  });
                  e.currentTarget.value = '';
                }
              }}
            />
          </div>

          {/* Work Hours */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Work Hours Start
              </label>
              <input
                type="time"
                value={localSettings.focusMode.workHoursStart}
                onChange={(e) =>
                  updateLocalSettings({
                    focusMode: {
                      ...localSettings.focusMode,
                      workHoursStart: e.target.value,
                    },
                  })
                }
                className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Work Hours End
              </label>
              <input
                type="time"
                value={localSettings.focusMode.workHoursEnd}
                onChange={(e) =>
                  updateLocalSettings({
                    focusMode: {
                      ...localSettings.focusMode,
                      workHoursEnd: e.target.value,
                    },
                  })
                }
                className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* File Organization Settings */}
      <div className="glass rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <FolderOpen className="w-6 h-6 text-green-400" />
          File Organization
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-white">Auto-organize files</p>
              <p className="text-sm text-dark-400">
                Automatically organize files in watched directories
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.fileOrganization.autoOrganize}
                onChange={(e) =>
                  updateLocalSettings({
                    fileOrganization: {
                      ...localSettings.fileOrganization,
                      autoOrganize: e.target.checked,
                    },
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-dark-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Notifications Settings */}
      <div className="glass rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Bell className="w-6 h-6 text-yellow-400" />
          Notifications
        </h2>

        <div className="space-y-4">
          {[
            { key: 'enabled', label: 'Enable notifications', desc: 'Show all notifications' },
            {
              key: 'focusReminders',
              label: 'Focus reminders',
              desc: 'Remind me to take breaks during focus sessions',
            },
            {
              key: 'taskSuggestions',
              label: 'Task suggestions',
              desc: 'Show AI-powered task suggestions',
            },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">{item.label}</p>
                <p className="text-sm text-dark-400">{item.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={(localSettings.notifications as any)[item.key]}
                  onChange={(e) =>
                    updateLocalSettings({
                      notifications: {
                        ...localSettings.notifications,
                        [item.key]: e.target.checked,
                      },
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-dark-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="glass rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-400" />
          Privacy
        </h2>

        <div className="space-y-4">
          {[
            {
              key: 'trackWebBrowsing',
              label: 'Track web browsing',
              desc: 'Monitor browsing activity for productivity insights',
            },
            { key: 'trackTyping', label: 'Track typing', desc: 'Analyze typing patterns' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">{item.label}</p>
                <p className="text-sm text-dark-400">{item.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={(localSettings.privacy as any)[item.key]}
                  onChange={(e) =>
                    updateLocalSettings({
                      privacy: { ...localSettings.privacy, [item.key]: e.target.checked },
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-dark-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
              </label>
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Data Retention (days)
            </label>
            <input
              type="number"
              min="1"
              max="365"
              value={localSettings.privacy.dataRetentionDays}
              onChange={(e) =>
                updateLocalSettings({
                  privacy: {
                    ...localSettings.privacy,
                    dataRetentionDays: parseInt(e.target.value) || 90,
                  },
                })
              }
              className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
            />
            <p className="text-xs text-dark-500 mt-1">
              Data older than this will be automatically deleted
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
