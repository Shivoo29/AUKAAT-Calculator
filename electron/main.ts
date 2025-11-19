import { app, BrowserWindow, ipcMain, Tray, Menu, globalShortcut, screen } from 'electron';
import path from 'path';
import { ActivityMonitor } from './services/ActivityMonitor';
import { DatabaseService } from './services/DatabaseService';
import { FileWatcher } from './services/FileWatcher';
import { TaskPredictor } from './services/TaskPredictor';
import { FocusManager } from './services/FocusManager';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let activityMonitor: ActivityMonitor;
let database: DatabaseService;
let fileWatcher: FileWatcher;
let taskPredictor: TaskPredictor;
let focusManager: FocusManager;

// Production/dev URLs
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

// Extend app type to include isQuitting
interface AppWithQuitting extends Electron.App {
  isQuitting?: boolean;
}

// Add isQuitting flag
(app as AppWithQuitting).isQuitting = false;

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: Math.min(1400, width - 100),
    height: Math.min(900, height - 100),
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#0f172a',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // Load the app
  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Hide on close (keep running in background)
  mainWindow.on('close', (event) => {
    if (!(app as AppWithQuitting).isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  // Create tray icon (will need actual icon file)
  const iconPath = path.join(__dirname, '../assets/tray-icon.png');
  tray = new Tray(iconPath);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Dashboard',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        } else {
          createWindow();
        }
      },
    },
    {
      label: 'Focus Mode',
      type: 'checkbox',
      checked: false,
      click: (menuItem) => {
        focusManager.toggleFocusMode(menuItem.checked);
      },
    },
    { type: 'separator' },
    {
      label: 'Quick Stats',
      click: () => {
        // Show quick stats window
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        (app as AppWithQuitting).isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip('Aukaat Productivity OS');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow) {
      mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    } else {
      createWindow();
    }
  });
}

function initializeServices() {
  // Initialize database
  database = new DatabaseService();
  database.initialize();

  // Initialize activity monitor
  activityMonitor = new ActivityMonitor(database);
  activityMonitor.start();

  // Initialize file watcher
  fileWatcher = new FileWatcher(database);
  fileWatcher.start();

  // Initialize task predictor
  taskPredictor = new TaskPredictor(database);

  // Initialize focus manager
  focusManager = new FocusManager(database);
}

function setupIPC() {
  // Activity data
  ipcMain.handle('get-activity-summary', async (_event, timeRange: string) => {
    return await activityMonitor.getSummary(timeRange);
  });

  // Tasks
  ipcMain.handle('get-predicted-tasks', async () => {
    return await taskPredictor.getPredictedTasks();
  });

  ipcMain.handle('add-task', async (_event, task: any) => {
    return await database.addTask(task);
  });

  ipcMain.handle('complete-task', async (_event, taskId: number) => {
    return await database.completeTask(taskId);
  });

  // Focus mode
  ipcMain.handle('toggle-focus-mode', async (_event, enabled: boolean) => {
    return await focusManager.toggleFocusMode(enabled);
  });

  ipcMain.handle('get-focus-stats', async () => {
    return await focusManager.getStats();
  });

  // File operations
  ipcMain.handle('organize-files', async (_event, directory: string) => {
    return await fileWatcher.organizeDirectory(directory);
  });

  // Daily report
  ipcMain.handle('get-daily-report', async (_event, date: string) => {
    return await database.getDailyReport(date);
  });

  // Settings
  ipcMain.handle('get-settings', async () => {
    return await database.getSettings();
  });

  ipcMain.handle('update-settings', async (_event, settings: any) => {
    return await database.updateSettings(settings);
  });
}

function registerGlobalShortcuts() {
  // Command palette: Cmd/Ctrl + Shift + Space
  globalShortcut.register('CommandOrControl+Shift+Space', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.webContents.send('toggle-command-palette');
      } else {
        mainWindow.show();
        mainWindow.webContents.send('toggle-command-palette');
      }
    } else {
      createWindow();
    }
  });

  // Quick dashboard: Cmd/Ctrl + Shift + D
  globalShortcut.register('CommandOrControl+Shift+D', () => {
    if (mainWindow) {
      mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    } else {
      createWindow();
    }
  });
}

// App lifecycle
app.whenReady().then(() => {
  initializeServices();
  createWindow();
  createTray();
  setupIPC();
  registerGlobalShortcuts();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Keep running in background on all platforms
  // Users can quit from tray
});

app.on('before-quit', () => {
  (app as AppWithQuitting).isQuitting = true;

  // Cleanup services
  if (activityMonitor) activityMonitor.stop();
  if (fileWatcher) fileWatcher.stop();

  globalShortcut.unregisterAll();
});

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  // Log to database
  if (database) {
    database.logError(error);
  }
});
