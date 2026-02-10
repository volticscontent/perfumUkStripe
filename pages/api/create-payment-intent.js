import { stripe } from '@/lib/stripe';

export default async function handler(req, res) {
  console.log('🚀 Endpoint create-payment-intent chamado');
  
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const { items, utmParams } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items are required' });
    }

    // Calculate total amount based on fixed price of £59.90
    const totalAmount = items.reduce((sum, item) => {
      return sum + ((item.quantity || 1) * 5990); // 5990 cents = £59.90
    }, 0);

    console.log('💰 Total amount calculated:', totalAmount);

    // Preparar metadata com UTMs se disponíveis
    const metadata = {};
    if (utmParams) {
      if (utmParams.utm_source) metadata.utm_source = utmParams.utm_source;
      if (utmParams.utm_medium) metadata.utm_medium = utmParams.utm_medium;
      if (utmParams.utm_campaign) metadata.utm_campaign = utmParams.utm_campaign;
      if (utmParams.utm_term) metadata.utm_term = utmParams.utm_term;
      if (utmParams.utm_content) metadata.utm_content = utmParams.utm_content;
    }

    // Add items summary to metadata
    try {
        const itemsSummary = items.map(i => `${i.id || 'unknown'}:${i.quantity || 1}`).join(',');
        metadata.items_summary = itemsSummary.substring(0, 499); // Limit to 500 chars
    } catch (e) {
        console.error('Error adding items to metadata:', e);
    }

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'gbp',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: metadata,
    });

    console.log('✅ PaymentIntent criado:', paymentIntent.id);

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    console.error('❌ Erro no create-payment-intent:', err);
    res.status(err.statusCode || 500).json({ 
      error: err.message || 'Internal server error',
      details: err.stack
    });
  }
}
