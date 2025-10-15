// Checkout com Stripe
interface CartItem {
  shopifyId: string; // Mantemos o nome para compatibilidade, mas agora é o ID do Stripe
  quantity: number;
}

// Função para extrair parâmetros UTM da URL atual
function getUtmParamsFromUrl() {
  if (typeof window === 'undefined') return {};
  
  const urlParams = new URLSearchParams(window.location.search);
  return {
    utm_source: urlParams.get('utm_source') || undefined,
    utm_medium: urlParams.get('utm_medium') || undefined,
    utm_campaign: urlParams.get('utm_campaign') || undefined,
    utm_term: urlParams.get('utm_term') || undefined,
    utm_content: urlParams.get('utm_content') || undefined,
  };
}

// Função principal para redirecionar direto para o checkout
export function redirectToCheckout(items: CartItem[]): void {
  try {
    // Usar sempre Stripe Checkout (não precisamos mais verificar useStripe)
    redirectToStripeCheckout(items);
  } catch (error) {
    console.error('❌ Erro crítico no checkout:', error);
    alert('Erro ao processar checkout. Tente novamente.');
  }
}

// Função para checkout com Stripe
export async function redirectToStripeCheckout(
  items: CartItem[], 
  options?: {
    customAppearance?: {
      theme?: 'stripe' | 'night' | 'flat',
      buttonColor?: string,
      primaryColor?: string
    },
    shipping?: {
      allowedCountries?: string[],
      requireAddress?: boolean
    },
    customerEmail?: string,
    promocode?: string,
    utmParams?: {
      utm_source?: string,
      utm_medium?: string,
      utm_campaign?: string,
      utm_term?: string,
      utm_content?: string
    }
  }
): Promise<void> {
  try {
    if (items.length === 0) {
      console.error('Carrinho vazio');
      alert('Seu carrinho está vazio.');
      return;
    }

    console.log('📦 Itens validados do carrinho:', items);

    // Formatar itens para o formato esperado pela API
    const formattedItems = items.map(item => ({
      price_id: item.shopifyId, // ID do preço no Stripe
      quantity: item.quantity
    }));

    // Chamar a API para criar a sessão de checkout
    const response = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: formattedItems,
        success_url: `${window.location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${window.location.origin}/checkout/cancel`,
        // Opções de personalização
        customAppearance: options?.customAppearance || {
          theme: 'stripe',
          primaryColor: '#6772e5'
        },
        shipping: options?.shipping || {
          allowedCountries: ['GB'],
          requireAddress: true
        },
        customerEmail: options?.customerEmail || '',
        promocode: options?.promocode || '',
        // Adicionar parâmetros UTM se fornecidos
        utmParams: options?.utmParams || getUtmParamsFromUrl()
      }),
    });

    if (!response.ok) {
      try {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar sessão de checkout');
      } catch (jsonError) {
        // Se não conseguir processar como JSON, usa o status text
        throw new Error(`Erro ao criar sessão de checkout: ${response.status} ${response.statusText}`);
      }
    }

    const { url } = await response.json();
    
    if (url) {
      console.log('✅ Redirecionando para Stripe Checkout:', url);
      window.location.href = url;
    } else {
      throw new Error('Não foi possível obter a URL de checkout');
    }
  } catch (error) {
    console.error('❌ Erro no checkout:', error);
    alert('Erro ao processar checkout. Tente novamente.');
  }
}