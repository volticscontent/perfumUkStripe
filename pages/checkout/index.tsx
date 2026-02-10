import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { useCart } from '@/contexts/CartContext';
import { useUTM } from '@/hooks/useUTM';
import Head from 'next/head';
import { useRouter } from 'next/router';

// Make sure to call loadStripe outside of a component’s render to avoid
// recreating the Stripe object on every render.
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string);

export default function CheckoutPage() {
  const { items, total } = useCart();
  const { utmParams } = useUTM();
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Create a Checkout Session as soon as the page loads
    if (items.length > 0 && !clientSecret && !loading) {
      setLoading(true);
      fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            items: items.map(item => ({
              stripeId: item.stripeId,
              quantity: item.quantity,
              title: item.title,
              image: item.image,
              price: item.price,
              handle: item.handle
            })),
            utm_campaign: utmParams.utm_campaign || null
        }),
      })
        .then((res) => res.json())
        .then((data) => {
            if (data.clientSecret) {
                setClientSecret(data.clientSecret);
            } else if (data.error) {
                setError(data.error);
                console.error("Error creating checkout session:", data);
            }
        })
        .catch(err => {
            setError("Failed to initialize checkout");
            console.error(err);
        })
        .finally(() => setLoading(false));
    }
  }, [items, utmParams]);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Head>
            <title>Empty Basket | Perfumes UK</title>
        </Head>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Your basket is empty
          </h1>
          <p className="text-gray-600 mb-8 px-2">
            Add some products to your basket to continue with checkout.
          </p>
          <a
            href="/"
            className="bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition-colors"
          >
            Back to shop
          </a>
        </div>
      </div>
    );
  }

  return (
    <div id="checkout" className="min-h-screen bg-gray-50 py-12">
      <Head>
        <title>Checkout | Perfumes UK</title>
      </Head>
      
      <div className="max-w-4xl mx-auto px-4">
        {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                <p>Error: {error}</p>
                <button onClick={() => router.push('/')} className="underline mt-2">Return to Home</button>
            </div>
        )}

        {clientSecret ? (
            <EmbeddedCheckoutProvider
            stripe={stripePromise}
            options={{ clientSecret }}
            >
            <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
        ) : (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
        )}
      </div>
    </div>
  );
}
