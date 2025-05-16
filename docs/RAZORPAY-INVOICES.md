# Razorpay Invoice Tracking

This document describes the implementation of Razorpay invoice tracking in ProsumeAI to address the issue with subscription charges.

## Problem

Razorpay uses a two-step payment process for subscriptions:
1. An initial authentication charge ($0.50/₹1)
2. The actual subscription charge (full amount)

Our system was only properly tracking the authentication charge, leading to confusion when users only saw the $0.50 charge instead of the full subscription amount.

## Implementation

We've added functionality to fetch and track both charges:

### 1. New RazorpayGateway Method

Added a `fetchInvoicesForSubscription` method to the `RazorpayGateway` class that:
- Calls the Razorpay API to fetch all invoices for a subscription
- Processes each invoice to identify both authentication and subscription charges
- Records transactions in our database that weren't previously logged

### 2. Admin API Endpoint

Created a new admin endpoint to fetch subscription invoices:
```
GET /api/admin/subscription-invoices/:subscriptionId
```

This endpoint:
- Fetches detailed invoice information from Razorpay
- Returns both the Razorpay invoice data and our internal transaction records
- Helps administrators verify that both authentication and full subscription charges are properly tracked

### 3. Synchronization Utility

Added a command-line utility to sync all subscription invoices:
```
npm run sync-invoices
```

This will:
- Process all active Razorpay subscriptions
- Fetch and store any missing invoice transactions
- Ensure our database has complete records of all charges

## Usage

### For Support Staff

When investigating payment issues:

1. Check the user's subscription details in the admin panel
2. Use the subscription ID (in format `sub_XXXXXXXXXXXXXXX`) to fetch complete invoice history:
   ```
   GET /api/admin/subscription-invoices/sub_XXXXXXXXXXXXXXX
   ```
3. Verify both the authentication charge and the full subscription charge are present

### For Developers

To ensure all invoices are properly tracked:

1. Run the synchronization utility:
   ```
   npm run sync-invoices
   ```
2. Check the logs to see how many new transactions were recorded

## Technical Notes

- The Razorpay API endpoint used is: `/v1/invoices?subscription_id=:sub_id`
- We identify authentication charges vs. subscription charges based on amount (< $5 or ₹500 likely indicates an authentication charge)
- Webhook handling has been improved to track both types of charges
- The existing webhook handler processes `subscription.charged` events which now properly record the full subscription charge

## Future Improvements

- Add a dashboard view for admins to see all invoices for a subscription
- Add better notifications to users explaining the two-step charge process
- Consider updating the checkout UI to more clearly explain the authentication charge 