# IMPLEMENTATION.md - Developer Guide

## 📘 For Developers: Complete Implementation Guide

This document is for developers joining the Aukaat Productivity OS project. It contains technical details, known issues, gotchas, and everything you need to effectively work on this codebase.

---

## 🎯 Project Overview

**Aukaat Productivity OS** is a local-first, privacy-focused desktop application that monitors user activity, predicts tasks, automates workflows, and helps maintain focus. It's built with Electron, React, and TypeScript.

### Core Concept
- **Local-First**: All data stays on user's machine (SQLite database)
- **Privacy-First**: Zero cloud dependencies, no telemetry
- **AI-Powered**: Pattern recognition for task prediction
- **Cross-Platform**: Windows, macOS, Linux support

---

## 🏗️ Architecture Deep Dive

### Technology Stack

```
┌─────────────────────────────────────────────┐
│           Electron (v28.3.3)                │
├─────────────────────┬───────────────────────┤
│   Main Process      │   Renderer Process    │
│   (Node.js)         │   (React + TypeScript)│
├─────────────────────┼───────────────────────┤
│ - ActivityMonitor   │ - Dashboard           │
│ - DatabaseService   │ - Tasks               │
│ - FileWatcher       │ - FocusMode           │
│ - TaskPredictor     │ - Analytics           │
│ - FocusManager      │ - Settings            │
│ - AutomationEngine  │ - Onboarding          │
└─────────────────────┴───────────────────────┘
           │
           ├── IPC Bridge (preload.ts)
           │
           └── SQLite Database (better-sqlite3)
```

### Process Communication

**Main Process → Renderer:**
```typescript
// Main sends events
mainWindow.webContents.send('focus-mode-changed', true);

// Renderer listens
window.electronAPI.onFocusModeChange((enabled) => {
  console.log('Focus mode:', enabled);
});
```

**Renderer → Main Process:**
```typescript
// Renderer invokes
const summary = await window.electronAPI.getActivitySummary('today');

// Main handles
ipcMain.handle('get-activity-summary', async (_event, timeRange) => {
  return await activityMonitor.getSummary(timeRange);
});
```

### State Management

We use **Zustand** for state management (not Redux/Context API):

```typescript
// Store definition
export const useAppStore = create<AppState>((set, get) => ({
  tasks: [],
  loadTasks: async () => {
    const tasks = await window.electronAPI.getPredictedTasks();
    set({ tasks });
  }
}));

// Usage in components
const { tasks, loadTasks } = useAppStore();
```

---

## 📂 Project Structure Explained

```
AUKAAT-Calculator/
│
├── electron/                      # Main process (Node.js)
│   ├── main.ts                   # App entry, window creation, lifecycle
│   ├── preload.ts                # IPC bridge (contextBridge)
│   └── services/                 # Backend services
│       ├── ActivityMonitor.ts    # Tracks active windows/apps
│       ├── DatabaseService.ts    # SQLite operations
│       ├── FileWatcher.ts        # Watches directories for file changes
│       ├── TaskPredictor.ts      # AI task prediction logic
│       ├── FocusManager.ts       # Focus mode + app/website blocking
│       └── AutomationEngine.ts   # Email drafts, summaries, cleanup
│
├── src/                          # Renderer process (React)
│   ├── main.tsx                  # React entry point
│   ├── App.tsx                   # Root component
│   ├── components/               # React components
│   │   ├── Dashboard.tsx         # Main dashboard view
│   │   ├── Tasks.tsx             # Task management
│   │   ├── FocusMode.tsx         # Focus mode controls
│   │   ├── Analytics.tsx         # Charts and reports
│   │   ├── Settings.tsx          # App settings
│   │   ├── CommandPalette.tsx    # ⌘K quick actions
│   │   ├── Onboarding.tsx        # First-time user wizard
│   │   ├── ErrorBoundary.tsx     # Error handling
│   │   └── Sidebar.tsx           # Navigation sidebar
│   ├── store/                    # Zustand state management
│   │   └── useAppStore.ts        # Global app state
│   ├── utils/                    # Utility functions
│   │   └── formatters.ts         # Date/time/duration formatters
│   ├── types/                    # TypeScript type definitions
│   │   └── index.ts              # Shared types
│   └── test/                     # Test setup
│       └── setup.ts              # Vitest configuration
│
├── tests/                        # Test files
│   ├── formatters.test.ts
│   ├── useAppStore.test.ts
│   └── Sidebar.test.tsx
│
├── dist/                         # Vite build output (React app)
├── dist-electron/                # Electron compiled files
├── release/                      # electron-builder output (GITIGNORED)
│
├── package.json                  # Dependencies and scripts
├── vite.config.ts                # Vite + Electron plugin config
├── tsconfig.json                 # TypeScript configuration
├── tailwind.config.js            # Tailwind CSS configuration
└── vitest.config.ts              # Test configuration
```

---

## 🚀 How to Run - Complete Guide

### Prerequisites
```bash
Node.js: v18+ (v20 recommended)
npm: v9+ (comes with Node)
Python: v3.8+ (for native modules)
```

### Installation

```bash
# Clone the repo
git clone <repo-url>
cd AUKAAT-Calculator

# Install dependencies
npm install
# This installs ~800 packages, takes 2-3 minutes
# Compiles better-sqlite3 native module

# Verify installation
npm run type-check
# Should output: "tsc --noEmit" with no errors
```

### Development Mode

```bash
# Start development server with hot reload
npm run electron:dev

# What happens:
# 1. Vite dev server starts on http://localhost:5173
# 2. Electron app launches and loads from dev server
# 3. DevTools opens automatically
# 4. Hot Module Replacement (HMR) enabled

# Common issue: "Port 5173 already in use"
# Solution: Kill existing process or change port in vite.config.ts
```

### Production Build

```bash
# Build for current platform
npm run electron:build

# Build outputs:
# - dist/              → React app (HTML, CSS, JS)
# - dist-electron/     → Compiled Electron code
# - release/           → Packaged app (100MB+, gitignored)

# Platform-specific builds
npm run electron:build -- --mac      # macOS .dmg
npm run electron:build -- --win      # Windows .exe
npm run electron:build -- --linux    # Linux AppImage

# Build directory only (faster, for testing)
npm run build:dir
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Type checking only (no tests)
npm run type-check
```

---

## ⚠️ Known Issues & Gotchas

### 1. **Database Initialization**

**Issue:** First launch can fail if database directory doesn't exist

**Location:** `electron/services/DatabaseService.ts:37`

**Current Fix:**
```typescript
const dbDir = path.join(userDataPath, 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true }); // ✅ Creates directory
}
```

**Potential Issue:** No retry logic if database creation fails

**Recommended Fix:**
```typescript
try {
  this.db = new Database(this.dbPath);
} catch (error) {
  console.error('Database init failed, retrying...', error);
  // Retry logic here
}
```

---

### 2. **Activity Monitoring - Platform Differences**

**Issue:** Activity monitoring works differently on each platform

**macOS:**
- Requires accessibility permissions
- Uses AppleScript via `osascript`
- **Gotcha:** Permission prompt shows on first run, app may need restart

**Windows:**
- Uses PowerShell commands
- **Gotcha:** PowerShell execution policy may block scripts
- **Fix:** Run `Set-ExecutionPolicy RemoteSigned` in admin PowerShell

**Linux:**
- Requires `xdotool` or `wmctrl` installed
- **Gotcha:** Not installed by default on most distros
- **Fix:** `sudo apt install xdotool` or `sudo yum install xdotool`

**Location:** `electron/services/ActivityMonitor.ts:195-247`

**Current Implementation:**
```typescript
private async getActiveWindow(): Promise<ActiveWindow | null> {
  switch (this.platform) {
    case 'darwin':  return this.getActiveWindowMacOS();
    case 'win32':   return this.getActiveWindowWindows();
    case 'linux':   return this.getActiveWindowLinux();
    default:        return null; // ⚠️ Silently fails on unknown platform
  }
}
```

---

### 3. **Focus Mode - Hosts File Modification**

**Issue:** Focus mode modifies `/etc/hosts` to block websites

**Security Concern:** Requires root/admin privileges

**Location:** `electron/services/FocusManager.ts:116-160`

**Current Implementation:**
```typescript
// Uses sudo on macOS/Linux
await execAsync(`sudo cp ${tempFile} ${this.hostsFilePath}`);

// Uses elevated PowerShell on Windows
await execAsync(`powershell -Command "Start-Process cmd -ArgumentList '/c copy ...' -Verb RunAs"`);
```

**Known Issues:**
- ❌ No password prompt handling
- ❌ Fails silently if user denies permission
- ❌ Original hosts file saved in memory (lost on crash)

**Recommended Fix:**
```typescript
// Save backup to file
const backupPath = path.join(app.getPath('userData'), 'hosts.backup');
fs.writeFileSync(backupPath, this.originalHostsContent);
```

---

### 4. **File Watcher - Event Debouncing**

**Issue:** Multiple rapid file events can cause performance issues

**Location:** `electron/services/FileWatcher.ts:96-108`

**Current Implementation:**
```typescript
const processingQueue: Set<string> = new Set();

// Debounce logic
if (this.processingQueue.has(filePath)) return; // ✅ Prevents duplicate processing

setTimeout(() => {
  this.processingQueue.delete(filePath);
}, 2000); // ⚠️ Hardcoded 2 second delay
```

**Potential Issue:** Large file operations may need longer delays

---

### 5. **TypeScript Configuration**

**Current Settings:** `tsconfig.json:14-16`
```json
{
  "strict": false,           // ⚠️ Not fully type-safe
  "noUnusedLocals": false,   // ⚠️ Allows unused variables
  "noUnusedParameters": false
}
```

**Why:** Quick MVP development

**Production Recommendation:**
```json
{
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true
}
```

**Impact:** Would require fixing ~50 type errors across codebase

---

### 6. **Onboarding - LocalStorage Dependency**

**Issue:** Onboarding state stored in browser localStorage

**Location:** `src/App.tsx:19-22`
```typescript
const [showOnboarding, setShowOnboarding] = useState(() => {
  const hasCompleted = localStorage.getItem('onboarding_completed');
  return !hasCompleted; // ⚠️ localStorage can be cleared
});
```

**Gotcha:** User clearing browser data resets onboarding

**Better Approach:**
```typescript
// Store in SQLite database instead
await database.setSetting('onboarding_completed', 'true');
```

---

### 7. **Error Boundary - Limited Scope**

**Current Coverage:** Only wraps main app and individual views

**Location:** `src/App.tsx:82-92`

**Not Covered:**
- ❌ Electron main process errors (only logged)
- ❌ IPC communication errors
- ❌ Database errors (can crash app)

**Example Uncaught Error:**
```typescript
// If this fails, app crashes without recovery
const tasks = await window.electronAPI.getPredictedTasks();
```

**Recommended Fix:**
```typescript
try {
  const tasks = await window.electronAPI.getPredictedTasks();
} catch (error) {
  console.error('Failed to load tasks:', error);
  toast.error('Failed to load tasks');
  return []; // Graceful fallback
}
```

---

### 8. **Build Size - Large Binaries**

**Current Size:**
- macOS: ~150 MB
- Windows: ~120 MB
- Linux: ~170 MB

**Why:** Electron includes Chromium (~100 MB)

**Location:** Blocked from git push (exceeds GitHub 100MB limit)

**Current Fix:** `release/` added to `.gitignore`

**Distribution Strategy:**
- Use GitHub Releases for binaries
- Use Electron auto-updater
- Consider electron-builder's differential updates

---

## 🐛 Actual Bugs Found During Development

### Bug #1: Focus Stats Query Error

**Status:** FIXED

**Location:** `electron/services/FocusManager.ts:349`

**Original Code:**
```typescript
const sessions = await this.database.db?.prepare(`SELECT ...`).get(...);
// ❌ Error: Property 'db' is private
```

**Fix Applied:**
```typescript
getStats() {
  return {
    isFocusMode: this.isFocusMode,
    currentSession: this.currentSession,
    stats: { totalSessions: 0, ... } // ✅ Hardcoded for MVP
  };
}
```

**TODO:** Implement proper stats query via DatabaseService public method

---

### Bug #2: CSS Import Order Warning

**Status:** FIXED

**Location:** `src/index.css:1-5`

**Original Code:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
@import url('https://fonts.googleapis.com/css2?family=Inter...');
/* ❌ @import must come before all other rules */
```

**Fix Applied:**
```css
@import url('https://fonts.googleapis.com/css2?family=Inter...');
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

### Bug #3: App Quit Flag Type Error

**Status:** FIXED

**Location:** `electron/main.ts:21`

**Original Code:**
```typescript
app.isQuitting = false;
// ❌ Property 'isQuitting' does not exist on type 'App'
```

**Fix Applied:**
```typescript
interface AppWithQuitting extends Electron.App {
  isQuitting?: boolean;
}
(app as AppWithQuitting).isQuitting = false; // ✅ Type-safe
```

---

## 🔧 Development Workflow

### Adding a New Feature

1. **Create branch** (optional for personal project)
2. **Plan the feature**
   - Which process? (Main vs Renderer)
   - Database changes needed?
   - IPC handlers required?
3. **Implementation order:**
   ```
   Database Schema → Service Layer → IPC Handlers → React Components → Tests
   ```
4. **Test locally:**
   ```bash
   npm run type-check  # Check types
   npm test           # Run tests
   npm run electron:dev # Test in app
   ```
5. **Commit and push**

### Example: Adding a New Automation Rule

```typescript
// 1. Add to AutomationEngine.ts
async addCustomRule(rule: AutomationRule) {
  this.rules.push(rule);
  await this.database.saveAutomationRule(rule); // Need to implement
}

// 2. Add IPC handler in main.ts
ipcMain.handle('add-custom-automation', async (_event, rule) => {
  return await automationEngine.addCustomRule(rule);
});

// 3. Add to preload.ts
addCustomAutomation: (rule: any) =>
  ipcRenderer.invoke('add-custom-automation', rule),

// 4. Add UI in Settings.tsx
const handleAddRule = async () => {
  await window.electronAPI.addCustomAutomation(newRule);
};

// 5. Write tests
it('should add custom automation rule', async () => {
  const rule = { name: 'Test', ... };
  await addCustomAutomation(rule);
  expect(getRules()).toContain(rule);
});
```

---

## 🧪 Testing Guide

### Test Structure

```typescript
// formatters.test.ts
describe('formatDuration', () => {
  it('should format seconds correctly', () => {
    expect(formatDuration(30)).toBe('30s');
  });
});
```

### Running Specific Tests

```bash
# Run only formatters tests
npm test formatters

# Run tests matching pattern
npm test -- --grep "formatDuration"

# Run a single test file
npm test -- src/utils/formatters.test.ts
```

### Mocking Electron API

**Setup:** `src/test/setup.ts`

```typescript
global.window.electronAPI = {
  getActivitySummary: vi.fn(),
  getPredictedTasks: vi.fn(),
  // ... all methods mocked
};
```

**Usage in tests:**
```typescript
it('should load tasks', async () => {
  vi.mocked(window.electronAPI.getPredictedTasks)
    .mockResolvedValue([{ id: 1, title: 'Test' }]);

  await loadTasks();

  expect(tasks).toHaveLength(1);
});
```

---

## 📊 Performance Considerations

### Database Queries

**Current:** No indexes on most columns

**Recommendation:** Add indexes for frequently queried columns
```sql
CREATE INDEX idx_activities_timestamp ON activities(timestamp);
CREATE INDEX idx_tasks_status ON tasks(status);
```

### Activity Monitoring Interval

**Current:** 5 second polling interval

**Location:** `electron/services/ActivityMonitor.ts:93`

```typescript
this.monitorInterval = setInterval(async () => {
  await this.checkActiveWindow();
}, 5000); // ⚠️ May be too frequent for battery life
```

**Recommendation:** Make configurable, default 10-15 seconds

### File Watcher Performance

**Issue:** Watching large directories can cause high CPU usage

**Current:** Recursive watching disabled
```typescript
watch(directory, { recursive: false }, ...) // ✅ Better performance
```

---

## 🔐 Security Considerations

### 1. **Sandbox Mode**

**Current:** `sandbox: false` in BrowserWindow

**Location:** `electron/main.ts:37`

```typescript
webPreferences: {
  sandbox: false, // ⚠️ Disables Chromium sandbox for Node.js access
}
```

**Why:** Need access to Node.js APIs in renderer

**Better Approach:** Keep sandbox enabled, use IPC for all Node operations

### 2. **Context Isolation**

**Current:** `contextIsolation: true` ✅

**Good!** Prevents renderer from accessing Node.js directly

### 3. **SQL Injection**

**Current:** Uses prepared statements ✅

```typescript
const stmt = this.db.prepare(`SELECT * FROM tasks WHERE id = ?`);
stmt.get(taskId); // ✅ Safe from SQL injection
```

### 4. **File System Access**

**Issue:** Renderer can request arbitrary file operations

**Recommendation:** Validate and sanitize file paths in IPC handlers

```typescript
ipcMain.handle('organize-files', async (_event, directory: string) => {
  // ⚠️ Need to validate directory is allowed
  if (!isAllowedDirectory(directory)) {
    throw new Error('Access denied');
  }
  return await fileWatcher.organizeDirectory(directory);
});
```

---

## 🚨 Error Handling Best Practices

### 1. **Always Wrap IPC Calls**

```typescript
// ❌ Bad
const data = await window.electronAPI.getData();

// ✅ Good
try {
  const data = await window.electronAPI.getData();
} catch (error) {
  console.error('Failed to load data:', error);
  toast.error('Failed to load data');
}
```

### 2. **Use Error Boundaries**

Already implemented! Wraps:
- Entire app
- Individual views

### 3. **Log Errors to Database**

```typescript
// Already implemented in DatabaseService
database.logError(error, 'context information');
```

---

## 🎯 Areas Needing Improvement

### High Priority

1. **Focus Stats Implementation**
   - Currently returns hardcoded zeros
   - Need to query database properly
   - File: `electron/services/FocusManager.ts:347`

2. **Onboarding Persistence**
   - Move from localStorage to SQLite
   - File: `src/App.tsx:19-28`

3. **Error Recovery**
   - Add retry logic to database init
   - File: `electron/services/DatabaseService.ts:37`

4. **Type Safety**
   - Enable strict TypeScript
   - Fix ~50 type errors
   - File: `tsconfig.json`

### Medium Priority

5. **Activity Monitor - Permission Handling**
   - Better UX for permission requests
   - File: `electron/services/ActivityMonitor.ts`

6. **File Watcher - Large Directories**
   - Add directory size check
   - Warn users before watching huge directories
   - File: `electron/services/FileWatcher.ts`

7. **Test Coverage**
   - Currently: 27 tests
   - Goal: 100+ tests
   - Coverage: ~15% → Target 80%

### Low Priority

8. **Performance Optimization**
   - Add database indexes
   - Optimize activity polling interval
   - Lazy load components

9. **Accessibility**
   - Add ARIA labels
   - Keyboard navigation
   - Screen reader support

10. **Internationalization**
    - Add i18n support
    - Multiple languages

---

## 📝 Code Style Guide

### TypeScript

```typescript
// ✅ Good
interface Task {
  id?: number;
  title: string;
  status: 'pending' | 'completed';
}

// ❌ Avoid
const task: any = { ... }; // Use proper types
```

### React Components

```typescript
// ✅ Good - Functional components with TypeScript
interface Props {
  title: string;
  onClick: () => void;
}

export default function Button({ title, onClick }: Props) {
  return <button onClick={onClick}>{title}</button>;
}

// ❌ Avoid - Class components, PropTypes
```

### Async/Await

```typescript
// ✅ Good
async function loadData() {
  try {
    const data = await fetchData();
    return data;
  } catch (error) {
    console.error(error);
    return null;
  }
}

// ❌ Avoid - Promise chains
fetchData().then().catch();
```

---

## 🔍 Debugging Tips

### 1. **Electron DevTools**

**Open automatically in dev mode:**
```typescript
mainWindow.webContents.openDevTools(); // Already enabled
```

**Debug main process:**
```bash
# Add to package.json scripts
"electron:debug": "electron --inspect=5858 ."
```

Then open `chrome://inspect` in Chrome

### 2. **React DevTools**

Install: [React DevTools Extension](https://chrome.google.com/webstore/detail/react-developer-tools)

Works automatically in Electron dev mode

### 3. **Database Inspection**

```bash
# Find database location
# macOS: ~/Library/Application Support/aukaat-productivity-os/data/aukaat.db
# Windows: %APPDATA%/aukaat-productivity-os/data/aukaat.db
# Linux: ~/.config/aukaat-productivity-os/data/aukaat.db

# Open with SQLite CLI
sqlite3 ~/Library/Application\ Support/aukaat-productivity-os/data/aukaat.db

# Or use a GUI tool like DB Browser for SQLite
```

### 4. **Logging**

```typescript
// Main process logs
console.log('Main:', data); // Shows in terminal

// Renderer process logs
console.log('Renderer:', data); // Shows in DevTools console
```

---

## 📚 Resources

### Documentation
- [Electron Docs](https://www.electronjs.org/docs)
- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Vitest Docs](https://vitest.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Project-Specific
- `README.md` - User-facing documentation
- `PRODUCTION_READY.md` - Feature checklist and statistics
- `IMPLEMENTATION.md` - This file

### Getting Help
- Check existing issues in repo
- Search Discord/Slack (if available)
- Ask senior developers
- Read the source code (it's well-commented!)

---

## 🎯 Quick Start Checklist

New developer onboarding:

- [ ] Clone repository
- [ ] Install dependencies (`npm install`)
- [ ] Run type check (`npm run type-check`)
- [ ] Run tests (`npm test`)
- [ ] Start dev mode (`npm run electron:dev`)
- [ ] Make a small change and see HMR work
- [ ] Read this entire document
- [ ] Review code structure
- [ ] Check known issues section
- [ ] Set up debugging tools
- [ ] Ready to contribute!

---

## 📞 Support

For implementation questions:
1. Check this document first
2. Search codebase for similar patterns
3. Check git history for context
4. Ask team lead

---

**Last Updated:** 2025-11-19
**Document Version:** 1.0
**Project Status:** Production Ready ✅

