import { stripe } from '@/lib/stripe';

export default async function handler(req, res) {
  console.log('🚀 Endpoint create-checkout-session chamado');
  
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    console.log('✅ Stripe importado com sucesso:', !!stripe);
    
    const { items } = req.body;

    console.log('📦 Items recebidos:', JSON.stringify(items, null, 2));

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items are required' });
    }

    // Convert cart items to Stripe line items
    const lineItems = items.map(item => {
      console.log('🔍 Processando item:', item);
      
      if (!item.stripeId) {
        console.error('❌ Stripe ID não encontrado para item:', item);
        throw new Error(`Stripe ID not found for item: ${item.title}`);
      }
      
      return {
        price: item.stripeId,
        quantity: item.quantity || 1,
      };
    });

    console.log('💳 Line items para Stripe:', JSON.stringify(lineItems, null, 2));

    // Create Checkout Sessions from body params.
    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded',
      line_items: lineItems,
      mode: 'payment',
      return_url: `${req.headers.origin}/return?session_id={CHECKOUT_SESSION_ID}`,
    });

    console.log('✅ Sessão criada com sucesso:', session.id);
    res.send({clientSecret: session.client_secret});
  } catch (err) {
    console.error('❌ Erro no create-checkout-session:', err);
    res.status(err.statusCode || 500).json({ 
      error: err.message || 'Internal server error',
      details: err.stack
    });
  }
}