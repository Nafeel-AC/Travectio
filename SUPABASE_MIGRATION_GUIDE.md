# Supabase Migration Guide

This guide will help you migrate from PostgreSQL/Drizzle ORM to Supabase for the Travectio Fleet Management System.

## 🚀 Quick Start

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note down your project URL and API keys
3. Wait for the project to be ready

### 2. Configure Environment Variables
Create a `.env` file in your project root:

```bash
# Supabase Configuration (Required)
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Session Configuration (Required)
SESSION_SECRET=your-secure-session-secret

# Application Configuration
NODE_ENV=development
PORT=5000
```

### 3. Create Database Tables
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase-schema.sql`
4. Run the SQL commands

### 4. Test Connection
```bash
npm run supabase:test
```

### 5. Start Development Server
```bash
npm run dev
```

## 🔄 What Changed

### Removed Dependencies
- `@neondatabase/serverless` - Neon database client
- `drizzle-orm` - Drizzle ORM
- `drizzle-zod` - Drizzle Zod integration
- `connect-pg-simple` - PostgreSQL session store
- `passport` - Passport.js authentication
- `postgres` - PostgreSQL client
- `pg` - PostgreSQL driver

### New Dependencies
- `@supabase/supabase-js` - Supabase JavaScript client

### File Changes
- **Deleted**: `server/db.ts`, `server/storage.ts`, `server/replitAuth.ts`, `drizzle.config.ts`
- **Created**: `server/supabase-storage.ts`, `server/supabase-auth.ts`, `supabase-schema.sql`
- **Updated**: `server/routes.ts`, `server/index.ts`, `package.json`, `README.md`

## 🏗️ Architecture Changes

### Before (PostgreSQL + Drizzle)
```
Express Server → Drizzle ORM → PostgreSQL (Neon)
```

### After (Supabase)
```
Express Server → Supabase Client → Supabase (PostgreSQL + Auth + Real-time)
```

## 🔐 Authentication Changes

### Before
- OpenID Connect with Passport.js
- PostgreSQL-backed sessions
- Complex session management

### After
- Supabase Auth with JWT tokens
- Built-in user management
- Automatic session handling

## 💾 Database Changes

### Before
- Direct PostgreSQL connection
- Drizzle ORM schema definitions
- Manual migrations with `drizzle-kit`

### After
- Supabase client connection
- SQL schema file for manual execution
- Built-in Row Level Security (RLS)

## 📊 Data Migration

If you have existing data, you'll need to migrate it:

### Option 1: Export/Import
1. Export data from your old database
2. Import into Supabase using the SQL Editor
3. Update any ID references if needed

### Option 2: API Migration
1. Create a migration script
2. Read from old database
3. Write to Supabase using the new storage layer

## 🔒 Security Setup

### Row Level Security (RLS)
The schema includes basic RLS policies:
- Users can only access their own data
- Founder users can access all data
- Session data is isolated by user

### Customize Policies
Review and modify the RLS policies in `supabase-schema.sql` based on your needs.

## 🧪 Testing

### Test Supabase Connection
```bash
npm run supabase:test
```

### Test Authentication
1. Create a user in Supabase Auth
2. Test login/logout flow
3. Verify JWT token handling

### Test Data Operations
1. Create test trucks, loads, drivers
2. Verify data isolation between users
3. Test founder access privileges

## 🚨 Common Issues

### Connection Errors
- Verify `SUPABASE_URL` and API keys
- Check if Supabase project is active
- Ensure tables exist in your project

### Authentication Issues
- Verify JWT token format
- Check Supabase Auth settings
- Ensure RLS policies are correct

### Data Access Issues
- Check RLS policies
- Verify user permissions
- Check table relationships

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Authentication Guide](https://supabase.com/docs/guides/auth)

## 🆘 Support

If you encounter issues:
1. Check the Supabase dashboard for errors
2. Review the browser console for client errors
3. Check the server logs for backend errors
4. Verify your environment variables
5. Ensure all tables are created correctly

## 🎯 Next Steps

After successful migration:
1. Test all major features
2. Update any custom integrations
3. Configure monitoring and alerts
4. Set up backup strategies
5. Document any customizations

---

**Happy migrating! 🚀**

The Travectio Fleet Management System is now powered by Supabase, providing you with:
- Built-in authentication
- Real-time capabilities
- Automatic scaling
- Enhanced security
- Simplified deployment
