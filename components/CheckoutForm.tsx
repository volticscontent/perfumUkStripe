import React, { useEffect, useState } from 'react';
import {
  Elements,
  PaymentElement,
  AddressElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useUTM } from '@/hooks/useUTM';
import { trackEvent } from '@/lib/utils';
import { sendClientSideConversionToUtmfy, retryFailedUtmfyConversions } from '@/lib/clientSideUtmfy';
import { Button } from "@/components/ui/button";

// Make sure to call loadStripe outside of a component's render to avoid
// recreating the Stripe object on every render.
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface CheckoutFormProps {
  items: any[];
}

const PaymentForm = ({ items, utmParams, onComplete }: { items: any[], utmParams: any, onComplete: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!stripe) {
      return;
    }

    const clientSecret = new URLSearchParams(window.location.search).get(
      "payment_intent_client_secret"
    );

    if (!clientSecret) {
      return;
    }

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      switch (paymentIntent?.status) {
        case "succeeded":
          setMessage("Payment succeeded!");
          onComplete();
          break;
        case "processing":
          setMessage("Your payment is processing.");
          break;
        case "requires_payment_method":
          setMessage("Your payment was not successful, please try again.");
          break;
        default:
          setMessage("Something went wrong.");
          break;
      }
    });
  }, [stripe]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Make sure to change this to your payment completion page
        return_url: `${window.location.origin}/checkout/success`,
      },
      redirect: 'if_required',
    });

    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        setMessage(error.message || "An unexpected error occurred.");
      } else {
        setMessage("An unexpected error occurred.");
      }
      setIsLoading(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      // Manual handling if no redirect needed
      onComplete();
      setIsLoading(false); // Stop loading, show success
    } else {
      setIsLoading(false);
    }
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-xl font-semibold mb-4">Shipping Information</h3>
        <AddressElement options={{ mode: 'shipping' }} />
        
        <h3 className="text-xl font-semibold mb-4 mt-6">Payment Method</h3>
        <PaymentElement id="payment-element" options={{ layout: "tabs" }} />
      </div>

      <Button 
        disabled={isLoading || !stripe || !elements} 
        id="submit"
        className="w-full mt-6 bg-black hover:bg-gray-800 text-white py-3 text-lg font-bold"
      >
        <span id="button-text">
          {isLoading ? "Processing..." : "Pay Now"}
        </span>
      </Button>
      
      {message && <div id="payment-message" className="text-red-500 mt-4 text-center">{message}</div>}
    </form>
  );
}

export default function CheckoutForm({ items }: CheckoutFormProps) {
  const [clientSecret, setClientSecret] = useState('');
  const [error, setError] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const { utmParams, isLoaded } = useUTM();

  // Função para lidar com a conclusão do checkout
  const handleCheckoutComplete = async () => {
    setIsComplete(true);
    
    // Calcular valor total dos itens
    const totalValue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Preparar dados da compra
    const purchaseData = {
      value: totalValue,
      currency: 'GBP',
      content_ids: items.map(item => item.id),
      content_type: 'product',
      contents: items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        item_price: item.price
      })),
      num_items: items.reduce((sum, item) => sum + item.quantity, 0),
      // Incluir UTM parameters
      ...utmParams
    };
    
    // Disparar evento Purchase para Meta Ads e TikTok
    trackEvent('Purchase', purchaseData);
    
    // Enviar conversão para UTMify via client-side como backup
    try {
      await sendClientSideConversionToUtmfy(items, totalValue, utmParams);
      console.log('✅ Conversão enviada para UTMify (client-side)');
    } catch (error) {
      console.error('❌ Erro ao enviar conversão para UTMify (client-side):', error);
    }
    
    // Tentar reenviar conversões anteriores que falharam
    try {
      await retryFailedUtmfyConversions();
    } catch (error) {
      console.error('❌ Erro ao tentar reenviar conversões UTMify:', error);
    }

    // Opcional: Redirecionar para página de sucesso se não estiver usando redirect do Stripe
    // mas aqui estamos apenas mostrando a mensagem de sucesso
    window.location.href = '/checkout/success';
  };

  useEffect(() => {
    // Aguarda os UTMs serem carregados antes de fazer a requisição
    if (!isLoaded) {
      return;
    }
    
    // Create PaymentIntent as soon as the page loads
    fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, utmParams }),
    })
      .then((res) => {
        return res.json();
      })
      .then((data) => {
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
  }, [items, isLoaded, utmParams]);

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-800">Error: {error}</p>
      </div>
    );
  }

  // Se o checkout foi concluído, mostrar mensagem de sucesso
  if (isComplete) {
    return (
      <div className="p-8 text-center bg-green-50 border border-green-200 rounded-md">
        <div className="text-green-600 text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-green-800 mb-2">Pagamento Confirmado!</h2>
        <p className="text-green-700">Seu pedido foi processado com sucesso.</p>
        <p className="text-sm text-gray-500 mt-2">Redirecionando...</p>
      </div>
    );
  }

  return (
    <div id="checkout" className="bg-white p-6 rounded-lg shadow-sm">
      {clientSecret ? (
        <Elements options={{ clientSecret, appearance: { theme: 'stripe' } }} stripe={stripePromise}>
          <PaymentForm items={items} utmParams={utmParams} onComplete={handleCheckoutComplete} />
        </Elements>
      ) : (
        <div className="p-4 text-center">
          <p>Loading checkout...</p>
        </div>
      )}
    </div>
  );
}
