# 🚀 Supabase Setup Guide for Travectio

## 📋 Prerequisites
- [Supabase Account](https://supabase.com) (free tier available)
- Node.js 20+ installed
- Project dependencies installed (`npm install`)

## 🎯 Step-by-Step Setup

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `travectio-fleet-management`
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait for project to be ready (2-3 minutes)

### 2. Get Your Credentials
1. Go to **Settings** → **API** in your project dashboard
2. Copy these values:
   - **Project URL** (e.g., `https://abcdefghijklm.supabase.co`)
   - **Anon public key** (starts with `eyJ...`)
   - **Service role key** (starts with `eyJ...`)

### 3. Get Database Connection String
1. Go to **Settings** → **Database**
2. Copy the **Connection string** (URI format)
3. It looks like: `postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres`

### 4. Update Environment Variables
Edit your `.env` file with real values:

```env
# Supabase Configuration
DATABASE_URL=postgresql://postgres:your_actual_password@db.your_project_ref.supabase.co:5432/postgres
SUPABASE_URL=https://your_project_ref.supabase.co
SUPABASE_ANON_KEY=your_actual_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key

# Session Security
SESSION_SECRET=development-secret-key-1753713907

# Application Settings
NODE_ENV=development
```

### 5. Test Database Connection
```bash
npm run supabase:test
```

### 6. Initialize Database Schema
```bash
npm run db:push
```

### 7. Start the Application
```bash
npm run dev
```

## 🔧 Available Commands

- `npm run supabase:test` - Test database connection
- `npm run supabase:setup` - Run setup script
- `npm run db:push` - Push schema to database
- `npm run dev` - Start development server

## 🚨 Troubleshooting

### Connection Issues
- Verify `DATABASE_URL` is correct
- Check if password contains special characters
- Ensure SSL is enabled (should be automatic)

### Schema Issues
- Run `npm run db:push` to create tables
- Check Supabase logs for errors
- Verify database user has create table permissions

### Environment Variables
- Ensure `.env` file is in project root
- Restart terminal after updating `.env`
- Check for typos in variable names

## 📊 What Gets Created

The system will create 21+ tables including:
- `trucks` - Fleet vehicle management
- `drivers` - Driver information
- `loads` - Freight tracking
- `fuel_purchases` - Expense tracking
- `truck_cost_breakdown` - Cost analysis
- And many more...

## 🎉 Success Indicators

- ✅ Database connection test passes
- ✅ Schema creation completes without errors
- ✅ Application starts and loads dashboard
- ✅ No database connection errors in console

## 🔐 Security Notes

- Never commit `.env` file to version control
- Use strong database passwords
- Service role key has admin access - keep secure
- Anon key is safe for public use

## 📞 Support

If you encounter issues:
1. Check Supabase project logs
2. Verify environment variables
3. Test database connection separately
4. Check project documentation
