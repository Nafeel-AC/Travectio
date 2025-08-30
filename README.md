# Travectio Fleet Management System

> **Enterprise-grade fleet management platform for trucking companies with real-time analytics, multi-tenant architecture, and comprehensive operational tools.**

[![Production Ready](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)](https://github.com/Travectio/Travectio--Backend)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-blue)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-green)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)](https://www.postgresql.org/)

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/Travectio/Travectio--Backend.git
cd Travectio--Backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your database credentials

# Initialize database
npm run db:push

# Start development server
npm run dev
```

## 🏗️ Architecture Overview

### Frontend (React TypeScript)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and production builds
- **UI Components**: Shadcn/ui built on Radix UI primitives
- **Styling**: Tailwind CSS with custom dark theme
- **State Management**: TanStack Query for server state
- **Routing**: Wouter for lightweight client-side routing

### Backend (Node.js Express)
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints with JSON responses
- **Authentication**: OpenID Connect with Passport.js
- **Session Management**: PostgreSQL-backed sessions

### Database (PostgreSQL)
- **Provider**: Neon Database (serverless PostgreSQL)
- **ORM**: Drizzle ORM with schema-first approach
- **Tables**: 21 core tables for complete fleet management
- **Migrations**: Schema push via Drizzle Kit

### Key Features
- **Multi-tenant Architecture**: Complete data isolation between customers
- **Fleet Management**: Truck, driver, and load tracking
- **Cost Analysis**: Industry-standard CPM calculations
- **Real-time Analytics**: Performance metrics and profitability analysis
- **Mobile Responsive**: Touch-friendly interfaces with offline sync
- **Load Board Integration**: Multi-provider support (DAT, Truckstop, etc.)
- **ELD Integration**: Hours of Service tracking across providers

## 📊 Database Schema

### Core Tables
```
users                    # Authentication and role management
trucks                   # Fleet vehicles and configurations
drivers                  # Driver information and assignments
loads                    # Freight tracking and delivery data
hos_logs                 # Hours of Service compliance
fuel_purchases           # Expense tracking
truck_cost_breakdown     # Detailed cost analysis
user_analytics          # Privacy-controlled metrics
fleet_metrics           # Performance analytics
sessions                # Authentication sessions
```

### Complete Schema
See `shared/schema.ts` for the complete database schema with all 21 tables, relationships, and type definitions.

## 🔧 Configuration

### Environment Variables
```bash
# Database (Required)
DATABASE_URL=postgresql://user:password@host:port/database

# Authentication (Required)
SESSION_SECRET=your-secure-session-secret

# Application
NODE_ENV=development
PORT=5000

# Replit Integration (Auto-configured)
REPL_ID=auto-generated
REPLIT_DOMAINS=your-domain.replit.app
ISSUER_URL=https://replit.com/oidc
```

### Optional Integrations
```bash
# DAT Load Board
DAT_API_KEY=your-api-key
DAT_APP_ID=your-app-id
DAT_USER_ID=your-user-id

# ELD Providers
ELD_PROVIDER=samsara
ELD_API_KEY=your-api-key
ELD_API_SECRET=your-secret
```

## 🎯 Core Functionality

### Fleet Management
- **Truck Management**: Add, edit, delete trucks with cost breakdowns
- **Driver Assignment**: Assign drivers to trucks with role management
- **Equipment Types**: Support for Dry Van, Reefer, Flatbed configurations
- **Cost Tracking**: Fixed and variable cost analysis with CPM calculations

### Load Operations
- **Load Tracking**: Complete load lifecycle management
- **Profitability Analysis**: Real-time profit/loss calculations
- **Route Optimization**: Distance calculations with deadhead miles
- **Load Board Integration**: Automated load matching across providers

### Analytics & Reporting
- **Fleet Analytics**: Performance metrics and trend analysis
- **Cost Analysis**: Industry-standard cost-per-mile calculations
- **User Metrics**: Privacy-controlled analytics dashboard
- **Session Tracking**: Comprehensive audit logging

### Multi-tenant Features
- **Data Isolation**: Complete separation between customer accounts
- **Role-based Access**: Founder, admin, and customer access levels
- **Demo Mode**: Sample data for client demonstrations
- **Account Switching**: Customer support capabilities

## 🔐 Authentication & Security

### Multi-tenant Architecture
- **Founder Account**: Complete system access and user management
- **Customer Accounts**: Isolated access to individual fleet data
- **Demo Account**: Sample data for demonstrations

### Security Features
- OpenID Connect authentication
- PostgreSQL-backed session storage
- Role-based access control
- Audit logging for compliance
- Session timeout protection

## 📱 User Interface

### Design System
- **Modern Dark Theme**: Professional appearance with consistent styling
- **Responsive Design**: Mobile-first approach with touch-friendly interfaces
- **Component Library**: Unified design system with Shadcn/ui
- **Navigation**: Intuitive sidebar with descriptive labels and icons

### Key Pages
- **Dashboard**: Fleet overview with key metrics
- **Fleet Overview**: Complete truck and driver management
- **Load Management**: Load tracking and profitability analysis
- **Analytics**: Performance metrics and trend analysis
- **User Management**: Admin-only user oversight (founder access)

## 🚀 Deployment

### Development
```bash
npm run dev          # Start development server
npm run check        # TypeScript type checking
npm run db:push      # Push schema changes
```

### Production
```bash
npm run build        # Build for production
npm start           # Start production server
```

### Hosting Options
- **Replit Deployments**: One-click deployment with auto-scaling
- **Vercel**: Frontend deployment with serverless functions
- **Railway**: Full-stack deployment with PostgreSQL
- **Render**: Container-based deployment

## 📚 Documentation

### Available Documentation
- [`TRANSFER_PREPARATION_GUIDE.md`](./TRANSFER_PREPARATION_GUIDE.md) - Complete setup and transfer guide
- [`GITHUB_TRANSFER_README.md`](./GITHUB_TRANSFER_README.md) - Quick setup instructions
- [`FILE_STRUCTURE.md`](./FILE_STRUCTURE.md) - Project organization guide
- [`replit.md`](./replit.md) - Comprehensive project documentation
- [`export_data.sql`](./export_data.sql) - Database backup script

### Technical Reports
- [`DEPLOYMENT.md`](./DEPLOYMENT.md) - Deployment strategies
- [`RENDER_DEPLOYMENT.md`](./RENDER_DEPLOYMENT.md) - Render-specific deployment
- Multiple incident reports documenting system improvements

## 🔧 Development

### Prerequisites
- Node.js 20+
- PostgreSQL database
- npm or yarn

### Local Development Setup
1. Clone repository
2. Install dependencies: `npm install`
3. Configure environment variables
4. Initialize database: `npm run db:push`
5. Start development server: `npm run dev`

### Code Structure
```
client/              # React frontend
├── src/
│   ├── components/  # Reusable UI components
│   ├── pages/       # Application pages
│   ├── hooks/       # Custom React hooks
│   └── utils/       # Helper functions

server/              # Express backend
├── auth-service.ts  # Authentication logic
├── routes.ts        # API endpoints
├── storage.ts       # Database operations
└── index.ts         # Server entry point

shared/              # Common types and schemas
├── schema.ts        # Database schema (Drizzle)
└── types.ts         # TypeScript interfaces
```

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make changes with proper testing
4. Submit a pull request
5. Code review and approval process

### Security Guidelines
- Never commit `.env` files or secrets
- Use separate databases for development/production
- Follow authentication best practices
- Implement proper error handling

## 📊 System Status

### Current Data
- **21 Database Tables**: Complete operational schema
- **Multi-tenant Ready**: Production-grade data isolation
- **Performance Optimized**: Query caching and infinite loop prevention
- **Mobile Responsive**: Complete touch-friendly interface

### Recent Improvements
- ✅ Fleet Analytics infinite loop resolution
- ✅ Cost calculation accuracy (industry-standard CPM)
- ✅ Account switching persistence
- ✅ Performance optimization with aggressive caching

## 📄 License

This project is proprietary software developed for Travectio Solutions.

## 📞 Support

For technical support or questions:
- Review documentation in this repository
- Check the comprehensive transfer guide
- Refer to `replit.md` for detailed project context

---

**Travectio Fleet Management System** - Empowering trucking companies with real-time decision-making tools and operational efficiency.