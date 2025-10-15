import { loadStripe } from '@stripe/stripe-js';
import Stripe from 'stripe';

// Inicializa o cliente Stripe no lado do servidor
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-10-16',
});

// Inicializa o cliente Stripe no lado do navegador
export const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string);