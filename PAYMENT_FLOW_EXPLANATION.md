# Travectio Payment Flow - Simple Explanation

## How Customers Pay for Your App

### What We're Selling
- **Product**: Travectio subscription service
- **Price**: $24.99 per truck per month
- **Example**: If a company has 5 trucks, they pay $124.95 per month (5 × $24.99)

---

## Step-by-Step Payment Process

### 1. Customer Wants to Subscribe
- Customer visits your website
- They see pricing: "$24.99 per truck per month"
- They enter how many trucks they want to track (e.g., 5 trucks)
- They click "Subscribe Now"

### 2. Payment Page
- Customer is taken to a secure payment page (handled by Stripe)
- They enter their credit card information
- They see the total: $124.95 per month for 5 trucks
- They complete the payment

### 3. Account Activation
- Payment is successful
- Customer is redirected back to your app
- Their account is now active and they can use all features
- They can start tracking their 5 trucks

### 4. Monthly Billing (Automatic)
- Every month on the same date, the customer is automatically charged $124.95
- No action needed from the customer
- Their service continues uninterrupted
- They receive an email receipt from Stripe

---

## What Happens When Customers Make Changes

### Adding More Trucks
- Customer decides they want to track 8 trucks instead of 5
- They go to their account settings and update truck count
- New monthly cost: 8 × $24.99 = $199.92
- They are charged the difference for the current month
- Next month they pay the full $199.92

### Removing Trucks
- Customer reduces from 8 trucks to 6 trucks
- New monthly cost: 6 × $24.99 = $149.94
- They get a credit for the difference
- Next month they pay $149.94

### Managing Their Account
- Customers can log into a billing portal
- They can:
  - Update their credit card
  - View past invoices
  - Download receipts
  - Cancel their subscription

---

## What Happens If Payment Fails

### Card Expired or Insufficient Funds
- Stripe tries to charge the customer's card
- If it fails, the customer gets an email notification
- They have a few days to update their payment method
- If they don't fix it, their account may be suspended
- Once they update their card, service resumes

---

## Customer Examples

### Small Company (5 trucks)
- Monthly cost: $124.95
- They pay once, then automatically charged every month

### Medium Company (12 trucks)
- Monthly cost: $299.88
- They pay once, then automatically charged every month

### Large Company (50 trucks)
- Monthly cost: $1,249.50
- They pay once, then automatically charged every month

---



## Summary

**The flow is simple:**
1. Customer chooses number of trucks
2. They pay once on a secure page
3. They're automatically charged every month
4. They can change truck count anytime
5. They can manage their own billing

**You handle the app features, Stripe handles all the payment processing.**
