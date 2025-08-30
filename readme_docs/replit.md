# Travectio Fleet Management System

## Overview
Travectio Solutions is a comprehensive enterprise fleet management platform for trucking companies, designed to manage trucks, loads, and calculate profitability. Its purpose is to empower trucking companies with real-time decision-making tools, enhance operational efficiency, and maximize profit margins. Key capabilities include real-time metrics, load profitability analysis, and fleet oversight via an enhanced dashboard with intelligent cross-tab synchronization. The system is production-ready, optimized for performance, and supports multi-tenant authentication with robust data isolation.

## User Preferences
Preferred communication style: Simple, everyday language.
Development approach: Focus on beta testing readiness - maintain current feature set for validation before expanding.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **UI Framework**: Shadcn/ui built on Radix UI
- **Styling**: Tailwind CSS (dark theme, custom gradients/animations), unified design system
- **State Management**: React Query (TanStack Query) for server state
- **Build Tool**: Vite
- **Mobile Support**: Complete responsive design with mobile-first approach, touch-friendly interfaces, offline data synchronization (IndexedDB), and adaptive navigation.
- **UI/UX Decisions**: Unified modern dark theme, consistent visual hierarchy, sleek navigation with descriptive labels and icons, founder-level access indicators.

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (ES modules)
- **API Pattern**: RESTful API with JSON responses
- **Error Handling**: Centralized

### Data Storage
- **Database**: PostgreSQL (configured via Drizzle)
- **ORM**: Drizzle ORM (schema-first approach)
- **Connection**: Neon Database serverless PostgreSQL

### Authentication and Authorization
- **Authentication System**: OpenID Connect with PostgreSQL
- **Account Architecture**: Founder account (system oversight, no operational data), Demo account (sample fleet data), Customer accounts (isolated fleet data).
- **Role-Based Access Control**: Multi-tier access control with `isAdmin` and `isFounder` flags, ensuring data isolation and specific feature access for founders (user management, system analytics).

### Core Features and Design Patterns
- **Unified Modern Design System**: Consistent visual elements, professional dark theme, and intuitive navigation.
- **Cross-Tab Data Synchronization**: Real-time data flow between dashboard tabs (e.g., `DataSynchronizationManager`).
- **Enhanced Truck Management**: Comprehensive interface for adding trucks, detailed fixed/variable cost breakdown, and real-time cost-per-mile calculations.
- **Advanced Load Recommendation Engine**: Algorithmic system for multi-factor scoring, market analysis, route optimization, profitability, and multi-stop optimization.
- **Time-Based Analytics**: Comprehensive filtering by week, month, quarter with cross-tab synchronization (`TimeFilterProvider Context`).
- **Automated Miles Calculation**: Precise city-to-city coordinate-based distance calculation (Haversine formula).
- **Enhanced Deadhead Miles Integration**: Includes non-revenue miles in all cost-per-mile calculations for accurate operational costs.
- **Load Edit Functionality**: Full editing capabilities for existing load entries.
- **Automated Truck Miles Update**: Updates truck total miles based on load and fuel transaction changes.
- **Enhanced Load Profitability Calculator**: Connects to actual weekly operational data for automatic cost, mileage, MPG, and fuel price population.
- **Comprehensive Analytics and Data Collection**: Enterprise-grade system capturing user interactions, feature usage, and session tracking.
- **Instructional Truck Cost Parameter Guide**: User education system during truck creation for cost guidance.
- **User Management System**: Admin-only interface for user viewing and management.
- **Privacy-Controlled User Metrics System**: Tracks business and user interaction metrics with strict privacy controls, visible only to individual users and founders.
- **Owner Dashboard with User Management**: Founder-level dashboard for system-wide visibility, user access management (termination/reactivation), and audit logging.
- **Comprehensive Session Management System**: Enterprise-grade session tracking, lifecycle management, audit logging, and multi-session management.
- **Mobile-Responsive Design with Offline Sync**: Mobile-first design, touch-friendly interfaces, offline data synchronization via IndexedDB, and real-time connection monitoring.
- **Comprehensive Driver Navigation Guide System**: Interactive onboarding, contextual help, and guided tours for key features.
- **Complete Truck Management with Editing & Deletion**: Inline editing, comprehensive forms, secure deletion, and real-time updates.
- **Simplified Driver Assignment Workflow**: Direct driver assignment integrated into fleet overview components.
- **Accurate Operational Metrics Display**: Smart trend calculation displaying percentage changes only when historical freight data exists.
- **Multi-Provider Load Board Integration System**: Supports DAT, Truckstop, 123Loadboard, SuperDispatch with unified search, standardized schema, and market rate comparison.
- **Multi-ELD Provider Integration System**: Supports Samsara, KeepTruckin/Motive, Garmin, etc., providing normalized HOS status, driver logs, and vehicle location monitoring.
- **User Self-Service Account Management**: Allows users to manage profiles and initiate secure account termination with data cleanup.
- **Production-Ready Cost Calculations**: Industry-standard cost-per-mile calculations based on weekly mile baselines (3000 miles).
- **Performance-Optimized Analytics**: Fleet Analytics dashboard with stable query architecture, aggressive caching, and demo mode data isolation.
- **Founder Account Switching for Customer Support**: Founder can toggle between founder and customer views for support.

### Database Schema
- **Tables**: Trucks (with load board and ELD provider preferences), Loads, Drivers, HOS Logs, Load Board, Activities, Fleet Metrics, Load Calculations, Users, User Analytics, Session Management, Data Input Tracking, Feature Analytics, System Metrics.

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL serverless connection
- **drizzle-orm**: Database ORM and migrations
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Headless UI component primitives
- **wouter**: Lightweight routing library
- **zod**: Runtime type validation and schema validation

### Development Tools
- **Vite**: Development server and build tool
- **TypeScript**: Type safety
- **Tailwind CSS**: Utility-first styling framework
- **ESBuild**: Production bundling for server code