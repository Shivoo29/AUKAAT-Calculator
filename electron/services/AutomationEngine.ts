import { DatabaseService } from './DatabaseService';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

interface AutomationRule {
  id?: number;
  name: string;
  trigger: 'file_created' | 'app_opened' | 'time_based' | 'manual';
  condition: any;
  action: 'organize_file' | 'open_app' | 'run_command' | 'create_task';
  actionParams: any;
  enabled: boolean;
}

interface EmailTemplate {
  subject: string;
  body: string;
  context: string;
}

export class AutomationEngine {
  private database: DatabaseService;
  private rules: AutomationRule[] = [];
  private isRunning: boolean = false;

  constructor(database: DatabaseService) {
    this.database = database;
    this.loadRules();
  }

  private async loadRules() {
    // In a real implementation, load from database
    this.rules = [
      {
        name: 'Morning Standup Reminder',
        trigger: 'time_based',
        condition: { time: '09:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
        action: 'create_task',
        actionParams: {
          title: 'Daily standup meeting',
          priority: 'high',
        },
        enabled: true,
      },
      {
        name: 'End of Day Summary',
        trigger: 'time_based',
        condition: { time: '17:00' },
        action: 'create_task',
        actionParams: {
          title: 'Review completed tasks and plan tomorrow',
          priority: 'medium',
        },
        enabled: true,
      },
    ];
  }

  start() {
    this.isRunning = true;
    console.log('Automation engine started');
    this.scheduleTimeBasedAutomations();
  }

  stop() {
    this.isRunning = false;
    console.log('Automation engine stopped');
  }

  private scheduleTimeBasedAutomations() {
    // Check every minute for time-based triggers
    setInterval(() => {
      if (!this.isRunning) return;

      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const currentDay = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getDay()];

      this.rules.forEach((rule) => {
        if (rule.trigger === 'time_based' && rule.enabled) {
          const condition = rule.condition;
          if (condition.time === currentTime) {
            if (!condition.days || condition.days.includes(currentDay)) {
              this.executeRule(rule);
            }
          }
        }
      });
    }, 60000); // Every minute
  }

  private async executeRule(rule: AutomationRule) {
    try {
      console.log(`Executing automation rule: ${rule.name}`);

      switch (rule.action) {
        case 'create_task':
          await this.createTask(rule.actionParams);
          break;
        case 'organize_file':
          await this.organizeFile(rule.actionParams);
          break;
        case 'run_command':
          await this.runCommand(rule.actionParams);
          break;
        default:
          console.warn(`Unknown action: ${rule.action}`);
      }
    } catch (error) {
      console.error(`Error executing rule ${rule.name}:`, error);
    }
  }

  private async createTask(params: any) {
    const task = {
      title: params.title,
      description: params.description || '',
      status: 'pending' as const,
      priority: params.priority || 'medium' as const,
      createdAt: Math.floor(Date.now() / 1000),
      predictedBy: 'ai' as const,
      tags: ['automated'],
    };

    await this.database.addTask(task);
    console.log(`Created automated task: ${task.title}`);
  }

  private async organizeFile(params: any) {
    // File organization logic
    console.log(`Organizing file: ${params.filePath}`);
  }

  private async runCommand(params: any) {
    try {
      await execAsync(params.command);
      console.log(`Executed command: ${params.command}`);
    } catch (error) {
      console.error(`Error running command:`, error);
    }
  }

  // Email draft generation
  async generateEmailDraft(context: {
    type: 'meeting_followup' | 'status_update' | 'request' | 'thank_you';
    recipient?: string;
    subject?: string;
    keyPoints?: string[];
  }): Promise<EmailTemplate> {
    const templates: Record<string, EmailTemplate> = {
      meeting_followup: {
        subject: context.subject || 'Following up on our meeting',
        body: `Hi ${context.recipient || '[Name]'},\n\nThank you for taking the time to meet with me today. Here are the key points we discussed:\n\n${(context.keyPoints || ['Point 1', 'Point 2', 'Point 3']).map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\nPlease let me know if you have any questions or if there's anything else I can help with.\n\nBest regards`,
        context: 'meeting_followup',
      },
      status_update: {
        subject: context.subject || 'Project Status Update',
        body: `Hi ${context.recipient || '[Name]'},\n\nHere's a quick update on the project status:\n\n✅ Completed:\n${(context.keyPoints?.slice(0, 2) || ['Task 1', 'Task 2']).map((p) => `• ${p}`).join('\n')}\n\n🚧 In Progress:\n${(context.keyPoints?.slice(2, 4) || ['Task 3']).map((p) => `• ${p}`).join('\n')}\n\nLet me know if you need any clarification.\n\nBest regards`,
        context: 'status_update',
      },
      request: {
        subject: context.subject || 'Request for Information',
        body: `Hi ${context.recipient || '[Name]'},\n\nI hope this email finds you well. I'm reaching out to request the following:\n\n${(context.keyPoints || ['Information needed']).map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\nI would appreciate your help with this. Please let me know if you need any additional context.\n\nThank you for your time.\n\nBest regards`,
        context: 'request',
      },
      thank_you: {
        subject: context.subject || 'Thank you',
        body: `Hi ${context.recipient || '[Name]'},\n\nI wanted to take a moment to thank you for ${context.keyPoints?.[0] || '[reason]'}. Your ${context.keyPoints?.[1] || 'help'} was greatly appreciated.\n\nLooking forward to working together again.\n\nBest regards`,
        context: 'thank_you',
      },
    };

    return templates[context.type] || templates.request;
  }

  // Meeting summary generation
  async generateMeetingSummary(meeting: {
    title: string;
    attendees: string[];
    duration: number;
    notes?: string;
  }): Promise<string> {
    const summary = `
# ${meeting.title}

**Attendees:** ${meeting.attendees.join(', ')}
**Duration:** ${Math.floor(meeting.duration / 60)} minutes
**Date:** ${new Date().toLocaleDateString()}

## Key Points
${meeting.notes ? meeting.notes.split('\n').map((line) => `- ${line}`).join('\n') : '- [Add key discussion points]'}

## Action Items
- [ ] [Add action items]

## Next Steps
- [Add next steps]

## Follow-up Date
- [Schedule follow-up meeting if needed]
    `.trim();

    return summary;
  }

  // Screenshot organization
  async organizeScreenshots(directory: string) {
    try {
      const files = await fs.readdir(directory);
      const screenshots = files.filter((file) => {
        const lower = file.toLowerCase();
        return (
          lower.includes('screenshot') ||
          lower.includes('screen shot') ||
          lower.startsWith('scr_')
        );
      });

      const screenshotsDir = path.join(directory, 'Screenshots');
      await fs.mkdir(screenshotsDir, { recursive: true });

      for (const screenshot of screenshots) {
        const oldPath = path.join(directory, screenshot);
        const newPath = path.join(screenshotsDir, screenshot);
        await fs.rename(oldPath, newPath);
      }

      return {
        organized: screenshots.length,
        destination: screenshotsDir,
      };
    } catch (error) {
      console.error('Error organizing screenshots:', error);
      return { organized: 0, destination: '' };
    }
  }

  // Desktop cleanup
  async cleanupDesktop(desktopPath: string) {
    try {
      const files = await fs.readdir(desktopPath);
      const oldDate = Date.now() - 30 * 24 * 60 * 60 * 1000; // 30 days ago

      const oldFiles: string[] = [];

      for (const file of files) {
        const filePath = path.join(desktopPath, file);
        const stats = await fs.stat(filePath);

        if (stats.isFile() && stats.mtimeMs < oldDate) {
          oldFiles.push(file);
        }
      }

      if (oldFiles.length > 0) {
        const archiveDir = path.join(desktopPath, 'Desktop Archive');
        await fs.mkdir(archiveDir, { recursive: true });

        for (const file of oldFiles) {
          const oldPath = path.join(desktopPath, file);
          const newPath = path.join(archiveDir, file);
          await fs.rename(oldPath, newPath);
        }
      }

      return {
        cleaned: oldFiles.length,
        archiveLocation: path.join(desktopPath, 'Desktop Archive'),
      };
    } catch (error) {
      console.error('Error cleaning desktop:', error);
      return { cleaned: 0, archiveLocation: '' };
    }
  }

  // Add custom automation rule
  async addRule(rule: Omit<AutomationRule, 'id'>) {
    this.rules.push({ ...rule, id: this.rules.length + 1 });
    console.log(`Added automation rule: ${rule.name}`);
    return rule;
  }

  // Get all rules
  getRules(): AutomationRule[] {
    return this.rules;
  }

  // Enable/disable rule
  toggleRule(ruleId: number, enabled: boolean) {
    const rule = this.rules.find((r) => r.id === ruleId);
    if (rule) {
      rule.enabled = enabled;
      console.log(`Rule ${rule.name} ${enabled ? 'enabled' : 'disabled'}`);
    }
  }
}
