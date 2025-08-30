# Travectio Project File Structure for GitHub Transfer

## 📁 Essential Files for Transfer

### Core Application
```
client/                          # React TypeScript frontend
├── src/
│   ├── components/             # Reusable UI components
│   ├── pages/                  # Application pages
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utilities and configurations
│   └── utils/                  # Helper functions

server/                          # Express.js backend
├── auth-service.ts             # Authentication logic
├── routes.ts                   # API endpoints
├── storage.ts                  # Database operations
├── dual-mode-service.ts        # Multi-tenant support
└── index.ts                    # Server entry point

shared/                          # Common types and schemas
├── schema.ts                   # Database schema (Drizzle)
└── types.ts                    # TypeScript interfaces
```

### Configuration Files
```
package.json                     # Dependencies and scripts
package-lock.json               # Dependency lock file
tsconfig.json                   # TypeScript configuration
vite.config.ts                  # Build tool configuration
tailwind.config.ts              # Styling configuration
postcss.config.js               # CSS processing
drizzle.config.ts               # Database configuration
components.json                 # UI components configuration
```

### Environment & Documentation
```
.env.example                    # Environment variable template
.gitignore                      # Git ignore rules
replit.md                       # Project documentation
TRANSFER_PREPARATION_GUIDE.md   # Complete setup guide
GITHUB_TRANSFER_README.md       # Quick start instructions
export_data.sql                 # Database backup script
```

## 🚫 Files to Exclude from Transfer

```
node_modules/                   # Dependencies (will be installed)
.git/                          # Git history (will be recreated)
.env                           # Environment variables (contains secrets)
dist/                          # Build output (will be generated)
.cache/                        # Replit cache files
.replit                        # Replit configuration
.upm/                          # Package manager cache
attached_assets/               # User uploaded files (optional)
```

## 📦 Transfer Package Contents

When you drag and drop files, include these essential items:

**Must Include:**
- All files in `client/`, `server/`, `shared/` directories
- `package.json` and `package-lock.json`
- All configuration files (*.config.*)
- `.env.example` (but NOT `.env`)
- `.gitignore`
- All documentation files (*.md)

**Result:** A complete, ready-to-deploy application that can be set up with:
1. `npm install`
2. Configure environment variables
3. `npm run db:push` 
4. `npm run dev`