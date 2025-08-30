# Deploying Travectio to Render

This guide covers migrating your Travectio fleet management system from Replit to Render.

## Environment Variables Migration

### From Replit Secrets to Render Environment Variables

In Replit, you store credentials in **Secrets** (🔑 icon). In Render, you'll configure them as **Environment Variables** in your service settings.

#### Step 1: Export Your Current Replit Secrets

From your Replit project, you'll need to transfer these environment variables:

**Load Board API Credentials:**
- `DAT_API_KEY` - Your DAT load board API key
- `DAT_APP_ID` - Your DAT application ID  
- `DAT_USER_ID` - Your DAT user identifier
- `TRUCKSTOP_API_KEY` - Truckstop.com API key
- `TRUCKSTOP_USER_ID` - Truckstop user ID

**ELD Integration Credentials:**
- `ELD_PROVIDER` - Your ELD provider (samsara, motive, geotab, etc.)
- `ELD_API_KEY` - ELD system API key
- `ELD_API_SECRET` - ELD API secret (if required)
- `SAMSARA_API_TOKEN` - Samsara specific token
- `MOTIVE_API_KEY` - Motive specific key
- `MOTIVE_SECRET` - Motive secret key
- `GEOTAB_USERNAME` - Geotab username
- `GEOTAB_PASSWORD` - Geotab password
- `GEOTAB_DATABASE` - Geotab database name

**Database Configuration:**
- `DATABASE_URL` - PostgreSQL connection string (you'll need a new one from Render)

#### Step 2: Configure Render Environment Variables

1. **Create a New Service on Render:**
   - Go to [render.com](https://render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Add Environment Variables:**
   - In your Render service dashboard
   - Go to "Environment" tab
   - Add each variable one by one:
     ```
     Key: DAT_API_KEY
     Value: [your_actual_dat_api_key]
     
     Key: DAT_APP_ID  
     Value: [your_actual_app_id]
     
     Key: ELD_PROVIDER
     Value: samsara
     
     [... continue for all variables]
     ```

3. **Database Setup on Render:**
   - Create a PostgreSQL database: "New +" → "PostgreSQL"
   - Copy the connection string to `DATABASE_URL` environment variable

## Deployment Configuration

### Build Settings for Render

Create a `render.yaml` file in your project root:

```yaml
services:
  - type: web
    name: travectio-fleet-management
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: travectio-db
          property: connectionString

databases:
  - name: travectio-db
    databaseName: travectio
    user: travectio_user
```

### Package.json Scripts Update

Ensure your `package.json` has the production build script:

```json
{
  "scripts": {
    "build": "npm run build:client && npm run build:server",
    "build:client": "vite build",
    "build:server": "esbuild server/index.ts --bundle --platform=node --outfile=dist/server.js",
    "start": "node dist/server.js",
    "dev": "npm run dev:client & npm run dev:server",
    "dev:client": "vite",
    "dev:server": "tsx server/index.ts"
  }
}
```

## Database Migration

### Schema Setup on Render PostgreSQL

1. **Run Database Migrations:**
   ```bash
   npm run db:push
   ```

2. **Seed Initial Data** (if needed):
   ```bash
   npm run db:seed
   ```

## Security Considerations

### Important Changes for Production

1. **CORS Configuration:**
   Update your Express server to handle production domains:
   ```typescript
   app.use(cors({
     origin: ['https://your-app-name.onrender.com'],
     credentials: true
   }));
   ```

2. **Session Configuration:**
   Update session settings for production:
   ```typescript
   app.use(session({
     // ... existing config
     cookie: {
       secure: true, // HTTPS only
       domain: '.onrender.com'
     }
   }));
   ```

## Testing Your Migration

### Pre-deployment Checklist

- [ ] All environment variables configured in Render
- [ ] Database connection string updated
- [ ] Build commands working locally
- [ ] API endpoints tested with production URLs
- [ ] Integration credentials verified

### Post-deployment Verification

1. **Test API Connections:**
   - Visit `/integration-management` page
   - Use "Test Connection" buttons for each integration
   - Verify all credentials are working

2. **Database Connectivity:**
   - Check truck management functionality
   - Verify load tracking works
   - Test user authentication

## Migration Script

Here's a helper script to verify your environment variables:

```bash
#!/bin/bash
# verify-env.sh

echo "Checking required environment variables..."

required_vars=(
  "DATABASE_URL"
  "DAT_API_KEY" 
  "DAT_APP_ID"
  "DAT_USER_ID"
  "ELD_PROVIDER"
  "ELD_API_KEY"
)

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ Missing: $var"
  else
    echo "✅ Found: $var"
  fi
done
```

## Support

If you encounter issues during migration:

1. **Check Render logs** in your service dashboard
2. **Verify database connectivity** using the connection string
3. **Test API credentials** individually using the integration management page
4. **Review CORS settings** if getting browser errors

## Cost Comparison

**Replit vs Render:**
- Replit: Development-focused, automatic deployments
- Render: Production-ready, auto-scaling, better performance
- Both support PostgreSQL databases
- Render offers better uptime guarantees for production

---

*This migration guide ensures your Travectio fleet management system transitions smoothly from Replit to Render while maintaining all functionality and integrations.*