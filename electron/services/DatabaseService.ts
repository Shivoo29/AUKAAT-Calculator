import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';

export interface Activity {
  id?: number;
  timestamp: number;
  appName: string;
  windowTitle: string;
  duration: number;
  category?: string;
  isProductive?: boolean;
}

export interface Task {
  id?: number;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  createdAt: number;
  completedAt?: number;
  predictedBy?: 'user' | 'ai';
  relatedFiles?: string[];
  tags?: string[];
}

export interface Settings {
  focusMode: {
    blockedApps: string[];
    blockedWebsites: string[];
    workHoursStart: string;
    workHoursEnd: string;
  };
  fileOrganization: {
    autoOrganize: boolean;
    watchedDirectories: string[];
    organizationRules: Record<string, string>;
  };
  notifications: {
    enabled: boolean;
    focusReminders: boolean;
    taskSuggestions: boolean;
  };
  privacy: {
    trackWebBrowsing: boolean;
    trackTyping: boolean;
    dataRetentionDays: number;
  };
}

export class DatabaseService {
  private db: Database.Database | null = null;
  private dbPath: string;

  constructor() {
    const userDataPath = app.getPath('userData');
    const dbDir = path.join(userDataPath, 'data');

    // Ensure directory exists
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    this.dbPath = path.join(dbDir, 'aukaat.db');
  }

  initialize() {
    try {
      this.db = new Database(this.dbPath);
      this.db.pragma('journal_mode = WAL'); // Better concurrency
      this.createTables();
      this.insertDefaultSettings();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private createTables() {
    if (!this.db) throw new Error('Database not initialized');

    // Activities table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        appName TEXT NOT NULL,
        windowTitle TEXT,
        duration INTEGER NOT NULL,
        category TEXT,
        isProductive INTEGER DEFAULT 0,
        createdAt INTEGER DEFAULT (strftime('%s', 'now'))
      );
      CREATE INDEX IF NOT EXISTS idx_activities_timestamp ON activities(timestamp);
      CREATE INDEX IF NOT EXISTS idx_activities_app ON activities(appName);
    `);

    // Tasks table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'pending',
        priority TEXT DEFAULT 'medium',
        createdAt INTEGER NOT NULL,
        completedAt INTEGER,
        predictedBy TEXT DEFAULT 'user',
        relatedFiles TEXT,
        tags TEXT,
        metadata TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
      CREATE INDEX IF NOT EXISTS idx_tasks_created ON tasks(createdAt);
    `);

    // File events table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS file_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filePath TEXT NOT NULL,
        fileName TEXT NOT NULL,
        fileType TEXT,
        eventType TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        category TEXT,
        projectName TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_file_events_timestamp ON file_events(timestamp);
    `);

    // Focus sessions table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS focus_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        startTime INTEGER NOT NULL,
        endTime INTEGER,
        duration INTEGER,
        distractionCount INTEGER DEFAULT 0,
        tasksCompleted INTEGER DEFAULT 0,
        focusScore REAL
      );
      CREATE INDEX IF NOT EXISTS idx_focus_sessions_start ON focus_sessions(startTime);
    `);

    // Settings table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updatedAt INTEGER DEFAULT (strftime('%s', 'now'))
      );
    `);

    // Error logs table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS error_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        errorMessage TEXT,
        errorStack TEXT,
        context TEXT
      );
    `);
  }

  private insertDefaultSettings() {
    if (!this.db) return;

    const defaultSettings: Settings = {
      focusMode: {
        blockedApps: ['Twitter', 'Facebook', 'Instagram', 'TikTok'],
        blockedWebsites: [
          'twitter.com',
          'facebook.com',
          'instagram.com',
          'tiktok.com',
          'reddit.com',
          'youtube.com',
        ],
        workHoursStart: '09:00',
        workHoursEnd: '17:00',
      },
      fileOrganization: {
        autoOrganize: true,
        watchedDirectories: [
          path.join(app.getPath('downloads')),
          path.join(app.getPath('desktop')),
        ],
        organizationRules: {
          '.pdf': 'Documents/PDFs',
          '.doc': 'Documents',
          '.docx': 'Documents',
          '.xls': 'Documents/Spreadsheets',
          '.xlsx': 'Documents/Spreadsheets',
          '.jpg': 'Pictures',
          '.png': 'Pictures',
          '.mp4': 'Videos',
          '.zip': 'Archives',
        },
      },
      notifications: {
        enabled: true,
        focusReminders: true,
        taskSuggestions: true,
      },
      privacy: {
        trackWebBrowsing: true,
        trackTyping: false,
        dataRetentionDays: 90,
      },
    };

    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)
    `);

    stmt.run('app_settings', JSON.stringify(defaultSettings));
  }

  // Activity methods
  logActivity(activity: Activity) {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      INSERT INTO activities (timestamp, appName, windowTitle, duration, category, isProductive)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    return stmt.run(
      activity.timestamp,
      activity.appName,
      activity.windowTitle || '',
      activity.duration,
      activity.category || null,
      activity.isProductive ? 1 : 0
    );
  }

  getActivities(startTime: number, endTime: number): Activity[] {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      SELECT * FROM activities
      WHERE timestamp BETWEEN ? AND ?
      ORDER BY timestamp DESC
    `);

    return stmt.all(startTime, endTime) as Activity[];
  }

  getActivitySummary(timeRange: string) {
    if (!this.db) throw new Error('Database not initialized');

    const now = Math.floor(Date.now() / 1000);
    let startTime: number;

    switch (timeRange) {
      case 'today':
        startTime = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);
        break;
      case 'week':
        startTime = now - 7 * 24 * 60 * 60;
        break;
      case 'month':
        startTime = now - 30 * 24 * 60 * 60;
        break;
      default:
        startTime = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);
    }

    const totalTime = this.db.prepare(`
      SELECT SUM(duration) as total FROM activities
      WHERE timestamp >= ?
    `).get(startTime) as { total: number };

    const byApp = this.db.prepare(`
      SELECT appName, SUM(duration) as duration, COUNT(*) as count
      FROM activities
      WHERE timestamp >= ?
      GROUP BY appName
      ORDER BY duration DESC
      LIMIT 10
    `).all(startTime);

    const productive = this.db.prepare(`
      SELECT SUM(duration) as total FROM activities
      WHERE timestamp >= ? AND isProductive = 1
    `).get(startTime) as { total: number };

    return {
      totalTime: totalTime.total || 0,
      productiveTime: productive.total || 0,
      byApp,
      startTime,
      endTime: now,
    };
  }

  // Task methods
  addTask(task: Omit<Task, 'id'>) {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      INSERT INTO tasks (title, description, status, priority, createdAt, predictedBy, relatedFiles, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      task.title,
      task.description || null,
      task.status,
      task.priority,
      task.createdAt,
      task.predictedBy || 'user',
      task.relatedFiles ? JSON.stringify(task.relatedFiles) : null,
      task.tags ? JSON.stringify(task.tags) : null
    );

    return { id: result.lastInsertRowid, ...task };
  }

  completeTask(taskId: number) {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      UPDATE tasks
      SET status = 'completed', completedAt = ?
      WHERE id = ?
    `);

    return stmt.run(Math.floor(Date.now() / 1000), taskId);
  }

  getTasks(status?: string): Task[] {
    if (!this.db) throw new Error('Database not initialized');

    const query = status
      ? 'SELECT * FROM tasks WHERE status = ? ORDER BY createdAt DESC'
      : 'SELECT * FROM tasks ORDER BY createdAt DESC';

    const stmt = this.db.prepare(query);
    const rows = status ? stmt.all(status) : stmt.all();

    return rows.map((row: any) => ({
      ...row,
      relatedFiles: row.relatedFiles ? JSON.parse(row.relatedFiles) : [],
      tags: row.tags ? JSON.parse(row.tags) : [],
    })) as Task[];
  }

  // File events
  logFileEvent(event: any) {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      INSERT INTO file_events (filePath, fileName, fileType, eventType, timestamp, category, projectName)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    return stmt.run(
      event.filePath,
      event.fileName,
      event.fileType || null,
      event.eventType,
      event.timestamp,
      event.category || null,
      event.projectName || null
    );
  }

  // Focus sessions
  startFocusSession() {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      INSERT INTO focus_sessions (startTime) VALUES (?)
    `);

    const result = stmt.run(Math.floor(Date.now() / 1000));
    return result.lastInsertRowid;
  }

  endFocusSession(sessionId: number, stats: any) {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      UPDATE focus_sessions
      SET endTime = ?, duration = ?, distractionCount = ?, tasksCompleted = ?, focusScore = ?
      WHERE id = ?
    `);

    return stmt.run(
      Math.floor(Date.now() / 1000),
      stats.duration,
      stats.distractionCount,
      stats.tasksCompleted,
      stats.focusScore,
      sessionId
    );
  }

  // Settings
  getSettings(): Settings {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`SELECT value FROM settings WHERE key = ?`);
    const result = stmt.get('app_settings') as { value: string };

    return result ? JSON.parse(result.value) : null;
  }

  updateSettings(settings: Settings) {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      UPDATE settings SET value = ?, updatedAt = ? WHERE key = ?
    `);

    return stmt.run(
      JSON.stringify(settings),
      Math.floor(Date.now() / 1000),
      'app_settings'
    );
  }

  // Daily report
  getDailyReport(date: string) {
    if (!this.db) throw new Error('Database not initialized');

    const startOfDay = Math.floor(new Date(date).setHours(0, 0, 0, 0) / 1000);
    const endOfDay = Math.floor(new Date(date).setHours(23, 59, 59, 999) / 1000);

    const activities = this.getActivitySummary('today');
    const tasks = this.db.prepare(`
      SELECT * FROM tasks
      WHERE createdAt BETWEEN ? AND ?
    `).all(startOfDay, endOfDay);

    const focusSessions = this.db.prepare(`
      SELECT * FROM focus_sessions
      WHERE startTime BETWEEN ? AND ?
    `).all(startOfDay, endOfDay);

    return {
      date,
      activities,
      tasks,
      focusSessions,
      summary: {
        totalTime: activities.totalTime,
        productiveTime: activities.productiveTime,
        tasksCompleted: tasks.filter((t: any) => t.status === 'completed').length,
        focusSessionCount: focusSessions.length,
      },
    };
  }

  // Error logging
  logError(error: Error, context?: string) {
    if (!this.db) return;

    try {
      const stmt = this.db.prepare(`
        INSERT INTO error_logs (timestamp, errorMessage, errorStack, context)
        VALUES (?, ?, ?, ?)
      `);

      stmt.run(
        Math.floor(Date.now() / 1000),
        error.message,
        error.stack || null,
        context || null
      );
    } catch (e) {
      console.error('Failed to log error to database:', e);
    }
  }

  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
