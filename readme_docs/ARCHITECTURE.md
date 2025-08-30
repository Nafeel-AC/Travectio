# Travectio System Architecture

## System Overview

Travectio is a full-stack fleet management platform built with modern web technologies, designed for scalability, security, and real-time performance.

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │    Database     │
│   (React)       │◄──►│   (Express)     │◄──►│  (PostgreSQL)   │
│   Port: 5173    │    │   Port: 5000    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## Frontend Architecture

### Technology Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and production builds
- **UI Framework**: Shadcn/ui components built on Radix UI
- **Styling**: Tailwind CSS with custom design system
- **State Management**: TanStack Query for server state
- **Routing**: Wouter for lightweight client-side routing

### Component Architecture
```
client/src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (shadcn/ui)
│   ├── forms/          # Form components with validation
│   ├── charts/         # Data visualization components
│   └── layout/         # Layout and navigation components
├── pages/              # Route-level page components
│   ├── dashboard/      # Dashboard and analytics
│   ├── fleet/          # Truck and driver management
│   ├── loads/          # Load tracking and management
│   └── admin/          # Administrative interfaces
├── hooks/              # Custom React hooks
│   ├── useAuth.ts      # Authentication logic
│   ├── useDemoApi.ts   # Demo mode state management
│   └── queries/        # TanStack Query hooks
├── lib/                # Core utilities and configurations
│   ├── queryClient.ts  # API client configuration
│   ├── utils.ts        # General utilities
│   └── validations.ts  # Form validation schemas
└── utils/              # Helper functions
    ├── customer-mode.ts # Multi-tenant utilities
    └── calculations.ts  # Business logic calculations
```

### State Management Strategy
- **Server State**: TanStack Query with aggressive caching
- **Client State**: React hooks (useState, useContext)
- **Multi-tenant State**: Custom hooks with localStorage persistence
- **Form State**: React Hook Form with Zod validation

### Performance Optimizations
- Query caching with 15+ minute stale times for stable data
- Disabled automatic refetching to prevent infinite loops
- Memoized calculations for cost analysis
- Lazy loading for route-based code splitting

---

## Backend Architecture

### Technology Stack
- **Runtime**: Node.js 20 with Express.js
- **Language**: TypeScript with ES modules
- **Authentication**: Passport.js with OpenID Connect
- **Session Management**: PostgreSQL-backed sessions
- **Database ORM**: Drizzle ORM with type safety

### Service Architecture
```
server/
├── index.ts              # Application entry point
├── auth-service.ts       # Authentication logic
├── routes.ts             # API route definitions
├── storage.ts            # Database operations
├── dual-mode-service.ts  # Multi-tenant support
└── middleware/           # Custom middleware
    ├── auth.ts          # Authentication middleware
    └── validation.ts    # Request validation
```

### API Design Patterns
- **RESTful Endpoints**: Standard HTTP methods and status codes
- **Request Validation**: Zod schemas for all inputs
- **Error Handling**: Centralized error middleware
- **Response Formatting**: Consistent JSON response structure

### Multi-tenant Architecture
```
┌─────────────────┐
│  Founder Mode   │ ── System-wide access, user management
├─────────────────┤
│  Customer Mode  │ ── Isolated fleet data per customer
├─────────────────┤
│   Demo Mode     │ ── Sample data for demonstrations
└─────────────────┘
```

---

## Database Architecture

### Database Provider
- **Service**: Neon Database (Serverless PostgreSQL)
- **Connection**: SSL-required with connection pooling
- **ORM**: Drizzle ORM with schema-first approach

### Schema Design
```
Core Tables (21 total):
├── users                 # Authentication and roles
├── trucks                # Fleet vehicle configuration
├── drivers               # Driver information
├── loads                 # Freight tracking
├── hos_logs              # Hours of Service compliance
├── fuel_purchases        # Expense tracking
├── truck_cost_breakdown  # Detailed cost analysis
├── sessions              # Authentication sessions
├── user_analytics        # Privacy-controlled metrics
├── fleet_metrics         # Performance analytics
└── ...                   # Additional operational tables
```

### Data Relationships
```sql
users ──┐
        ├── trucks ── loads
        ├── drivers
        ├── fuel_purchases
        └── user_analytics

trucks ──┐
         ├── truck_cost_breakdown
         ├── loads
         └── hos_logs (via drivers)
```

### Data Isolation Strategy
- **Row-Level Security**: userId-based filtering
- **Query-Level Isolation**: Middleware enforces user context
- **Session Validation**: PostgreSQL session store with user binding

---

## Authentication & Authorization

### Authentication Flow
```
1. User → OpenID Connect Provider (Replit)
2. Provider → Callback with authorization code
3. Backend → Exchange code for user info
4. Backend → Create/update user session
5. Frontend → Authenticated API access
```

### Authorization Levels
```
┌─────────────────┐
│    Founder      │ ── Complete system access
├─────────────────┤
│     Admin       │ ── User management capabilities
├─────────────────┤
│   Customer      │ ── Individual fleet data only
└─────────────────┘
```

### Session Management
- **Storage**: PostgreSQL with connect-pg-simple
- **Security**: HttpOnly cookies with CSRF protection
- **Timeout**: Configurable session expiration
- **Audit**: Complete session lifecycle logging

---

## Security Architecture

### Data Protection
- **Encryption**: TLS 1.3 for all communications
- **Session Security**: Secure, HttpOnly cookies
- **Database**: SSL-required connections
- **Secrets Management**: Environment variables only

### Access Control
- **Authentication**: OpenID Connect with Replit
- **Authorization**: Role-based access control (RBAC)
- **Data Isolation**: Multi-tenant with row-level security
- **API Security**: Request validation and rate limiting

### Audit & Compliance
- **Session Logging**: Complete user session tracking
- **Action Auditing**: All data modifications logged
- **Privacy Controls**: User-controlled analytics visibility
- **Data Retention**: Configurable retention policies

---

## Performance & Scalability

### Frontend Performance
- **Bundle Size**: Code splitting for optimal loading
- **Caching**: Aggressive query caching with TanStack Query
- **Rendering**: React 18 concurrent features
- **Mobile**: Responsive design with touch optimization

### Backend Performance
- **Database**: Connection pooling with Neon
- **Caching**: Query result caching
- **API**: Efficient SQL queries with proper indexing
- **Session**: Memory-efficient session storage

### Scalability Considerations
- **Database**: Serverless PostgreSQL auto-scaling
- **Application**: Stateless design for horizontal scaling
- **CDN**: Static asset delivery optimization
- **Monitoring**: Performance metrics and alerting

---

## Development Architecture

### Build System
```
Development:
├── Frontend: Vite dev server (hot reload)
├── Backend: tsx with watch mode
└── Database: Drizzle Kit for schema management

Production:
├── Frontend: Vite build → static assets
├── Backend: esbuild → optimized Node.js bundle
└── Database: Schema migrations via Drizzle
```

### Development Workflow
1. **Local Development**: `npm run dev` starts both frontend and backend
2. **Type Safety**: TypeScript across the entire stack
3. **Code Quality**: ESLint and Prettier for consistency
4. **Testing**: Jest for unit tests, Playwright for E2E

### Deployment Strategy
- **Development**: Replit with automatic deployments
- **Staging**: Separate environment for testing
- **Production**: Scalable hosting with database separation

---

## Integration Architecture

### External Services
```
┌─────────────────┐
│  Load Boards    │ ── DAT, Truckstop, 123Loadboard
├─────────────────┤
│  ELD Providers  │ ── Samsara, Motive, Garmin
├─────────────────┤
│  Payment APIs   │ ── Stripe (future integration)
└─────────────────┘
```

### API Integration Strategy
- **Provider Abstraction**: Unified interface for multiple providers
- **Configuration**: Per-truck provider preferences
- **Fallback**: Graceful degradation when providers unavailable
- **Rate Limiting**: Respect provider API limits

---

## Monitoring & Observability

### Application Monitoring
- **Performance**: Response time and throughput metrics
- **Errors**: Centralized error logging and alerting
- **Usage**: Feature adoption and user behavior tracking
- **Health**: System health checks and uptime monitoring

### Business Metrics
- **Fleet KPIs**: Cost per mile, profitability, utilization
- **User Engagement**: Feature usage and session analytics
- **System Growth**: User acquisition and retention metrics

### Debugging & Diagnostics
- **Logging**: Structured logging with proper levels
- **Tracing**: Request tracing for performance analysis
- **Debug Modes**: Development debugging capabilities

---

This architecture supports Travectio's goal of providing enterprise-grade fleet management while maintaining simplicity for end users and developers.