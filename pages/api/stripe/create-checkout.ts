import { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '@/lib/stripe';

interface CartItem {
  stripeId: string;
  quantity: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { items, utm_campaign }: { items: CartItem[], utm_campaign: string | null } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items são obrigatórios' });
    }

    // Verificar se todos os itens têm stripeId
    const invalidItems = items.filter(item => !item.stripeId);
    if (invalidItems.length > 0) {
      return res.status(400).json({ 
        error: 'Alguns itens não têm ID do Stripe',
        details: invalidItems
      });
    }

    // Criar linha de itens para o Stripe
    const lineItems = items.map(item => ({
      price: item.stripeId,
      quantity: item.quantity
    }));

    // Criar sessão de checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.headers.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/checkout/cancel`,
      metadata: {
        utm_campaign: utm_campaign || ''
      }
    });

    return res.status(200).json({ checkoutUrl: session.url });

  } catch (error) {
    console.error('❌ Erro:', error);
    return res.status(500).json({ 
      error: 'Erro interno',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}