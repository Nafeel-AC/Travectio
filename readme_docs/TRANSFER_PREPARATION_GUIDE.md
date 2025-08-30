# Travectio Fleet Management System - Transfer Preparation Guide

## Project Overview
**System**: Travectio Fleet Management System  
**Architecture**: Full-stack React TypeScript with Express.js backend  
**Database**: PostgreSQL (Neon Database)  
**Authentication**: OpenID Connect with multi-tenant support  
**Current Status**: Production-ready with comprehensive fleet management features  

---

## 🔧 Critical Environment Variables

### Required for Basic Functionality
```bash
# Database Connection (CRITICAL - Must be configured first)
DATABASE_URL=postgresql://neondb_owner:npg_S4euV7RKcYiB@ep-quiet-salad-adi25hzx.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require

# PostgreSQL Individual Components (Auto-extracted from DATABASE_URL)
PGHOST=ep-quiet-salad-adi25hzx.c-2.us-east-1.aws.neon.tech
PGDATABASE=neondb
PGUSER=neondb_owner
PGPASSWORD=npg_S4euV7RKcYiB
PGPORT=5432

# Session Security (Generate new secret for production)
SESSION_SECRET=your-secure-session-secret-key-here

# Replit Environment (Auto-configured in Replit)
REPL_ID=auto-generated-by-replit
REPLIT_DOMAINS=your-domain.replit.app
ISSUER_URL=https://replit.com/oidc

# Application Settings
NODE_ENV=development  # Change to 'production' for live deployment
PORT=5000
```

### Optional Integration Variables
```bash
# DAT Load Board Integration (Optional - for load matching)
DAT_API_KEY=your-dat-api-key
DAT_APP_ID=your-dat-app-id
DAT_USER_ID=your-dat-user-id
DAT_API_BASE_URL=https://api.dat.com/v1

# ELD/HOS Integration (Optional - for hours of service tracking)
ELD_PROVIDER=samsara
ELD_API_KEY=your-eld-api-key
ELD_API_SECRET=your-eld-api-secret
ELD_API_BASE_URL=https://api.samsara.com/v1
```

---

## 🗄️ Database Information

### Current Database Provider
- **Service**: Neon Database (Serverless PostgreSQL)
- **Connection**: SSL required
- **ORM**: Drizzle ORM with TypeScript

### Database Tables Structure
The system includes 21 core tables:
- **users** - Authentication and roles
- **trucks** - Fleet vehicles and configurations  
- **drivers** - Driver information and assignments
- **loads** - Freight and delivery tracking
- **hos_logs** - Hours of Service compliance
- **fuel_purchases** - Expense tracking
- **truck_cost_breakdown** - Detailed cost analysis
- **activities** - System activity tracking
- **sessions** - Authentication sessions
- **user_analytics** - Privacy-controlled user metrics
- **fleet_metrics** - Performance analytics
- **load_board** - Load board integrations
- **system_metrics** - System-wide metrics
- Plus additional tables for load planning, session auditing, and feature analytics

### Current Data Volume
Based on current database state:
- Users: 5 accounts with multi-tenant setup
- Trucks: 4 active fleet vehicles configured
- Drivers: 4 associated driver records
- Loads: 5 historical freight records
- Complete operational data for demo and production use

### Migration Strategy
```bash
# Method 1: Schema-only migration (recommended for new setup)
npm run db:push

# Method 2: Full data export (if preserving existing data)
# Use the provided export_data.sql script
```

### Data Export Script
A complete data export script (`export_data.sql`) has been created to backup all critical data if needed during transfer.

---

## 📦 Dependencies & Package Management

### Core Runtime Dependencies
- **Frontend**: React 18, TypeScript, Vite
- **Backend**: Express.js, Node.js with ES modules
- **Database**: Drizzle ORM, @neondatabase/serverless
- **UI**: Radix UI components, Tailwind CSS, Shadcn/ui
- **Authentication**: Passport.js, OpenID Connect
- **State Management**: TanStack Query (React Query)

### Development Dependencies
- TypeScript compilation and checking
- Tailwind CSS and PostCSS
- Vite build system with React plugin
- Replit-specific plugins for development

### Installation Commands
```bash
# Install all dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Database operations
npm run db:push
```

---

## 🔐 Authentication & User Management

### Multi-Tenant Architecture
- **Founder Account**: `rrivera@travectiosolutions.com` (Full system access)
- **Demo Account**: `demo@travectiosolutions.com` (Sample data for demonstrations)
- **Customer Accounts**: Individual fleet data isolation

### Critical Authentication Features
- OpenID Connect integration with Replit
- Role-based access control (`isFounder`, `isAdmin` flags)
- Session management with PostgreSQL store
- Account switching for customer support
- Data isolation between tenants

---

## 🚀 Deployment Configuration

### Production Readiness Checklist
- [x] Multi-tenant data isolation implemented
- [x] Performance optimizations (query caching, infinite loop fixes)
- [x] Cost calculation accuracy (industry-standard CPM calculations)
- [x] Mobile-responsive design
- [x] Comprehensive error handling
- [x] Session security and audit logging

### Workflow Configuration
The system uses Replit's workflow system:
```yaml
# Workflow: "Start application"
Command: npm run dev
# Automatically handles port allocation and process management
```

---

## 📋 Transfer Checklist

### Pre-Transfer Preparation
- [ ] Export current database schema and data (if needed)
- [ ] Document any custom API keys or integrations
- [ ] Note any specific configuration customizations
- [ ] Backup critical user data

### Post-Transfer Setup
1. **Environment Variables**: Configure all required environment variables
2. **Database**: Set up new PostgreSQL database or migrate existing data
3. **Dependencies**: Run `npm install` to install all packages
4. **Database Schema**: Run `npm run db:push` to create tables
5. **Authentication**: Verify OpenID Connect configuration
6. **Testing**: Test founder account access and data isolation

### Verification Steps
- [ ] Application starts successfully (`npm run dev`)
- [ ] Database connectivity confirmed
- [ ] Authentication flow working
- [ ] Founder account has proper access
- [ ] Demo mode functions correctly
- [ ] Customer data isolation verified
- [ ] All core features operational

---

## 🔧 Key Configuration Files

### Essential Files to Transfer
- `package.json` - Dependencies and scripts
- `drizzle.config.ts` - Database configuration
- `shared/schema.ts` - Complete database schema
- `.env.example` - Environment variable template
- `replit.md` - Project documentation and preferences
- All source code in `client/`, `server/`, and `shared/` directories

### Build Configuration
- `vite.config.ts` - Frontend build configuration
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.ts` - Styling configuration
- `postcss.config.js` - CSS processing

---

## ⚠️ Important Notes

### Critical Success Factors
1. **Database URL**: Must be configured first - application will not start without it
2. **Session Secret**: Generate a new secure secret for production
3. **Multi-tenant Data**: Ensure proper data isolation between accounts
4. **Performance**: Query caching and optimization settings are critical for stability

### Known Issues Resolved
- ✅ Fleet Analytics infinite loop issues (resolved with proper query architecture)
- ✅ Cost calculation accuracy (fixed CPM calculations using standard weekly miles)
- ✅ Account switching persistence (resolved with proper state management)

### Support Information
- Original developer: Familiar with complete system architecture
- Documentation: Comprehensive system documentation in `replit.md`
- Debug modes: Extensive logging and debug capabilities built-in

---

*This guide ensures a smooth transfer of your Travectio Fleet Management System to a new environment while preserving all functionality and data integrity.*