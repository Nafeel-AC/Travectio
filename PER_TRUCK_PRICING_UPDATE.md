# Per-Truck Pricing Update Summary

## Overview
Updated Travectio's pricing model from tiered plans to a simple **$24.99 per truck per month** pricing structure, matching the Stripe integration examples provided.

## Changes Made

### 1. Database Schema Updates
- **File**: `supabase-schema.sql`
- **Changes**:
  - Updated pricing plans to use single "per-truck" plan
  - Set `pricePerTruck` to $24.99
  - Removed tiered pricing (starter/growth/enterprise)
  - Updated helper functions to use per-truck calculations

### 2. Database Migration
- **File**: `update-to-per-truck-pricing.sql`
- **Purpose**: Migration script to update existing data
- **Actions**:
  - Updates existing pricing plans
  - Migrates existing subscriptions to new pricing
  - Verifies data integrity

### 3. Frontend UI Updates
- **File**: `src/pages/pricing.tsx`
- **Changes**:
  - Simplified to single pricing plan display
  - Updated header to "Simple, Transparent Pricing"
  - Shows $24.99/truck/month prominently
  - Displays total cost calculation (trucks × $24.99)
  - Updated FAQ section for per-truck model
  - Removed tiered plan selection logic

### 4. Frontend Logic Updates
- **File**: `src/hooks/useSubscription.ts`
- **Changes**:
  - Updated default plans to single per-truck plan
  - Simplified pricing calculation logic
  - Updated plan recommendation logic
  - Removed tiered pricing complexity

### 5. Stripe Integration Updates
- **File**: `supabase/functions/create-checkout-session/index.ts`
- **Changes**:
  - Simplified to always use per-truck pricing
  - Updated product name to "Travectio Subscription"
  - Set quantity to truck count
  - Removed tiered pricing logic

- **File**: `supabase/functions/stripe-webhooks/index.ts`
- **Changes**:
  - Updated subscription amount calculation
  - Simplified to per-truck pricing only

### 6. Documentation Updates
- **File**: `STRIPE_SETUP_GUIDE.md`
- **Changes**:
  - Updated Stripe product setup instructions
  - Simplified to single product configuration

## Pricing Examples
- **5 trucks**: $124.95/month (5 × $24.99)
- **12 trucks**: $299.88/month (12 × $24.99)
- **50 trucks**: $1,249.50/month (50 × $24.99)

## Key Features
1. **Simple Pricing**: One price per truck, no tiers
2. **Scalable**: Add/remove trucks anytime
3. **Transparent**: Clear cost calculation
4. **Flexible**: No minimum/maximum truck limits
5. **Automatic Billing**: Stripe handles recurring payments

## Migration Steps
1. Run `update-to-per-truck-pricing.sql` in Supabase
2. Deploy updated Edge Functions
3. Update Stripe product configuration
4. Test payment flow end-to-end

## Benefits
- **Simplified UX**: No complex plan selection
- **Predictable Costs**: Easy to calculate monthly fees
- **Better Conversion**: Clear, simple pricing
- **Easier Management**: Single pricing model to maintain
- **Stripe Optimized**: Matches Stripe's per-unit billing model

## Testing
- Verify pricing calculations are correct
- Test subscription creation with different truck counts
- Confirm webhook handling works properly
- Validate UI displays correct pricing
- Test truck count changes update billing correctly
