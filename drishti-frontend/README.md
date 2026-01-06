# DrishtiX Frontend 🚀

> AI-Powered Event Intelligence Platform - Frontend Application  
> **Status:** ✅ Production Ready | **Last Updated:** January 2, 2026

**🎉 NEW: All components are now properly structured in `organizer/`, `attendee/`, and `shared/` folders!**

## 🚀 Overview

DrishtiX is a production-grade event management platform featuring AI-powered intelligence, real-time analytics, and comprehensive safety features. The frontend is built with React, TypeScript, and modern web technologies.

## ✨ Features

### For Attendees
- 🎟️ Event browsing and ticket management
- 🗺️ Indoor navigation and wayfinding
- 🆘 Emergency services and safety features
- 💬 Help and support system
- 📱 Mobile-responsive design

### For Organizers
- 📊 Real-time event dashboards
- 👥 Crowd intelligence and monitoring
- 🤖 AI-powered automation
- 🚨 Incident management and dispatch
- 📈 Advanced analytics and reporting

## 🏗️ Architecture

This application follows a **production-grade folder structure** with:
- ✅ React Router v7 for routing
- ✅ Role-based layouts (Attendee/Organizer)
- ✅ Lazy loading for performance
- ✅ TypeScript for type safety
- ✅ Tailwind CSS for styling

📖 **[View Full Architecture Documentation](ARCHITECTURE.md)**

## 📁 Project Structure

```
src/
├── components/              → React components (119 total)
│   ├── organizer/          → 40 organizer components
│   ├── attendee/           → 18 attendee components
│   ├── shared/             → 13 shared components
│   ├── ui/                 → 46 Shadcn UI components
│   └── index.ts            → Centralized exports
├── pages/                  → Route-level page components
│   ├── attendee/           → 6 attendee pages
│   ├── organizer/          → 11 organizer pages
│   └── common/             → 3 common pages
├── routes/                 → React Router configuration
├── layouts/                → Layout wrappers
├── services/               → API and business logic
├── hooks/                  → Custom React hooks
├── utils/                  → Helper functions
└── types/                  → TypeScript definitions
```

📖 **[View Detailed Structure Documentation](STRUCTURE_VISUAL.md)**  
🔧 **[Developer Quick Reference](DEVELOPER_GUIDE.md)**  
📋 **[Complete Restructure Report](FRONTEND_RESTRUCTURE_COMPLETE.md)**

📖 **[View Full Structure Documentation](STRUCTURE_DOCUMENTATION.md)**

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ or Bun
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/techySPHINX/DrishtiX.git
cd DrishtiX/drishti-frontend

# Install dependencies
pnpm install
# or
npm install
```

### Development

```bash
# Start development server
pnpm dev

# Access the application
# http://localhost:5173
```

### Building for Production

```bash
# Build the application
pnpm build

# Preview production build
pnpm preview
```

## 🎯 Quick Start Guide

### For Developers

1. **Start the dev server**: `pnpm dev`
2. **Open browser**: Navigate to `http://localhost:5173`
3. **Login**: Use demo credentials (demo@drishti.com / demo123)
4. **Explore**: Check both Attendee and Organizer portals

📖 **[View Quick Reference Guide](QUICK_REFERENCE.md)**

### For Contributors

1. **Read the migration guide**: [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)
2. **Understand the structure**: [STRUCTURE_DOCUMENTATION.md](STRUCTURE_DOCUMENTATION.md)
3. **Follow conventions**: Check existing code patterns
4. **Submit PRs**: Follow the contribution guidelines

## 🗺️ Routes

### Attendee Routes
```
/attendee/dashboard      → Main dashboard
/attendee/events         → Browse events
/attendee/navigation     → Indoor navigation
/attendee/tickets        → My tickets
/attendee/help           → Help & support
/attendee/emergency      → Emergency services
```

### Organizer Routes
```
/organizer/home                              → Event list
/organizer/event/:id/dashboard               → Event overview
/organizer/event/:id/command-center          → Command center
/organizer/event/:id/operations              → Operations
/organizer/event/:id/analytics               → Analytics
/organizer/event/:id/ai-command              → AI automation
/organizer/event/:id/crowd-intelligence      → Crowd monitoring
/organizer/event/:id/dispatch                → Dispatch
/organizer/event/:id/gate-control            → Gate control
/organizer/event/:id/automation              → Automation
/organizer/event/:id/post-event              → Post-event analysis
```

## 🛠️ Tech Stack

### Core
- **React 18.3** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router 7** - Routing

### UI/Styling
- **Tailwind CSS** - Utility-first CSS
- **Radix UI** - Accessible components
- **Lucide React** - Icons
- **Recharts** - Charts and graphs

### Maps & Location
- **Leaflet** - Interactive maps
- **React Leaflet** - React bindings for Leaflet

### State & Data
- **React Context** - State management
- **React Hook Form** - Form handling

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [STRUCTURE_DOCUMENTATION.md](STRUCTURE_DOCUMENTATION.md) | Complete folder structure and organization |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Visual architecture diagrams |
| [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) | How to migrate from old structure |
| [QUICK_REFERENCE.md](QUICK_REFERENCE.md) | Quick command and code reference |

## 🎨 Design System

- **Colors**: Slate-based dark theme with blue/violet accents
- **Typography**: System fonts with gradient text for branding
- **Spacing**: Tailwind's default spacing scale
- **Breakpoints**: Mobile-first responsive design

## 🔐 Authentication

The application supports two user types:
1. **Attendee**: Access to event browsing, navigation, tickets
2. **Organizer**: Full event management and analytics

**Demo Credentials**:
- Email: `demo@drishti.com`
- Password: `demo123`

## 🚀 Performance

- ⚡ Lazy loading for route components
- 🎯 Code splitting by role (Attendee/Organizer)
- 📦 Optimized bundle sizes
- 🖼️ Image optimization
- 💨 Fast refresh in development

## 🧪 Testing

```bash
# Run tests (if configured)
pnpm test

# Type checking
pnpm type-check

# Linting
pnpm lint
```

## 📦 Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm preview      # Preview production build
pnpm type-check   # Run TypeScript type checking
pnpm lint         # Run ESLint
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](../CONTRIBUTING.md).

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is part of DrishtiX and follows the main repository's license.

## 🙏 Acknowledgments

- Original design: [Figma Design](https://www.figma.com/design/Fwarx4Rws2l0gesgpiJm5i/)
- Built with modern React best practices
- Follows production-grade architecture patterns

## 📞 Support

- 📖 Documentation: See docs folder
- 🐛 Issues: [GitHub Issues](https://github.com/techySPHINX/DrishtiX/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/techySPHINX/DrishtiX/discussions)

---

**Version**: 2.0.0  
**Last Updated**: January 2, 2026  
**Maintained by**: DrishtiX Development Team
  