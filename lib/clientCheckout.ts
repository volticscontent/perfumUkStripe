// Checkout direto por URL - sem necessidade de API!
interface CartItem {
  shopifyId: string;
  quantity: number;
}

interface CheckoutResponse {
  checkoutUrl?: string;
  error?: string;
  details?: any;
}

// Função para criar URL de checkout direto do Shopify
export function createDirectCheckoutUrl(items: CartItem[]): CheckoutResponse {
  try {
    // Domínio da loja 1 (EURO PRIDE) - usando domínio myshopify
    const domain = 'ton-store-1656.myshopify.com';
    
    if (!domain) {
      return {
        error: 'Domínio da loja não configurado',
        details: { domain: !!domain }
      };
    }

    if (items.length === 0) {
      return {
        error: 'Carrinho vazio',
        details: { itemCount: items.length }
      };
    }

    // Construir URL de checkout direto do Shopify
    // Formato: https://loja.myshopify.com/cart/add?id=VARIANT_ID:QUANTITY&id=VARIANT_ID2:QUANTITY2
    const cartParams = items
      .map(item => `${item.shopifyId}:${item.quantity}`)
      .join(',');

    // URL de checkout direto que adiciona itens ao carrinho e redireciona
    const checkoutUrl = `https://${domain}/cart/${cartParams}`;

    console.log('🛒 URL de checkout criada:', checkoutUrl);
    console.log('📦 Itens:', items);

    return {
      checkoutUrl
    };

  } catch (error) {
    return {
      error: 'Erro ao criar URL de checkout',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

// Função alternativa usando o endpoint /cart/add
export function createCartAddUrl(items: CartItem[]): CheckoutResponse {
  try {
    // Domínio da loja 1 (EURO PRIDE) - usando domínio myshopify
    const domain = 'ton-store-1656.myshopify.com';
    
    if (!domain) {
      return {
        error: 'Domínio da loja não configurado',
        details: { domain: !!domain }
      };
    }

    if (items.length === 0) {
      return {
        error: 'Carrinho vazio',
        details: { itemCount: items.length }
      };
    }

    // Para múltiplos itens, usar formato de array
    const formData = new URLSearchParams();
    
    items.forEach((item, index) => {
      formData.append(`items[${index}][id]`, item.shopifyId);
      formData.append(`items[${index}][quantity]`, item.quantity.toString());
    });

    // URL que adiciona itens e redireciona para checkout
    const checkoutUrl = `https://${domain}/cart/add?${formData.toString()}&return_to=/checkout`;

    console.log('🛒 URL de checkout (cart/add):', checkoutUrl);
    console.log('📦 Itens:', items);

    return {
      checkoutUrl
    };

  } catch (error) {
    return {
      error: 'Erro ao criar URL de checkout',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

// Função principal para redirecionar direto para o checkout
export function redirectToCheckout(items: CartItem[]): void {
  try {
    // Tentar primeiro método (URL direta)
    let result = createDirectCheckoutUrl(items);
    
    // Se falhar, tentar método alternativo
    if (!result.checkoutUrl) {
      result = createCartAddUrl(items);
    }
    
    if (result.checkoutUrl) {
      console.log('✅ Redirecionando para checkout:', result.checkoutUrl);
      window.location.href = result.checkoutUrl;
    } else {
      console.error('❌ Erro no checkout:', result.error, result.details);
      alert('Erro ao processar checkout. Tente novamente.');
    }
  } catch (error) {
    console.error('❌ Erro crítico no checkout:', error);
    alert('Erro ao processar checkout. Tente novamente.');
  }
}