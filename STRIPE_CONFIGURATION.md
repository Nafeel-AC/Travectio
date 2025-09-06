# Stripe Configuration for Beta Trial

## 🎯 **Quick Setup Checklist**

### **Step 1: Create Stripe Product with Trial**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Products** → **Create Product**
3. **Product Name**: `Travectio Subscription`
4. **Description**: `Fleet management per truck`
5. **Pricing**: 
   - Amount: `$24.99`
   - Billing: `Monthly`
   - **Trial period**: `Ends on October 16, 2025`
6. **Save** and copy the **Price ID** (starts with `price_`)

### **Step 2: Update Your Code**
Replace `price_YOUR_STRIPE_PRICE_ID_HERE` in `supabase/functions/create-checkout-session/index.ts` with your actual Price ID.

### **Step 3: Deploy**
```bash
supabase functions deploy create-checkout-session
```

---

## 🔧 **Current Configuration**

**File**: `supabase/functions/create-checkout-session/index.ts`  
**Line**: 108  
**Current Value**: `price_YOUR_STRIPE_PRICE_ID_HERE`  
**Action Needed**: Replace with your actual Stripe Price ID

---

## ✅ **What This Achieves**

- ✅ **Free beta trial** until October 16, 2025
- ✅ **No payments charged** during trial period
- ✅ **Automatic billing** starts on trial end date
- ✅ **Professional customer experience** with clear trial information
- ✅ **Easy management** through Stripe dashboard

---

## 🚨 **Important Notes**

1. **Test First**: Use Stripe test mode to verify everything works
2. **Price ID**: Must be from the same Stripe account as your secret key
3. **Trial Date**: Set in Stripe dashboard, not in code
4. **Customer Experience**: They'll see "Trial until Oct 16, 2025" during checkout

---

## 🔍 **Verification Steps**

After setup, test with:
1. **Test Card**: `4242 4242 4242 4242`
2. **Expected Result**: 
   - Checkout shows trial information
   - No immediate charge
   - Subscription created in database
   - Trial status visible in Stripe dashboard
