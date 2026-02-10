import { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '@/lib/stripe';

interface CartItem {
  stripeId?: string;
  quantity: number;
  title: string;
  image: string;
  price: number;
  handle: string;
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

    const origin = req.headers.origin || 'https://theperfumeuk.shop';

    // Criar linha de itens para o Stripe usando price_data
    const lineItems = items.map(item => {
      // Validar preço - Forçar 49.90 para todos os itens conforme regra de negócio (rollback)
      const price = 49.90;
      // const price = Number(item.price);
      // if (isNaN(price) || price <= 0) {
      //   console.warn(`Preço inválido para o item ${item.title}: ${item.price}. Usando fallback 49.90`);
      // }
      const finalPrice = 49.90;

      // Garantir URL absoluta para imagem
      let imageUrl = item.image;
      if (imageUrl && !imageUrl.startsWith('http')) {
        // Se for localhost, não enviar imagem para evitar erro do Stripe
        if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
          imageUrl = '';
        } else {
          imageUrl = `${origin}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
        }
      }

      return {
        price_data: {
          currency: 'gbp',
          product_data: {
            name: '3 Luxury Perfumes – Exclusive Online Kit',
            description: 'Elegant Rose & Bergamot, Mysterious Oud & Vanilla, Fresh Citrus & Cedar',
            images: imageUrl ? [imageUrl] : [],
            metadata: {
              handle: item.handle,
              originalStripeId: item.stripeId || ''
            }
          },
          unit_amount: Math.round(finalPrice * 100), // Converter para centavos
        },
        quantity: item.quantity
      };
    });

    // Criar sessão de checkout
    // @ts-ignore - automatic_payment_methods existe na API mas o TS pode estar desatualizado
    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: 'payment',
      ui_mode: 'embedded',
      return_url: `${origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
      shipping_address_collection: {
        allowed_countries: ['GB'],
      },
      payment_method_types: ['card'],
      metadata: {
        utm_campaign: utm_campaign || ''
      }
    } as any);

    return res.status(200).json({ clientSecret: session.client_secret });

  } catch (error) {
    console.error('❌ Erro:', error);
    return res.status(500).json({ 
      error: 'Erro interno',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}
