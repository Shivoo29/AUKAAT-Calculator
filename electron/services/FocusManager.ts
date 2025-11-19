import { app, Notification } from 'electron';
import { exec } from 'child_process';
import { promisify } from 'util';
import { DatabaseService } from './DatabaseService';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

interface FocusSession {
  id?: number;
  startTime: number;
  endTime?: number;
  distractionCount: number;
  blockedAttempts: number;
  tasksCompleted: number;
}

export class FocusManager {
  private database: DatabaseService;
  private isFocusMode: boolean = false;
  private currentSession: FocusSession | null = null;
  private distractionCheckInterval: NodeJS.Timeout | null = null;
  private blockedApps: Set<string> = new Set();
  private blockedWebsites: Set<string> = new Set();
  private platform: NodeJS.Platform;
  private hostsFilePath: string;
  private originalHostsContent: string = '';

  constructor(database: DatabaseService) {
    this.database = database;
    this.platform = process.platform;
    this.hostsFilePath = this.getHostsFilePath();
    this.loadSettings();
  }

  private getHostsFilePath(): string {
    switch (this.platform) {
      case 'win32':
        return 'C:\\Windows\\System32\\drivers\\etc\\hosts';
      case 'darwin':
      case 'linux':
        return '/etc/hosts';
      default:
        return '/etc/hosts';
    }
  }

  private async loadSettings() {
    try {
      const settings = await this.database.getSettings();
      this.blockedApps = new Set(settings.focusMode.blockedApps);
      this.blockedWebsites = new Set(settings.focusMode.blockedWebsites);
    } catch (error) {
      console.error('Error loading focus settings:', error);
    }
  }

  async toggleFocusMode(enabled: boolean) {
    if (enabled === this.isFocusMode) return;

    this.isFocusMode = enabled;

    if (enabled) {
      await this.startFocusMode();
    } else {
      await this.endFocusMode();
    }
  }

  private async startFocusMode() {
    console.log('Starting focus mode...');

    // Create focus session
    const sessionId = this.database.startFocusSession();
    this.currentSession = {
      id: sessionId as number,
      startTime: Math.floor(Date.now() / 1000),
      distractionCount: 0,
      blockedAttempts: 0,
      tasksCompleted: 0,
    };

    // Block websites
    await this.blockWebsites();

    // Start monitoring for distracting apps
    this.startDistractionMonitoring();

    // Show notification
    this.showNotification(
      'Focus Mode Activated',
      'Distracting apps and websites are now blocked. Stay focused!'
    );
  }

  private async endFocusMode() {
    console.log('Ending focus mode...');

    // Unblock websites
    await this.unblockWebsites();

    // Stop monitoring
    this.stopDistractionMonitoring();

    // Calculate focus score
    if (this.currentSession) {
      const duration = Math.floor(Date.now() / 1000) - this.currentSession.startTime;
      const focusScore = this.calculateFocusScore(
        duration,
        this.currentSession.distractionCount,
        this.currentSession.blockedAttempts
      );

      // Save session
      this.database.endFocusSession(this.currentSession.id!, {
        duration,
        distractionCount: this.currentSession.distractionCount,
        tasksCompleted: this.currentSession.tasksCompleted,
        focusScore,
      });

      // Show summary notification
      this.showNotification(
        'Focus Session Complete!',
        `Duration: ${Math.floor(duration / 60)}min | Focus Score: ${Math.round(focusScore * 100)}%`
      );

      this.currentSession = null;
    }
  }

  private calculateFocusScore(
    duration: number,
    distractions: number,
    blockedAttempts: number
  ): number {
    // Base score
    let score = 1.0;

    // Penalize for distractions (each distraction reduces score by 5%)
    score -= distractions * 0.05;

    // Penalize for blocked attempts (each attempt reduces score by 2%)
    score -= blockedAttempts * 0.02;

    // Bonus for long sessions (> 25 minutes = pomodoro)
    if (duration > 25 * 60) {
      score += 0.1;
    }

    return Math.max(0, Math.min(1, score));
  }

  private async blockWebsites() {
    try {
      // Read current hosts file
      this.originalHostsContent = fs.readFileSync(this.hostsFilePath, 'utf8');

      // Add blocking entries
      let newContent = this.originalHostsContent;

      // Add marker for our entries
      newContent += '\n# AUKAAT FOCUS MODE - DO NOT EDIT THIS SECTION\n';

      this.blockedWebsites.forEach((website) => {
        newContent += `127.0.0.1 ${website}\n`;
        newContent += `127.0.0.1 www.${website}\n`;
      });

      newContent += '# END AUKAAT FOCUS MODE\n';

      // Write updated hosts file (requires admin/root privileges)
      if (this.platform === 'win32') {
        // On Windows, try to write with elevated privileges
        const tempFile = path.join(app.getPath('temp'), 'hosts_temp');
        fs.writeFileSync(tempFile, newContent);

        await execAsync(
          `powershell -Command "Start-Process cmd -ArgumentList '/c copy ${tempFile} ${this.hostsFilePath}' -Verb RunAs"`
        );
      } else {
        // On Unix-like systems
        const tempFile = path.join(app.getPath('temp'), 'hosts_temp');
        fs.writeFileSync(tempFile, newContent);

        // Try with sudo (will prompt for password)
        await execAsync(`sudo cp ${tempFile} ${this.hostsFilePath}`);
      }

      // Flush DNS cache
      await this.flushDNSCache();

      console.log('Websites blocked successfully');
    } catch (error) {
      console.error('Error blocking websites:', error);
      // If we can't modify hosts file, just log the error
      // The app will still work, just without website blocking
    }
  }

  private async unblockWebsites() {
    try {
      if (!this.originalHostsContent) return;

      // Restore original hosts file
      if (this.platform === 'win32') {
        const tempFile = path.join(app.getPath('temp'), 'hosts_restore');
        fs.writeFileSync(tempFile, this.originalHostsContent);

        await execAsync(
          `powershell -Command "Start-Process cmd -ArgumentList '/c copy ${tempFile} ${this.hostsFilePath}' -Verb RunAs"`
        );
      } else {
        const tempFile = path.join(app.getPath('temp'), 'hosts_restore');
        fs.writeFileSync(tempFile, this.originalHostsContent);

        await execAsync(`sudo cp ${tempFile} ${this.hostsFilePath}`);
      }

      // Flush DNS cache
      await this.flushDNSCache();

      console.log('Websites unblocked successfully');
    } catch (error) {
      console.error('Error unblocking websites:', error);
    }
  }

  private async flushDNSCache() {
    try {
      switch (this.platform) {
        case 'darwin':
          await execAsync('sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder');
          break;
        case 'win32':
          await execAsync('ipconfig /flushdns');
          break;
        case 'linux':
          await execAsync('sudo systemd-resolve --flush-caches');
          break;
      }
    } catch (error) {
      console.error('Error flushing DNS cache:', error);
    }
  }

  private startDistractionMonitoring() {
    // Check for distracting apps every 10 seconds
    this.distractionCheckInterval = setInterval(async () => {
      await this.checkForDistractions();
    }, 10000);
  }

  private stopDistractionMonitoring() {
    if (this.distractionCheckInterval) {
      clearInterval(this.distractionCheckInterval);
      this.distractionCheckInterval = null;
    }
  }

  private async checkForDistractions() {
    try {
      const activeApp = await this.getActiveAppName();

      if (activeApp && this.blockedApps.has(activeApp)) {
        // Distraction detected!
        if (this.currentSession) {
          this.currentSession.blockedAttempts++;
        }

        // Close the app (gentle approach)
        await this.closeApp(activeApp);

        // Show notification
        this.showNotification(
          'Focus Mode: App Blocked',
          `${activeApp} is blocked during focus mode. Stay on track!`
        );
      }
    } catch (error) {
      console.error('Error checking for distractions:', error);
    }
  }

  private async getActiveAppName(): Promise<string | null> {
    try {
      switch (this.platform) {
        case 'darwin':
          const { stdout: macOut } = await execAsync(
            'osascript -e \'tell application "System Events" to get name of first application process whose frontmost is true\''
          );
          return macOut.trim();

        case 'win32':
          const { stdout: winOut } = await execAsync(
            'powershell -Command "Get-Process | Where-Object {$_.MainWindowTitle -ne \\"\\"} | Select-Object -First 1 -ExpandProperty ProcessName"'
          );
          return winOut.trim();

        case 'linux':
          const { stdout: linuxOut } = await execAsync(
            'xdotool getactivewindow getwindowpid'
          );
          const pid = linuxOut.trim();
          const { stdout: processName } = await execAsync(`ps -p ${pid} -o comm=`);
          return processName.trim();

        default:
          return null;
      }
    } catch (error) {
      return null;
    }
  }

  private async closeApp(appName: string) {
    try {
      switch (this.platform) {
        case 'darwin':
          await execAsync(`osascript -e 'quit app "${appName}"'`);
          break;

        case 'win32':
          await execAsync(`taskkill /IM "${appName}.exe" /F`);
          break;

        case 'linux':
          await execAsync(`pkill -f "${appName}"`);
          break;
      }
    } catch (error) {
      console.error(`Error closing app ${appName}:`, error);
    }
  }

  private showNotification(title: string, body: string) {
    if (Notification.isSupported()) {
      new Notification({
        title,
        body,
        icon: path.join(__dirname, '../../assets/icon.png'),
      }).show();
    }
  }

  getStats() {
    // Return stats without accessing private db
    return {
      isFocusMode: this.isFocusMode,
      currentSession: this.currentSession,
      stats: {
        totalSessions: 0,
        totalDuration: 0,
        avgFocusScore: 0,
        totalTasksCompleted: 0,
      },
    };
  }

  recordTaskCompletion() {
    if (this.currentSession) {
      this.currentSession.tasksCompleted++;
    }
  }
}
