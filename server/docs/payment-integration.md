# Payment Gateway Integration

This document outlines how to integrate and configure payment gateways in the ATScribe application.

## Overview

The application supports two payment gateways:
1. Razorpay - For Indian users (INR payments)
2. Stripe - For global users (USD payments)

The system automatically selects the appropriate payment gateway based on the user's billing address country.

## Configuration

### Environment Variables

Add the following environment variables to your `.env` file:

```
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxx
```

### Database Migration

Run the database migration to create the user_billing_details table:

```
psql -h localhost -U your_username -d your_database_name -f server/migrations/012_create_user_billing_details_table.sql
```

## Implementation Details

### Payment Flow

1. User selects a subscription plan
2. The system redirects to the checkout page with plan details
3. User enters billing information (determines which payment gateway will be used)
4. The appropriate payment gateway is initialized based on the user's country
5. Payment intent/order is created on the payment gateway
6. User completes payment
7. Payment is verified and subscription is created
8. User is redirected to the success page

### Payment Gateway Service

The `payment-gateways.ts` service provides an interface for interacting with different payment gateways through a common API. It uses a factory pattern to create the appropriate payment gateway instance based on user's region.

```typescript
// Sample code to get a payment gateway
const gateway = await getPaymentGatewayForUser(userId);
const paymentIntent = await gateway.createPaymentIntent(amount, currency, metadata);
```

### Webhook Handling

The application provides webhook endpoints for both payment gateways:

- Razorpay: `/api/webhooks/razorpay`
- Stripe: `/api/webhooks/stripe`

These endpoints process events from payment gateways such as payment confirmations, subscription updates, and refunds.

## Frontend Integration

### Razorpay

To integrate Razorpay on the frontend:

```javascript
// Initialize Razorpay
const options = {
  key: RAZORPAY_KEY_ID,
  amount: orderAmount,
  currency: 'INR',
  name: 'ATScribe',
  description: 'Subscription Payment',
  order_id: orderId,
  handler: function(response) {
    // Verify payment on server
    verifyPayment(response.razorpay_payment_id, response.razorpay_signature);
  }
};

const rzp = new Razorpay(options);
rzp.open();
```

### Stripe

To integrate Stripe on the frontend:

```javascript
// Initialize Stripe
const stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
const elements = stripe.elements();

// Create payment element
const paymentElement = elements.create('payment');
paymentElement.mount('#payment-element');

// Handle form submission
const form = document.getElementById('payment-form');
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  
  const {error} = await stripe.confirmPayment({
    elements,
    confirmParams: {
      return_url: 'https://your-website.com/payment-success',
    },
  });

  if (error) {
    // Handle error
  }
});
```

## Testing

### Test Cards

#### Razorpay Test Cards
- Card Number: 4111 1111 1111 1111
- Expiry: Any future date
- CVV: Any 3 digits
- Name: Any name

#### Stripe Test Cards
- Card Number: 4242 4242 4242 4242
- Expiry: Any future date
- CVV: Any 3 digits
- ZIP: Any valid postal code

### Webhook Testing

For local development, use a tool like ngrok to expose your local server to the internet for webhook testing:

```
ngrok http 3000
```

Update your webhook URLs in the Razorpay and Stripe dashboards with your ngrok URL. 