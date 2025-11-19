import { watch, FSWatcher } from 'fs';
import { readdir, stat, rename, mkdir } from 'fs/promises';
import path from 'path';
import { DatabaseService } from './DatabaseService';

interface FileEvent {
  filePath: string;
  fileName: string;
  fileType: string;
  eventType: 'created' | 'modified' | 'deleted';
  timestamp: number;
  category?: string;
  projectName?: string;
}

export class FileWatcher {
  private database: DatabaseService;
  private watchers: Map<string, FSWatcher> = new Map();
  private processingQueue: Set<string> = new Set();
  private organizationRules: Map<string, string> = new Map();
  private categoryMap: Record<string, string> = {
    '.pdf': 'Documents/PDFs',
    '.doc': 'Documents',
    '.docx': 'Documents',
    '.txt': 'Documents',
    '.xls': 'Documents/Spreadsheets',
    '.xlsx': 'Documents/Spreadsheets',
    '.csv': 'Documents/Spreadsheets',
    '.ppt': 'Documents/Presentations',
    '.pptx': 'Documents/Presentations',
    '.jpg': 'Pictures',
    '.jpeg': 'Pictures',
    '.png': 'Pictures',
    '.gif': 'Pictures',
    '.mp4': 'Videos',
    '.mov': 'Videos',
    '.mp3': 'Music',
    '.zip': 'Archives',
    '.rar': 'Archives',
    '.js': 'Code',
    '.ts': 'Code',
    '.py': 'Code',
    '.exe': 'Installers',
    '.dmg': 'Installers',
  };

  constructor(database: DatabaseService) {
    this.database = database;
    this.loadOrganizationRules();
  }

  private async loadOrganizationRules() {
    try {
      const settings = await this.database.getSettings();
      if (settings) {
        const rules = settings.fileOrganization.organizationRules;
        Object.entries(rules).forEach(([extension, destination]) => {
          this.organizationRules.set(extension, destination);
        });
      }
    } catch (error) {
      console.error('Error loading organization rules:', error);
    }
  }

  async start() {
    try {
      const settings = await this.database.getSettings();
      if (settings) {
        const directories = settings.fileOrganization.watchedDirectories;
        for (const directory of directories) {
          this.watchDirectory(directory);
        }
        console.log(`Watching ${directories.length} directories for file changes`);
      }
    } catch (error) {
      console.error('Error starting file watcher:', error);
    }
  }

  stop() {
    this.watchers.forEach((watcher) => watcher.close());
    this.watchers.clear();
  }

  private watchDirectory(directory: string) {
    try {
      const watcher = watch(directory, { recursive: false }, async (_eventType, filename) => {
        if (!filename) return;
        const filePath = path.join(directory, filename);
        if (this.processingQueue.has(filePath)) return;
        this.processingQueue.add(filePath);
        try {
          await this.handleFileEvent(filePath);
        } catch (error) {
          console.error('Error handling file event:', error);
        } finally {
          setTimeout(() => {
            this.processingQueue.delete(filePath);
          }, 2000);
        }
      });
      this.watchers.set(directory, watcher);
    } catch (error) {
      console.error(`Error watching directory ${directory}:`, error);
    }
  }

  private async handleFileEvent(filePath: string) {
    try {
      const exists = await stat(filePath).then(() => true, () => false);
      const fileName = path.basename(filePath);
      const fileExtension = path.extname(fileName).toLowerCase();
      let event: FileEvent;

      if (!exists) {
        event = {
          filePath,
          fileName,
          fileType: fileExtension,
          eventType: 'deleted',
          timestamp: Math.floor(Date.now() / 1000),
        };
      } else {
        const stats = await stat(filePath);
        const isNew = Date.now() - stats.birthtimeMs < 5000;
        event = {
          filePath,
          fileName,
          fileType: fileExtension,
          eventType: isNew ? 'created' : 'modified',
          timestamp: Math.floor(Date.now() / 1000),
          category: this.categorizeFile(fileExtension),
          projectName: path.basename(path.dirname(filePath)),
        };

        if (isNew) {
          const settings = await this.database.getSettings();
          if (settings && settings.fileOrganization.autoOrganize) {
            await this.organizeFile(filePath);
          }
        }
      }

      this.database.logFileEvent(event);
    } catch (error) {
      console.error('Error handling file event:', error);
    }
  }

  private categorizeFile(extension: string): string {
    return this.categoryMap[extension] || 'Other';
  }

  async organizeFile(filePath: string): Promise<string | null> {
    try {
      const fileName = path.basename(filePath);
      const fileExtension = path.extname(fileName).toLowerCase();
      const directory = path.dirname(filePath);
      const relativeDestination = this.organizationRules.get(fileExtension) || this.categoryMap[fileExtension];

      if (!relativeDestination) {
        console.log(`No organization rule for ${fileExtension}`);
        return null;
      }

      const destinationDir = path.join(directory, relativeDestination);
      const destinationPath = path.join(destinationDir, fileName);
      await mkdir(destinationDir, { recursive: true });
      await rename(filePath, destinationPath);
      console.log(`Organized: ${fileName} -> ${relativeDestination}`);
      return destinationPath;
    } catch (error) {
      console.error('Error organizing file:', error);
      return null;
    }
  }

  async organizeDirectory(directory: string) {
    try {
      const files = await readdir(directory);
      const results = { organized: 0, skipped: 0, errors: 0 };

      for (const file of files) {
        const filePath = path.join(directory, file);
        const stats = await stat(filePath);
        if (stats.isDirectory()) {
          results.skipped++;
          continue;
        }
        const newPath = await this.organizeFile(filePath);
        if (newPath) {
          results.organized++;
        } else {
          results.skipped++;
        }
      }

      return results;
    } catch (error) {
      console.error('Error organizing directory:', error);
      throw error;
    }
  }

  addWatchDirectory(directory: string) {
    if (!this.watchers.has(directory)) {
      this.watchDirectory(directory);
    }
  }

  removeWatchDirectory(directory: string) {
    const watcher = this.watchers.get(directory);
    if (watcher) {
      watcher.close();
      this.watchers.delete(directory);
    }
  }
}
