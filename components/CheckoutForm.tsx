import React, { useEffect, useState } from 'react';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useUTM } from '@/hooks/useUTM';
import { trackEvent } from '@/lib/utils';
import { sendClientSideConversionToUtmfy, retryFailedUtmfyConversions } from '@/lib/clientSideUtmfy';

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
  const [isComplete, setIsComplete] = useState(false);
  const { utmParams, isLoaded } = useUTM();

  // Função para lidar com a conclusão do checkout
  const handleCheckoutComplete = async () => {
    console.log('🎉 Pagamento concluído com sucesso!');
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
  };

  useEffect(() => {
    // Aguarda os UTMs serem carregados antes de fazer a requisição
    if (!isLoaded) {
      console.log('⏳ Aguardando UTMs serem carregados...');
      return;
    }
    
    console.log('🔄 CheckoutForm: Starting request to create session');
    console.log('📦 Items sent:', items);
    console.log('🎯 UTMs sent:', utmParams);
    
    // Create PaymentIntent as soon as the page loads
    fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, utmParams }),
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
      </div>
    );
  }

  return (
    <div id="checkout">
      {clientSecret ? (
        <EmbeddedCheckoutProvider
          stripe={stripePromise}
          options={{
            clientSecret,
            onComplete: handleCheckoutComplete
          }}
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