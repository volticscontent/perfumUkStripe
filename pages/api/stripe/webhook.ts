import { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'micro';
import Stripe from 'stripe';
import { stripe } from '../../../lib/stripe';
import { sendConversionToUtmfy, formatStripeToUtmfy } from '../../../utils/utmfy';

// Desabilita o parser de corpo padrão do Next.js
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const isTestMode = process.env.NODE_ENV === 'development' && req.headers['x-test-webhook'] === 'true';

  if (!webhookSecret && !isTestMode) {
    return res.status(500).json({ error: 'Webhook secret não configurado' });
  }

  let event: Stripe.Event;

  try {
    if (isTestMode) {
      // Modo de teste: aceita o evento diretamente sem validação de assinatura
      event = JSON.parse(buf.toString());
      console.log('🧪 Modo de teste ativado - pulando validação de assinatura');
    } else {
      // Verifica a assinatura do webhook
      if (!webhookSecret) {
        throw new Error('Webhook secret não configurado');
      }
      event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
    }
  } catch (err: any) {
    console.error(`Erro na assinatura do webhook: ${err.message}`);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // Processa os eventos
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Aqui você pode atualizar seu banco de dados, enviar emails, etc.
        console.log('Pagamento bem-sucedido:', session);
        
        // Enviar conversão para Utmfy
        if (session.payment_status === 'paid') {
          const conversionData = formatStripeToUtmfy(session, 'purchase');
          await sendConversionToUtmfy(conversionData);
        }
        
        // Exemplo: Atualizar status do pedido no banco de dados
        // await updateOrderStatus(session.metadata.orderId, 'paid');
        
        break;
        
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('PaymentIntent bem-sucedido:', paymentIntent);
        break;
        
      case 'payment_intent.payment_failed':
        const failedPaymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Falha no pagamento:', failedPaymentIntent);
        break;
        
      // Adicione outros eventos conforme necessário
      
      default:
        console.log(`Evento não tratado: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Erro ao processar webhook:', error);
    return res.status(500).json({ error: error.message });
  }
}