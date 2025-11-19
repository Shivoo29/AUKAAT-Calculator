import { powerMonitor } from 'electron';
import { exec } from 'child_process';
import { promisify } from 'util';
import { DatabaseService, Activity } from './DatabaseService';

const execAsync = promisify(exec);

interface ActiveWindow {
  appName: string;
  windowTitle: string;
  timestamp: number;
}

export class ActivityMonitor {
  private database: DatabaseService;
  private monitorInterval: NodeJS.Timeout | null = null;
  private currentActivity: ActiveWindow | null = null;
  private activityStartTime: number = 0;
  private isIdle: boolean = false;
  private platform: NodeJS.Platform;

  // Productivity categories
  private productiveApps = new Set([
    'Code',
    'Visual Studio Code',
    'WebStorm',
    'IntelliJ IDEA',
    'Terminal',
    'iTerm',
    'Sublime Text',
    'Atom',
    'PyCharm',
    'Eclipse',
    'Xcode',
    'Word',
    'Excel',
    'PowerPoint',
    'Notion',
    'Obsidian',
    'Roam',
  ]);

  constructor(database: DatabaseService) {
    this.database = database;
    this.platform = process.platform;
    this.setupPowerMonitoring();
  }

  private setupPowerMonitoring() {
    powerMonitor.on('suspend', () => {
      this.handleIdle();
    });

    powerMonitor.on('resume', () => {
      this.handleResume();
    });

    powerMonitor.on('lock-screen', () => {
      this.handleIdle();
    });

    powerMonitor.on('unlock-screen', () => {
      this.handleResume();
    });

    setInterval(() => {
      const idleTime = powerMonitor.getSystemIdleTime();
      if (idleTime > 300 && !this.isIdle) {
        this.handleIdle();
      } else if (idleTime < 60 && this.isIdle) {
        this.handleResume();
      }
    }, 60000);
  }

  private handleIdle() {
    this.isIdle = true;
    if (this.currentActivity) {
      this.logCurrentActivity();
      this.currentActivity = null;
    }
  }

  private handleResume() {
    this.isIdle = false;
    this.activityStartTime = Date.now();
  }

  async start() {
    console.log('Starting activity monitor...');
    this.monitorInterval = setInterval(async () => {
      if (!this.isIdle) {
        await this.checkActiveWindow();
      }
    }, 5000);
    this.activityStartTime = Date.now();
  }

  stop() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    if (this.currentActivity) {
      this.logCurrentActivity();
    }
  }

  private async checkActiveWindow() {
    try {
      const activeWindow = await this.getActiveWindow();
      if (!activeWindow) return;

      if (
        this.currentActivity &&
        (this.currentActivity.appName !== activeWindow.appName ||
          this.currentActivity.windowTitle !== activeWindow.windowTitle)
      ) {
        this.logCurrentActivity();
      }

      if (
        !this.currentActivity ||
        this.currentActivity.appName !== activeWindow.appName ||
        this.currentActivity.windowTitle !== activeWindow.windowTitle
      ) {
        this.currentActivity = activeWindow;
        this.activityStartTime = Date.now();
      }
    } catch (error) {
      console.error('Error checking active window:', error);
    }
  }

  private logCurrentActivity() {
    if (!this.currentActivity) return;
    const duration = Math.floor((Date.now() - this.activityStartTime) / 1000);
    if (duration < 3) return;

    const activity: Activity = {
      timestamp: Math.floor(this.activityStartTime / 1000),
      appName: this.currentActivity.appName,
      windowTitle: this.currentActivity.windowTitle,
      duration,
      category: this.categorizeActivity(this.currentActivity.appName),
      isProductive: this.isProductiveActivity(this.currentActivity.appName),
    };

    try {
      this.database.logActivity(activity);
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }

  private categorizeActivity(appName: string): string {
    const lower = appName.toLowerCase();
    if (lower.includes('code') || lower.includes('terminal') || lower.includes('git')) return 'Development';
    if (lower.includes('chrome') || lower.includes('firefox') || lower.includes('safari')) return 'Web Browsing';
    if (lower.includes('word') || lower.includes('excel') || lower.includes('powerpoint')) return 'Office Work';
    if (lower.includes('slack') || lower.includes('teams') || lower.includes('zoom')) return 'Communication';
    if (lower.includes('spotify') || lower.includes('music') || lower.includes('youtube')) return 'Entertainment';
    return 'Other';
  }

  private isProductiveActivity(appName: string): boolean {
    if (this.productiveApps.has(appName)) return true;
    const lower = appName.toLowerCase();
    const productiveKeywords = ['code', 'terminal', 'studio', 'editor', 'work', 'office', 'document'];
    return productiveKeywords.some((keyword) => lower.includes(keyword));
  }

  private async getActiveWindow(): Promise<ActiveWindow | null> {
    switch (this.platform) {
      case 'darwin':
        return this.getActiveWindowMacOS();
      case 'win32':
        return this.getActiveWindowWindows();
      case 'linux':
        return this.getActiveWindowLinux();
      default:
        return null;
    }
  }

  private async getActiveWindowMacOS(): Promise<ActiveWindow | null> {
    try {
      const script = `tell application "System Events" to get name of first application process whose frontmost is true`;
      const { stdout } = await execAsync(`osascript -e '${script}'`);
      return {
        appName: stdout.trim() || 'Unknown',
        windowTitle: '',
        timestamp: Date.now(),
      };
    } catch (error) {
      return null;
    }
  }

  private async getActiveWindowWindows(): Promise<ActiveWindow | null> {
    try {
      const script = `Get-Process | Where-Object {$_.MainWindowTitle -ne ""} | Select-Object -First 1 -ExpandProperty ProcessName`;
      const { stdout } = await execAsync(`powershell -Command "${script}"`);
      return {
        appName: stdout.trim() || 'Unknown',
        windowTitle: '',
        timestamp: Date.now(),
      };
    } catch (error) {
      return null;
    }
  }

  private async getActiveWindowLinux(): Promise<ActiveWindow | null> {
    try {
      const { stdout } = await execAsync('xdotool getactivewindow getwindowname');
      return {
        appName: 'Unknown',
        windowTitle: stdout.trim() || '',
        timestamp: Date.now(),
      };
    } catch (error) {
      return null;
    }
  }

  async getSummary(timeRange: string) {
    return this.database.getActivitySummary(timeRange);
  }
}
