# Travectio Fleet Management - Tech Stack Documentation

**Project:** Enterprise Fleet Management Platform  
**Last Updated:** August 9, 2025  
**Version:** 1.0.0 (Production Ready)  

---

## 🏗️ Core Runtime Environment

### **Node.js Runtime**
- **Version:** Node.js 20.19.3 (LTS)
- **Package Manager:** npm 10.8.2
- **Module System:** ES Modules (`"type": "module"`)
- **Process Manager:** PM2 compatible (production)

### **TypeScript Configuration**
- **Version:** TypeScript 5.6.3
- **Target:** ESNext with modern browser support
- **Strict Mode:** Enabled for type safety
- **Module Resolution:** Bundler (modern)
- **JSX:** Preserve (handled by Vite/React)

**Key TypeScript Settings:**
```json
{
  "compilerOptions": {
    "module": "ESNext",
    "strict": true,
    "lib": ["esnext", "dom", "dom.iterable"],
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "skipLibCheck": true
  }
}
```

---

## 🖥️ Frontend Technology Stack

### **React Ecosystem**
- **React:** 18.3.1 (Latest stable with concurrent features)
- **React DOM:** 18.3.1
- **Build Tool:** Vite 5.4.19 (Fast development and optimized builds)
- **Development Server:** Vite Dev Server with HMR

### **Routing & Navigation**
- **Router:** Wouter 3.3.5 (Lightweight, <2KB)
- **Navigation Pattern:** SPA with client-side routing
- **Route Protection:** Custom authentication guards

### **UI Framework & Styling**
- **Component Library:** Radix UI (Headless, accessible primitives)
- **Styling:** Tailwind CSS 3.4.17 with custom design system
- **Theme System:** next-themes 0.4.6 (Dark/light mode)
- **Icons:** Lucide React 0.453.0 + React Icons 5.4.0
- **Animations:** Framer Motion 11.13.1 + Tailwind Animate

**Radix UI Components Used:**
```
- Accordion, Alert Dialog, Avatar, Checkbox
- Context Menu, Dialog, Dropdown Menu, Form Controls
- Navigation Menu, Popover, Progress, Radio Group
- Scroll Area, Select, Slider, Switch, Tabs
- Toast Notifications, Toggle, Tooltip
```

### **State Management**
- **Server State:** TanStack React Query 5.60.5
- **Client State:** React's built-in state (useState, useContext)
- **Form State:** React Hook Form 7.55.0 with Zod validation
- **Cache Management:** React Query with intelligent invalidation

### **Data Visualization**
- **Charts:** Recharts 2.15.2 (React-based charting)
- **Analytics:** Custom dashboard components
- **Responsive Design:** Mobile-first with breakpoint system

---

## 🔧 Backend Technology Stack

### **Web Framework**
- **Server:** Express.js 4.21.2
- **Session Management:** express-session 1.18.2
- **Session Store:** connect-pg-simple 10.0.0 (PostgreSQL)
- **Memory Store:** memorystore 1.6.7 (development fallback)

### **Authentication & Security**
- **Authentication:** OpenID Connect 6.6.2 (Replit integration)
- **Passport:** passport 0.7.0 + passport-local 1.0.0
- **Session Security:** Secure cookies, CSRF protection
- **CORS:** Built-in Express CORS handling

### **API & Validation**
- **API Pattern:** RESTful JSON APIs
- **Validation:** Zod 3.24.2 (Runtime type validation)
- **Error Handling:** zod-validation-error 3.4.0
- **Response Format:** Consistent JSON with error codes

### **Real-time Features**
- **WebSockets:** ws 8.18.0 (Future live updates)
- **Event Handling:** Custom event system
- **Cross-tab Sync:** DataSynchronizationManager

---

## 🗄️ Database & Data Management

### **Database System**
- **Primary Database:** PostgreSQL (Supabase managed)
- **ORM:** Drizzle ORM 0.39.1 (Type-safe, lightweight)
- **Schema Management:** drizzle-kit 0.30.4
- **Connection:** @neondatabase/serverless 0.10.4
- **Migrations:** Schema-first approach with db:push

### **Database Architecture**
- **Schema Definition:** TypeScript-first with Drizzle
- **Validation:** drizzle-zod 0.7.0 integration
- **Connection Pooling:** Built-in via Supabase
- **Backup Strategy:** Automated daily backups

**Key Database Features:**
```sql
Tables: 21 production tables
Users, Trucks, Drivers, Loads, HOS Logs
Fuel Purchases, Fleet Metrics, Analytics
Session Management, Audit Logging
Multi-tenant data isolation
```

---

## 🛠️ Development Tools & Build System

### **Build System**
- **Frontend Build:** Vite 5.4.19 with React plugin
- **Backend Build:** ESBuild 0.25.0 (Fast bundling)
- **Development:** tsx 4.19.1 (TypeScript execution)
- **Type Checking:** tsc (TypeScript compiler)

### **Development Workflow**
```bash
# Development Commands
npm run dev          # Start dev server (frontend + backend)
npm run build        # Production build
npm run start        # Production server
npm run check        # Type checking
npm run db:push      # Database schema deployment
```

### **Code Quality & Formatting**
- **Linting:** Built-in TypeScript strict mode
- **Type Safety:** Comprehensive TypeScript coverage
- **Import Resolution:** Path aliases (@, @shared)
- **Module System:** ES Modules throughout

### **Replit Integration Tools**
- **Development:** @replit/vite-plugin-cartographer 0.2.7
- **Error Handling:** @replit/vite-plugin-runtime-error-modal 0.0.3
- **Hot Reload:** Vite HMR with Replit integration

---

## 📦 Specialized Libraries & Features

### **AI & Integration**
- **OpenAI Integration:** openai 5.12.1 (GPT-4o support)
- **Load Board APIs:** DAT, Truckstop, 123Loadboard ready
- **ELD Integration:** Samsara, Motive, Geotab support
- **Fleet Analytics:** Custom algorithms for cost analysis

### **Utility Libraries**
- **Date Handling:** date-fns 3.6.0 (Modern, tree-shakable)
- **Unique IDs:** nanoid 5.1.5 (URL-safe unique identifiers)
- **Memoization:** memoizee 0.4.17 (Performance optimization)
- **Class Names:** clsx 2.1.1 + tailwind-merge 2.6.0

### **Form & Input Handling**
- **Form Validation:** @hookform/resolvers 3.10.0
- **OTP Input:** input-otp 1.4.2 (Security codes)
- **Date Picker:** react-day-picker 8.10.1
- **Command Palette:** cmdk 1.1.1

### **UI Enhancement**
- **Layout:** react-resizable-panels 2.1.7
- **Carousel:** embla-carousel-react 8.6.0
- **Modal System:** vaul 1.1.2 (Mobile-friendly)
- **Animations:** tailwindcss-animate 1.0.7

---

## 🔧 Configuration Files

### **Build Configuration**
```typescript
// vite.config.ts - Frontend build
export default defineConfig({
  plugins: [react(), runtimeErrorOverlay()],
  resolve: {
    alias: {
      "@": path.resolve("client", "src"),
      "@shared": path.resolve("shared"),
      "@assets": path.resolve("attached_assets")
    }
  },
  build: {
    outDir: "dist/public",
    emptyOutDir: true
  }
});
```

### **Tailwind Configuration**
```typescript
// tailwind.config.ts - Styling system
export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: { /* Custom design system */ },
      animations: { /* Custom animations */ }
    }
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography")
  ]
};
```

### **Database Configuration**
```typescript
// drizzle.config.ts - Database management
export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL
  }
});
```

---

## 🌐 Environment & Deployment

### **Environment Variables**
```bash
# Core System
NODE_ENV=production|development
DATABASE_URL=postgresql://...
SESSION_SECRET=secure-random-string
PORT=5000

# Authentication (Replit)
ISSUER_URL=https://replit.com/oidc
REPL_ID=auto-configured

# Optional Integrations
OPENAI_API_KEY=sk-...
DAT_API_KEY=your-dat-key
ELD_API_KEY=your-eld-key
```

### **Production Deployment**
- **Platform:** Render.com (configured)
- **Docker:** Not required (native Node.js deployment)
- **Build Time:** ~3-5 minutes
- **Health Monitoring:** /api/health endpoint
- **SSL/TLS:** Automatic HTTPS via Render

### **Development Setup**
```bash
# System Requirements
Node.js 20.x (LTS)
npm 10.x
PostgreSQL (via Supabase)
Git

# Quick Start
git clone [repository]
npm install
npm run dev
```

---

## 📊 Performance & Optimization

### **Build Optimization**
- **Bundle Splitting:** Vite automatic code splitting
- **Tree Shaking:** Dead code elimination
- **Asset Optimization:** Image compression, lazy loading
- **Compression:** Gzip/Brotli in production

### **Runtime Performance**
- **React Query:** Aggressive caching (15+ minute stale time)
- **Memoization:** Component and data memoization
- **Database:** Connection pooling, query optimization
- **Session Storage:** PostgreSQL session store

### **Bundle Sizes**
- **Frontend:** Optimized with Vite bundling
- **Backend:** ESBuild production bundle
- **Dependencies:** Modern tree-shakable libraries
- **Images:** SVG icons, optimized assets

---

## 🔒 Security & Best Practices

### **Security Measures**
- **Type Safety:** End-to-end TypeScript
- **Input Validation:** Zod schema validation
- **Authentication:** OpenID Connect with session management
- **CORS:** Configured for production domains
- **SQL Injection:** Drizzle ORM protection

### **Code Quality**
- **TypeScript Strict Mode:** Maximum type safety
- **ES Modules:** Modern module system
- **Path Aliases:** Clean import structure
- **Error Boundaries:** React error handling
- **API Error Handling:** Centralized error management

---

## 🚀 Deployment Architecture

### **Production Stack**
```
Frontend: React 18 → Vite Build → Static Files
Backend: Express.js → ESBuild → Node.js Server
Database: PostgreSQL → Supabase → Connection Pool
CDN: Render.com → Global Edge Network
```

### **Development Stack**
```
Frontend: Vite Dev Server → HMR → React DevTools
Backend: tsx → Hot Reload → Express Dev Server
Database: Supabase → Development Schema
Tools: TypeScript → Replit Integration
```

### **CI/CD Pipeline**
- **Source Control:** Git with GitHub integration
- **Automatic Deployment:** GitHub → Render webhook
- **Build Process:** npm ci → build → deploy
- **Health Checks:** /api/health monitoring
- **Rollback:** Instant rollback capability

---

## 📋 Maintenance & Updates

### **Dependency Management**
- **Security Updates:** Regular npm audit and updates
- **Version Pinning:** Caret ranges for stability
- **Peer Dependencies:** Properly resolved
- **Optional Dependencies:** bufferutil for WebSocket optimization

### **Monitoring & Logging**
- **Application Logs:** Structured Express logging
- **Error Tracking:** Built-in error boundaries
- **Performance Metrics:** React Query DevTools
- **Health Monitoring:** Automated health checks

### **Backup & Recovery**
- **Database Backups:** Automated daily Supabase backups
- **Code Repository:** Git version control
- **Environment Config:** Documented environment variables
- **Deployment Config:** Infrastructure as code (render.yaml)

---

## 🎯 Recommended Environment Setup

### **Development Environment**
```bash
# Node.js Version Manager
nvm install 20.19.3
nvm use 20.19.3

# Package Installation
npm install -g npm@latest

# Database Setup
# Use Supabase connection string in DATABASE_URL

# Development Start
npm install
npm run dev
```

### **IDE Configuration**
- **Recommended:** VS Code with TypeScript extension
- **Settings:** Use project TypeScript version
- **Extensions:** ES6 modules, Tailwind IntelliSense
- **Formatting:** Prettier with Tailwind plugin

### **Environment Files**
```bash
# .env (development)
NODE_ENV=development
DATABASE_URL=your-supabase-url
SESSION_SECRET=dev-secret

# .env.production (deployment)
NODE_ENV=production
DATABASE_URL=production-database-url
SESSION_SECRET=secure-production-secret
```

---

**Tech Stack Summary:** Modern, production-ready full-stack TypeScript application with React 18, Express.js, PostgreSQL, and comprehensive tooling for enterprise fleet management. Optimized for performance, security, and maintainability with automatic deployment and monitoring capabilities.