import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orderData } = req.body;

  if (!orderData) {
    return res.status(400).json({ error: 'Order data is required' });
  }

  try {
    // Configurações do Shopify (você precisará configurar essas variáveis de ambiente)
    const shopifyStore = process.env.SHOPIFY_STORE_URL;
    const shopifyAccessToken = process.env.SHOPIFY_ACCESS_TOKEN;
    const shopifyApiVersion = process.env.SHOPIFY_API_VERSION || '2023-10';

    if (!shopifyStore || !shopifyAccessToken) {
      console.warn('⚠️ Credenciais do Shopify não configuradas');
      return res.status(500).json({ 
        error: 'Shopify credentials not configured',
        message: 'Please set SHOPIFY_STORE_URL and SHOPIFY_ACCESS_TOKEN environment variables'
      });
    }

    // Preparar dados do pedido para Shopify
    const shopifyOrder = {
      order: {
        email: orderData.customer.email,
        financial_status: orderData.payment_status === 'paid' ? 'paid' : 'pending',
        fulfillment_status: null,
        send_receipt: true,
        send_fulfillment_receipt: false,
        note: `Pedido criado via Stripe - Session ID: ${orderData.stripe_session_id}`,
        note_attributes: [
          {
            name: 'stripe_session_id',
            value: orderData.stripe_session_id
          },
          {
            name: 'payment_intent_id',
            value: orderData.payment_intent_id || ''
          },
          // UTM Parameters
          {
            name: 'utm_source',
            value: orderData.utm_params.utm_source || ''
          },
          {
            name: 'utm_medium',
            value: orderData.utm_params.utm_medium || ''
          },
          {
            name: 'utm_campaign',
            value: orderData.utm_params.utm_campaign || ''
          },
          {
            name: 'utm_content',
            value: orderData.utm_params.utm_content || ''
          },
          {
            name: 'utm_term',
            value: orderData.utm_params.utm_term || ''
          }
        ],
        customer: {
          first_name: orderData.customer.name?.split(' ')[0] || '',
          last_name: orderData.customer.name?.split(' ').slice(1).join(' ') || '',
          email: orderData.customer.email,
          phone: orderData.customer.phone,
        },
        billing_address: orderData.customer.address ? {
          first_name: orderData.customer.name?.split(' ')[0] || '',
          last_name: orderData.customer.name?.split(' ').slice(1).join(' ') || '',
          address1: orderData.customer.address.line1 || '',
          address2: orderData.customer.address.line2 || '',
          city: orderData.customer.address.city || '',
          province: orderData.customer.address.state || '',
          country: orderData.customer.address.country || '',
          zip: orderData.customer.address.postal_code || '',
        } : undefined,
        shipping_address: orderData.customer.address ? {
          first_name: orderData.customer.name?.split(' ')[0] || '',
          last_name: orderData.customer.name?.split(' ').slice(1).join(' ') || '',
          address1: orderData.customer.address.line1 || '',
          address2: orderData.customer.address.line2 || '',
          city: orderData.customer.address.city || '',
          province: orderData.customer.address.state || '',
          country: orderData.customer.address.country || '',
          zip: orderData.customer.address.postal_code || '',
        } : undefined,
        line_items: orderData.line_items.map((item: any) => ({
          title: item.product_name,
          quantity: item.quantity,
          price: (item.amount_total / 100).toFixed(2), // Converter de centavos para reais
          sku: item.price_id, // Usar price_id do Stripe como SKU
          product_id: null, // Será mapeado posteriormente se necessário
          variant_id: null, // Será mapeado posteriormente se necessário
        })),
        currency: orderData.currency.toUpperCase(),
        total_price: (orderData.amount_total / 100).toFixed(2),
        subtotal_price: (orderData.amount_total / 100).toFixed(2),
        total_tax: '0.00',
        taxes_included: false,
        processed_at: new Date(orderData.created * 1000).toISOString(),
      }
    };

    console.log('📦 Preparando pedido para Shopify:', {
      session_id: orderData.stripe_session_id,
      customer_email: orderData.customer.email,
      total_amount: orderData.amount_total,
      utm_source: orderData.utm_params.utm_source,
      line_items_count: orderData.line_items.length
    });

    // Enviar pedido para Shopify
    const shopifyResponse = await fetch(`${shopifyStore}/admin/api/${shopifyApiVersion}/orders.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': shopifyAccessToken,
      },
      body: JSON.stringify(shopifyOrder),
    });

    if (!shopifyResponse.ok) {
      const errorData = await shopifyResponse.text();
      console.error('❌ Erro ao criar pedido no Shopify:', {
        status: shopifyResponse.status,
        statusText: shopifyResponse.statusText,
        error: errorData
      });
      
      return res.status(shopifyResponse.status).json({
        error: 'Failed to create order in Shopify',
        details: errorData,
        shopify_status: shopifyResponse.status
      });
    }

    const shopifyOrderData = await shopifyResponse.json();
    
    console.log('✅ Pedido criado no Shopify com sucesso:', {
      shopify_order_id: shopifyOrderData.order?.id,
      stripe_session_id: orderData.stripe_session_id,
      order_number: shopifyOrderData.order?.order_number
    });

    return res.status(200).json({
      success: true,
      shopify_order: shopifyOrderData.order,
      stripe_session_id: orderData.stripe_session_id
    });

  } catch (error: any) {
    console.error('❌ Erro ao processar pedido para Shopify:', error);
    return res.status(500).json({ 
      error: 'Failed to process order',
      message: error.message 
    });
  }
}