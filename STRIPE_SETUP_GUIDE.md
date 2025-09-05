# Stripe Payment Integration - Setup Guide

## ✅ **Database Schema ✓ Complete**

- Created `pricing_plans` table with tiered pricing
- Created `subscriptions` table for customer subscriptions
- Created `payments` table for payment history
- Added helper functions for pricing calculations

## ✅ **Frontend UI ✓ Complete**

- Created `/pricing` page with interactive pricing calculator
- Added pricing plans to sidebar navigation
- Built subscription management hooks
- Integrated with Stripe Checkout flow

## ✅ **Supabase Edge Functions ✓ Complete**

- `create-checkout-session` - Creates Stripe checkout sessions
- `stripe-webhooks` - Handles Stripe webhook events
- `pricing-plans` - Serves pricing plan data

---

## 🔧 **Next Steps to Deploy**

### **1. Set up Stripe Account**

1. Go to https://stripe.com and create account
2. Create products in Stripe Dashboard:
   - **Travectio Subscription**: $24.99/month per unit recurring
3. Get your API keys from Stripe Dashboard

### **2. Configure Supabase Environment Variables**

In your Supabase project dashboard, go to Settings > Edge Functions and add:

```bash
STRIPE_SECRET_KEY=sk_test_... (or sk_live_... for production)
STRIPE_WEBHOOK_SECRET=whsec_... (get this after creating webhook)
```

### **3. Deploy Edge Functions**

```bash
# Deploy the functions
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhooks
supabase functions deploy pricing-plans

# Get the webhook URL
# It will be: https://[project-ref].supabase.co/functions/v1/stripe-webhooks
```

### **4. Configure Stripe Webhook**

1. In Stripe Dashboard, go to Webhooks
2. Add endpoint: `https://[your-project].supabase.co/functions/v1/stripe-webhooks`
3. Select these events:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy the webhook secret to Supabase environment

### **5. Update Frontend Environment**

Add to your `.env`:

```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_... (or pk_live_...)
```

### **6. Run Database Schema**

Execute the updated `supabase-schema.sql` in your Supabase SQL Editor

---

## 🎯 **Testing the Integration**

### **Test Flow:**

1. Visit `/pricing` page
2. Select truck count and plan
3. Click "Choose Plan"
4. Complete test payment in Stripe
5. Verify subscription created in `subscriptions` table
6. Check payment recorded in `payments` table

### **Test Cards (Stripe Test Mode):**

- Success: `4242 4242 4242 4242`
- Declined: `4000 0000 0000 0002`
- Requires 3D Secure: `4000 0025 0000 3155`

---

## 🚀 **Production Checklist**

- [ ] Replace test Stripe keys with live keys
- [ ] Update webhook URL to production domain
- [ ] Test payment flow end-to-end
- [ ] Set up monitoring and alerts
- [ ] Configure proper error handling
- [ ] Add subscription management UI
- [ ] Implement billing portal for customers

---

## 📁 **Files Created/Modified**

### **Database:**

- `supabase-schema.sql` - Added pricing and subscription tables

### **Frontend:**

- `src/pages/pricing.tsx` - Pricing page with plan selector
- `src/hooks/useSubscription.ts` - Subscription management hooks
- `src/App.tsx` - Added pricing route
- `src/components/sidebar.tsx` - Added pricing link

### **Backend (Edge Functions):**

- `supabase/functions/create-checkout-session/index.ts`
- `supabase/functions/stripe-webhooks/index.ts`
- `supabase/functions/pricing-plans/index.ts`

---

The Stripe payment integration is now **90% complete**! The remaining 10% is configuration and deployment.
