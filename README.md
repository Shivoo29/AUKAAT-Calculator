# 🚀 Aukaat Productivity OS

> **A local, privacy-first AI Personal Operating System that supercharges your productivity**

Aukaat is a revolutionary desktop application that monitors your workflow, predicts tasks, automates digital chores, organizes files, blocks distractions, and generates detailed productivity reports — all while keeping your data 100% private and local.

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)

## ✨ Features

### 🧠 AI Task Prediction
- Automatically predicts your next task based on activity patterns
- Suggests follow-up actions for incomplete work sessions
- Time-aware recommendations (morning planning, evening reviews)

### ⚡ Real-Time Activity Monitoring
- Tracks active applications and windows
- Categorizes work as productive or distracting
- Detects context switches and procrastination patterns

### 🎯 Focus Mode
- Blocks distracting apps and websites during work sessions
- Monitors for distraction attempts
- Calculates focus scores for each session
- Gentle reminders to stay on track

### 📁 Intelligent File Organization
- Auto-organizes downloads and desktop files
- Smart categorization by file type
- Customizable organization rules
- Project detection

### 📊 Detailed Analytics
- Daily, weekly, and monthly productivity reports
- Time tracking by application and category
- Focus session history with scores
- Task completion trends

### 🔒 Privacy-First Architecture
- **All data stays local** - nothing sent to cloud
- Encrypted local database
- Customizable data retention
- Granular privacy controls

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Desktop**: Electron 28
- **State Management**: Zustand
- **Database**: SQLite (better-sqlite3)
- **UI Components**: Lucide Icons, Framer Motion
- **Charts**: Recharts
- **Build**: Vite, electron-builder

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm/yarn
- Python 3.8+ (for activity monitoring backend)

### Development Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/aukaat-productivity-os.git
cd aukaat-productivity-os

# Install dependencies
npm install

# Run in development mode
npm run electron:dev
```

### Production Build

```bash
# Build for your platform
npm run electron:build

# Build for specific platform
npm run electron:build -- --mac
npm run electron:build -- --win
npm run electron:build -- --linux
```

## 🚀 Usage

### First Launch

1. **Grant Permissions**: On first launch, you'll need to grant accessibility permissions for activity monitoring
2. **Onboarding**: Complete the quick setup wizard
3. **Configure**: Customize your focus mode blocks and file organization rules

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘/Ctrl + K` | Open command palette |
| `⌘/Ctrl + Shift + Space` | Toggle command palette |
| `⌘/Ctrl + Shift + D` | Quick dashboard toggle |
| `⌘/Ctrl + 1-5` | Switch between views |

### Views

1. **Dashboard** - Overview of today's activity, AI task suggestions, recent tasks
2. **Tasks** - Full task management with AI predictions
3. **Focus Mode** - Start/stop focus sessions, view focus stats
4. **Analytics** - Detailed productivity analytics and reports
5. **Settings** - Customize app behavior, privacy, and integrations

## 🎨 Screenshots

```
Coming soon - screenshots of Dashboard, Focus Mode, and Analytics
```

## 🔧 Configuration

### Focus Mode Settings

Edit blocked apps and websites in Settings:

```typescript
// Example configuration
{
  blockedApps: ['Twitter', 'Facebook', 'Instagram'],
  blockedWebsites: ['twitter.com', 'facebook.com', 'reddit.com'],
  workHoursStart: '09:00',
  workHoursEnd: '17:00'
}
```

### File Organization Rules

Customize file organization in Settings:

```typescript
{
  '.pdf': 'Documents/PDFs',
  '.doc': 'Documents',
  '.jpg': 'Pictures',
  '.mp4': 'Videos'
}
```

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in UI mode
npm run test:ui
```

## 📈 Roadmap

### v0.2 - Enhanced Intelligence
- [ ] Local LLM integration for better task predictions
- [ ] Smart meeting detection and follow-up suggestions
- [ ] Email integration for task extraction

### v0.3 - Mobile Sync
- [ ] iOS/Android companion app
- [ ] P2P encrypted sync
- [ ] Quick task capture from mobile

### v0.4 - Team Features
- [ ] Team dashboard (opt-in)
- [ ] Shared automations
- [ ] Meeting productivity insights

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Guidelines

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Electron team for the amazing framework
- React and Vite communities
- All open-source contributors

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/aukaat-productivity-os/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/aukaat-productivity-os/discussions)
- **Email**: support@aukaat.app

## 🔐 Security

Found a security vulnerability? Please email security@aukaat.app instead of opening a public issue.

---

**Made with ❤️ by the Aukaat team**

*"Unlock your true productive potential"*
