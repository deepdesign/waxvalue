# Waxvalue Project Structure

## 📁 Directory Organization

```
waxvalue/
│
├── 📄 README.md                    # Main project README
├── 📄 package.json                 # Node.js dependencies
├── 📄 next.config.js               # Next.js configuration
├── 📄 tsconfig.json                # TypeScript configuration
├── 📄 tailwind.config.js           # Tailwind CSS configuration
│
├── 📂 src/                         # Frontend source code
│   ├── app/                        # Next.js 15 App Router
│   │   ├── page.tsx                # Home page (landing)
│   │   ├── layout.tsx              # Root layout
│   │   ├── globals.css             # Global styles
│   │   ├── dashboard/              # Dashboard page
│   │   ├── settings/               # Settings page
│   │   ├── help/                   # Help page
│   │   ├── automation/             # Automation page
│   │   ├── auth/                   # Auth callback page
│   │   ├── landing-preview/        # Landing page gallery
│   │   ├── loading-facts-preview/  # Loading designs preview
│   │   └── api/backend/            # API routes (21 routes)
│   │
│   ├── components/                 # React components
│   │   ├── InventoryReviewTable.tsx    # Main data table
│   │   ├── DashboardLayout.tsx         # Dashboard shell
│   │   ├── FiltersBar.tsx              # Filter controls
│   │   ├── VinylFactsCard.tsx          # Loading facts display
│   │   ├── landing-alternatives/       # Landing page variants
│   │   ├── loading-facts/              # Loading UI designs
│   │   └── ui/                         # Reusable UI components
│   │
│   ├── contexts/                   # React Context providers
│   │   └── InventoryContext.tsx    # Global inventory state
│   │
│   ├── lib/                        # Utility functions
│   │   ├── api-config.ts           # Backend URL builder
│   │   ├── apiClient.ts            # API client
│   │   ├── userSettings.ts         # Settings persistence
│   │   ├── automationRules.ts      # Automation persistence
│   │   └── filterSettings.ts       # Filter persistence
│   │
│   └── types/                      # TypeScript definitions
│       └── index.ts                # Shared types
│
├── 📂 backend/                     # Python FastAPI backend
│   ├── main.py                     # Production server
│   ├── main-dev.py                 # Development server
│   ├── discogs_client.py           # Discogs API wrapper
│   ├── session_manager.py          # Session management
│   ├── security.py                 # Security utilities
│   ├── requirements.txt            # Python dependencies
│   └── models/                     # Data models
│
├── 📂 public/                      # Static assets
│   ├── images/                     # Landing page images
│   ├── svg/                        # Logo files (light/dark)
│   └── *.png                       # Favicons
│
├── 📂 docs/                        # Documentation
│   ├── README.md                   # Documentation index
│   ├── INDEX.md                    # Complete file index
│   ├── API.md                      # API reference
│   ├── ENV_TEMPLATE.md             # Environment variables
│   │
│   ├── deployment/                 # Deployment guides
│   │   ├── HOSTINGER_VPS_DEPLOYMENT.md  # Primary deployment guide
│   │   ├── DEPLOY_INSTRUCTIONS.md       # Step-by-step instructions
│   │   ├── DEPLOYMENT_CHECKLIST.md      # Pre-flight checks
│   │   └── PRE_DEPLOYMENT_TEST_REPORT.md # Test results
│   │
│   ├── development/                # Development guides
│   │   ├── DEVELOPMENT_GUIDELINES.md
│   │   └── TESTING_GUIDE.md
│   │
│   └── security/                   # Security documentation
│       └── SECURITY_CHECKLIST.md
│
├── 📂 config/                      # Configuration files
│   ├── production.env.backend      # Backend production env
│   ├── production.env.frontend     # Frontend production env
│   └── systemd/                    # Systemd service files
│
├── 📂 deployment-scripts/          # Deployment automation
│   ├── README.md                   # Scripts documentation
│   ├── deploy-final.sh             # Main deployment script
│   ├── CLEANUP_VPS_NOW.sh          # VPS cleanup
│   └── upload-and-deploy.ps1       # Windows deployment
│
└── 📂 scripts/                     # Development scripts
    ├── start-dev.ps1               # Start local dev servers
    ├── check-compliance.js         # API compliance check
    └── update-api-routes.js        # Update API URLs
```

---

## 🎯 Key Directories Explained

### `src/app/` - Next.js Application
- Uses Next.js 15 App Router
- Each folder with `page.tsx` is a route
- `api/` folder contains API route handlers
- Server-side rendering and static generation

### `src/components/` - React Components
- Organized by feature and domain
- `landing-alternatives/` - Different landing page designs
- `loading-facts/` - Loading screen variants  
- `ui/` - Reusable UI components (buttons, tooltips, etc.)

### `backend/` - FastAPI Server
- `main.py` - Production server (uses uvicorn)
- `main-dev.py` - Development server with hot reload
- `discogs_client.py` - Wrapper for Discogs API
- `session_manager.py` - File-based session storage

### `docs/` - Documentation
- Organized by topic (deployment, development, security)
- All markdown files for easy browsing
- `INDEX.md` provides complete file listing

### `config/` - Production Configuration
- Environment variable templates
- System service definitions
- Production-ready configurations

### `deployment-scripts/` - Deployment Automation
- All scripts needed to deploy to VPS
- Both automated and manual options
- VPS cleanup and verification tools

---

## 🚫 Excluded from Git

The following are excluded via `.gitignore`:
- `node_modules/` - Node.js dependencies
- `.next/` - Next.js build output
- `backend/venv/` - Python virtual environment
- `*.env` files - Environment variables (secrets)
- `sessions.json` - Runtime session data
- `*.zip` - Backup archives
- `*BACKUP*/` - Backup folders

---

## 🔧 Configuration Files

### Root Level
- `next.config.js` - Next.js configuration
- `tsconfig.json` - TypeScript compiler options
- `tailwind.config.js` - Tailwind CSS theme
- `postcss.config.js` - PostCSS plugins
- `package.json` - Node.js project definition

### Backend Level
- `backend/requirements.txt` - Python dependencies
- `backend/.env` - Backend environment (gitignored)

---

## 📦 Build Artifacts

### Generated at Build Time
- `.next/` - Next.js optimized build
- `backend/__pycache__/` - Python bytecode
- `tsconfig.tsbuildinfo` - TypeScript incremental build cache

### Generated at Runtime
- `backend/sessions.json` - User sessions
- `backend/discogs_rate_limit.json` - Rate limit tracker

---

## 🔄 Best Practices Followed

1. **Separation of Concerns**
   - Frontend in `src/`
   - Backend in `backend/`
   - Docs in `docs/`
   - Scripts in `scripts/` and `deployment-scripts/`

2. **Environment Variables**
   - Never committed to git
   - Templates provided in `config/`
   - Separate for dev and production

3. **Documentation**
   - Well-organized in `docs/` hierarchy
   - README files in each major directory
   - Complete index files

4. **Deployment**
   - All deployment files in dedicated folders
   - Automated scripts provided
   - Manual fallback options

5. **Code Organization**
   - TypeScript for type safety
   - Components by feature
   - Shared utilities in `lib/`
   - Centralized types in `types/`

---

Last updated: 12 October 2025  
Version: 1.0.0 - Production Ready

