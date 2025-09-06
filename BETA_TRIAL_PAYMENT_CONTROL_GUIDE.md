# Beta Trial Payment Control Guide - Travectio

## 🎯 **Your Goal: Free Beta Until 10/16/25**

You want to ensure that **no payments are charged** until **October 16, 2025**, giving you a free beta trial period. Here are the different approaches you can take:

---

## 🚀 **Approach 1: Stripe Trial Period (RECOMMENDED)**

This is the **easiest and most reliable** method. You control this entirely in your Stripe dashboard.

### **How It Works:**
- Customers can sign up and create subscriptions
- Stripe automatically delays the first payment until your specified date
- No code changes needed in your app
- Customers see "Trial until Oct 16, 2025" on their subscription

### **Steps to Set This Up:**

#### **1. In Your Stripe Dashboard:**
1. Go to **Products** → **Create Product**
2. Create product: "Travectio Subscription"
3. Set up pricing: $24.99/month recurring
4. **IMPORTANT**: In the pricing setup, look for **"Trial period"** option
5. Set trial period to end on **October 16, 2025**
6. Save the product

#### **2. Update Your Code (Minor Change):**
You'll need to use the Stripe Price ID instead of creating dynamic prices.

**Current Code (in `create-checkout-session/index.ts`):**
```typescript
const priceData = {
  price_data: {
    currency: 'usd',
    product_data: {
      name: 'Travectio Subscription',
      description: `Fleet management for ${truckCount} truck${truckCount > 1 ? 's' : ''}`,
    },
    unit_amount: unitAmount,
    recurring: {
      interval: 'month',
    },
  },
  quantity: truckCount,
}
```

**Updated Code:**
```typescript
const priceData = {
  price: 'price_1234567890', // Your Stripe Price ID from dashboard
  quantity: truckCount,
}
```

---

## 🔧 **Approach 2: Code-Based Trial Control**

This gives you more control but requires code changes.

### **How It Works:**
- Your app checks the current date
- If before 10/16/25, subscriptions are created but marked as "trial"
- After 10/16/25, normal billing begins

### **Implementation Steps:**

#### **1. Add Trial Logic to Your Code:**

**In `create-checkout-session/index.ts`:**
```typescript
// Add this at the top
const TRIAL_END_DATE = new Date('2025-10-16T00:00:00Z');

// In your checkout session creation:
const isTrialPeriod = new Date() < TRIAL_END_DATE;

const session = await stripe.checkout.sessions.create({
  customer: stripeCustomerId,
  payment_method_types: ['card'],
  line_items: [priceData],
  mode: 'subscription',
  success_url: `${req.headers.get('origin')}/pricing?success=true&session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${req.headers.get('origin')}/pricing?canceled=true`,
  metadata: {
    userId: user.id,
    planId: planId,
    truckCount: truckCount.toString(),
    isTrial: isTrialPeriod.toString(),
  },
  subscription_data: {
    metadata: {
      userId: user.id,
      planId: planId,
      truckCount: truckCount.toString(),
      isTrial: isTrialPeriod.toString(),
    },
    // If trial period, set trial end date
    ...(isTrialPeriod && {
      trial_end: Math.floor(TRIAL_END_DATE.getTime() / 1000)
    })
  },
})
```

#### **2. Update Your Database Schema:**
Add a trial field to track trial status:

```sql
ALTER TABLE subscriptions ADD COLUMN "isTrial" BOOLEAN DEFAULT FALSE;
ALTER TABLE subscriptions ADD COLUMN "trialEndDate" TIMESTAMP WITH TIME ZONE;
```

---

## 🎛️ **Approach 3: Stripe Dashboard Control (SIMPLE)**

This is the **simplest** approach - you control everything from Stripe.

### **How It Works:**
- Keep your current code as-is
- In Stripe dashboard, you can pause/disable products
- On 10/16/25, you enable the product for billing

### **Steps:**
1. **Before 10/16/25**: Keep your Stripe product in "Draft" mode
2. **On 10/16/25**: Change product to "Active" mode
3. **Result**: No payments can be processed until you activate

---

## 📊 **Comparison of Approaches**

| Approach | Difficulty | Control | Reliability | Code Changes |
|----------|------------|---------|-------------|--------------|
| **Stripe Trial** | ⭐ Easy | ⭐⭐⭐ High | ⭐⭐⭐ Excellent | ⭐ Minor |
| **Code-Based** | ⭐⭐ Medium | ⭐⭐⭐⭐ Very High | ⭐⭐ Good | ⭐⭐ Moderate |
| **Dashboard Control** | ⭐ Very Easy | ⭐⭐ Medium | ⭐⭐⭐ Excellent | ⭐ None |

---

## 🎯 **RECOMMENDED SOLUTION**

**Use Approach 1 (Stripe Trial Period)** because:

✅ **No complex code changes**  
✅ **Stripe handles everything automatically**  
✅ **Customers see clear trial information**  
✅ **Easy to manage from Stripe dashboard**  
✅ **Most reliable and professional approach**

---

## 🔧 **Implementation Steps for Recommended Approach**

### **Step 1: Set Up Stripe Product with Trial**

1. **Log into your Stripe Dashboard**
2. **Go to Products** → **Create Product**
3. **Product Details:**
   - Name: "Travectio Subscription"
   - Description: "Fleet management per truck"
4. **Pricing:**
   - Price: $24.99
   - Billing: Monthly
   - **Trial period**: Set to end on October 16, 2025
5. **Save the product**
6. **Copy the Price ID** (starts with `price_`)

### **Step 2: Update Your Code**

**File: `supabase/functions/create-checkout-session/index.ts`**

Replace the dynamic price creation with:

```typescript
// Replace this section (around line 109-122):
const priceData = {
  price_data: {
    currency: 'usd',
    product_data: {
      name: 'Travectio Subscription',
      description: `Fleet management for ${truckCount} truck${truckCount > 1 ? 's' : ''}`,
    },
    unit_amount: unitAmount,
    recurring: {
      interval: 'month',
    },
  },
  quantity: truckCount,
}

// With this:
const priceData = {
  price: 'price_YOUR_STRIPE_PRICE_ID_HERE', // Replace with your actual Price ID
  quantity: truckCount,
}
```

### **Step 3: Test the Setup**

1. **Deploy your updated function**
2. **Test with Stripe test cards**
3. **Verify that:**
   - Checkout shows "Trial until Oct 16, 2025"
   - No immediate charge occurs
   - Subscription is created in your database

---

## 🚨 **Important Notes**

### **What Happens During Trial:**
- ✅ Customers can use all app features
- ✅ No payment is charged
- ✅ Subscription is active but in trial status
- ✅ Customer gets email notifications about trial

### **What Happens After Trial:**
- ✅ First payment is automatically charged on 10/16/25
- ✅ Regular monthly billing begins
- ✅ Customer receives invoice

### **Customer Experience:**
- They see "Trial until Oct 16, 2025" during checkout
- They receive trial confirmation emails
- They get notified before trial ends
- Billing begins automatically on the trial end date

---

## 🔍 **Monitoring Your Trial**

### **In Stripe Dashboard:**
- **Customers** → See all trial subscriptions
- **Subscriptions** → Filter by trial status
- **Analytics** → Track trial signups

### **In Your App:**
- Check `subscriptions` table for trial status
- Monitor signup rates during trial period
- Track feature usage during trial

---

## 🎉 **Summary**

**The easiest way to control when payments start is through Stripe's built-in trial period feature.** This requires minimal code changes and gives you complete control over when billing begins.

**Your action items:**
1. ✅ Set up Stripe product with trial period ending 10/16/25
2. ✅ Update your code to use the Stripe Price ID
3. ✅ Test the setup
4. ✅ Deploy and monitor

**Result:** Free beta trial until October 16, 2025, with automatic billing starting on that date.
