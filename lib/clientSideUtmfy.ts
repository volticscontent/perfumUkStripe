// Função para enviar conversões para UTMify via client-side
interface ClientSideUtmfyData {
  orderId: string;
  platform: string;
  paymentMethod: string;
  status: string;
  createdAt: string;
  approvedDate: string;
  customer: {
    name: string;
    email: string;
    phone: string | null;
    document: string | null;
  };
  trackingParameters: {
    utm_campaign: string | null;
    utm_content: string | null;
    utm_medium: string | null;
    utm_source: string | null;
    utm_term: string | null;
  };
  commission: {
    totalPriceInCents: number;
    gatewayFeeInCents: number;
    userCommissionInCents: number;
  };
  products: Array<{
    id: string;
    planId: string;
    planName: string;
    name: string;
    quantity: number;
    priceInCents: number;
  }>;
}

export async function sendClientSideConversionToUtmfy(
  items: any[],
  totalValue: number,
  utmParams: any
): Promise<boolean> {
  try {
    const now = new Date().toISOString();
    const orderId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Preparar dados no formato esperado pelo UTMify
    const conversionData: ClientSideUtmfyData = {
      orderId,
      platform: 'stripe_client',
      paymentMethod: 'credit_card',
      status: 'paid',
      createdAt: now,
      approvedDate: now,
      customer: {
        name: 'Cliente',
        email: localStorage.getItem('lead_email') || '',
        phone: null,
        document: null,
      },
      trackingParameters: {
        utm_campaign: utmParams.utm_campaign || null,
        utm_content: utmParams.utm_content || null,
        utm_medium: utmParams.utm_medium || null,
        utm_source: utmParams.utm_source || null,
        utm_term: utmParams.utm_term || null,
      },
      commission: {
        totalPriceInCents: Math.round(totalValue * 100), // Converter para centavos
        gatewayFeeInCents: Math.round(totalValue * 100 * 0.029), // Estimativa de 2.9%
        userCommissionInCents: Math.round(totalValue * 100) - Math.round(totalValue * 100 * 0.029), // Valor líquido real
      },
      products: items.map(item => ({
        id: item.id || 'perfume_001',
        planId: `plan_${item.id || 'perfume_001'}`,
        planName: item.name || 'Perfume Premium',
        name: item.name || 'Perfume',
        quantity: item.quantity || 1,
        priceInCents: Math.round((item.price || 0) * 100),
      })),
    };

    console.log('📤 Enviando conversão para UTMify (client-side):', conversionData);

    // Enviar via API route para evitar problemas de CORS
    const response = await fetch('/api/utmfy/client-conversion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(conversionData),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Conversão enviada para UTMify com sucesso (client-side):', result);
      return true;
    } else {
      const errorText = await response.text();
      console.error('❌ Erro ao enviar conversão para UTMify (client-side):', response.status, errorText);

      // Salvar no localStorage como fallback
      const fallbackData = {
        ...conversionData,
        timestamp: Date.now(),
        retry_count: 0
      };
      localStorage.setItem(`utmfy_fallback_${orderId}`, JSON.stringify(fallbackData));
      console.log('💾 Dados salvos no localStorage para retry posterior');

      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao processar conversão UTMify (client-side):', error);
    return false;
  }
}

// Função para tentar reenviar conversões salvas no localStorage
export async function retryFailedUtmfyConversions(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('utmfy_fallback_'));

    for (const key of keys) {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '{}');

        // Tentar reenviar apenas se não passou muito tempo (24h) e não tentou muitas vezes
        const isRecent = (Date.now() - data.timestamp) < 24 * 60 * 60 * 1000;
        const hasRetriesLeft = (data.retry_count || 0) < 3;

        if (isRecent && hasRetriesLeft) {
          const response = await fetch('/api/utmfy/client-conversion', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          });

          if (response.ok) {
            localStorage.removeItem(key);
            console.log('✅ Conversão UTMify reenviada com sucesso:', data.orderId);
          } else {
            // Incrementar contador de tentativas
            data.retry_count = (data.retry_count || 0) + 1;
            localStorage.setItem(key, JSON.stringify(data));
          }
        } else {
          // Remover dados muito antigos ou com muitas tentativas
          localStorage.removeItem(key);
        }
      } catch (error) {
        console.error('Erro ao processar retry UTMify:', error);
        localStorage.removeItem(key);
      }
    }
  } catch (error) {
    console.error('Erro ao executar retry de conversões UTMify:', error);
  }
}