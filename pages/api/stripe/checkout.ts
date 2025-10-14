import { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '../../../lib/stripe';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { items, success_url, cancel_url, shipping_options, metadata } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ error: 'Pelo menos um item é necessário' });
    }

    // Importa os mapeamentos de IDs
    const stripeVariantMapping = require('../../../data/stripe_variant_mapping.json');
    const stripeProductMapping = require('../../../data/stripe_product_mapping.json');
    
    // Formata os itens para o formato esperado pelo Stripe
    const line_items = items.map((item: any) => {
      // Tenta obter o ID de preço do Stripe de várias maneiras
      let priceId = item.stripeId || item.price_id;
      
      // Se o ID não for um ID de preço do Stripe válido, tenta encontrar no mapeamento
      if (priceId && !priceId.startsWith('price_')) {
        // Tenta encontrar no mapeamento de variantes
        const variantPriceId = stripeVariantMapping[priceId];
        if (variantPriceId) {
          priceId = variantPriceId;
        } 
        // Tenta encontrar no mapeamento de produtos
        else if (priceId in stripeProductMapping) {
          priceId = stripeProductMapping[priceId].price_id;
        }
        // Se ainda não encontrou, tenta usar o ID como chave direta
        else if (item.id) {
          const idStr = item.id.toString();
          if (stripeVariantMapping[idStr]) {
            priceId = stripeVariantMapping[idStr];
          } else if (idStr in stripeProductMapping) {
            priceId = stripeProductMapping[idStr].price_id;
          }
        }
      }
      
      if (!priceId || !priceId.startsWith('price_')) {
        throw new Error(`ID de preço do Stripe inválido ou ausente: ${item.id || priceId || 'não fornecido'}`);
      }
      
      return {
        price: priceId,
        quantity: item.quantity,
      };
    });

    // Cria a sessão de checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: success_url || `${req.headers.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url || `${req.headers.origin}/checkout/cancel`,
      shipping_address_collection: {
        allowed_countries: ['GB'], // Países permitidos para entrega
      },
      shipping_options: shipping_options || [],
      metadata: metadata || {},
    });

    return res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Erro ao criar sessão de checkout:', error);
    return res.status(500).json({ error: error.message });
  }
}