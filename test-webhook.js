// Usando fetch nativo do Node.js (disponível a partir da versão 18)

// Evento de teste do Stripe - checkout.session.completed
const testEvent = {
  "id": "evt_1SIrVSRtUrajYj2bJFlmLfeD",
  "object": "event",
  "api_version": "2025-09-30.clover",
  "created": 1760622374,
  "data": {
    "object": {
      "id": "cs_live_a1y5Vcd4qAOybMrB3POrSh4W4VhXiSOqWqrlnNaVIF9FCrL0mTf0t8bs37",
      "object": "checkout.session",
      "amount_subtotal": 4999,
      "amount_total": 4999,
      "currency": "gbp",
      "customer_details": {
        "address": {
          "city": "Swansea",
          "country": "GB",
          "line1": "17 Beechwood Road Uplands",
          "postal_code": "SA2 0HL"
        },
        "email": "drserven1@gmail.com",
        "name": "Nana Poku"
      },
      "payment_status": "paid",
      "status": "complete"
    }
  },
  "livemode": true,
  "type": "checkout.session.completed"
};

async function testWebhook() {
  try {
    console.log('🧪 Testando webhook do Stripe...');
    
    const response = await fetch('http://localhost:3001/api/stripe/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-test-webhook': 'true'
      },
      body: JSON.stringify(testEvent)
    });

    const result = await response.text();
    
    console.log('Status:', response.status);
    console.log('Response:', result);
    
    if (response.ok) {
      console.log('✅ Webhook funcionou corretamente!');
    } else {
      console.log('❌ Erro no webhook:', result);
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar webhook:', error.message);
  }
}

testWebhook();