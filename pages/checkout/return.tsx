import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useCart } from '@/contexts/CartContext';
import Head from 'next/head';

export default function CheckoutReturn() {
  const router = useRouter();
  const { session_id } = router.query;
  const { clearCart } = useCart();
  const [status, setStatus] = useState(null);
  const [customerEmail, setCustomerEmail] = useState('');

  useEffect(() => {
    if (session_id) {
      fetch(`/api/stripe/session-details?session_id=${session_id}`)
        .then((res) => res.json())
        .then((data) => {
          setStatus(data.status);
          setCustomerEmail(data.customer_email);
          if (data.status === 'complete') {
             clearCart();
          }
        });
    }
  }, [session_id]);

  if (status === 'open') {
    return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <p>Payment not completed. Redirecting...</p>
            {/* Logic to redirect back to checkout if needed */}
        </div>
    );
  }

  if (status === 'complete') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Head>
            <title>Order Confirmed | Perfumes UK</title>
        </Head>
        <div className="text-center p-8 max-w-md">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
            </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Thank you for your order!
          </h1>
          <p className="text-gray-600 mb-8">
            A confirmation email has been sent to {customerEmail}.
          </p>
          <a
            href="/"
            className="bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition-colors inline-block"
          >
            Continue Shopping
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
    </div>
  );
}
