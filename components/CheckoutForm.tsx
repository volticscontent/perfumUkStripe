import React, { useEffect, useState } from 'react';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Make sure to call loadStripe outside of a component's render to avoid
// recreating the Stripe object on every render.
// This is your test publishable API key.
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface CheckoutFormProps {
  items: any[];
}

export default function CheckoutForm({ items }: CheckoutFormProps) {
  const [clientSecret, setClientSecret] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('🔄 CheckoutForm: Starting request to create session');
    console.log('📦 Items sent:', items);
    
    // Create PaymentIntent as soon as the page loads
    fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    })
      .then((res) => {
        console.log('📡 Response received:', res.status);
        return res.json();
      })
      .then((data) => {
        console.log('📄 Response data:', data);
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else if (data.error) {
          setError(data.error);
        }
      })
      .catch((err) => {
        console.error('❌ Request error:', err);
        setError('Error connecting to server');
      });
  }, [items]);

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-800">Error: {error}</p>
      </div>
    );
  }

  return (
    <div id="checkout">
      {clientSecret ? (
        <EmbeddedCheckoutProvider
          stripe={stripePromise}
          options={{clientSecret}}
        >
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      ) : (
        <div className="p-4 text-center">
          <p>Loading checkout...</p>
        </div>
      )}
    </div>
  );
}