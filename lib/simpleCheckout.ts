/**
 * Sistema de checkout ultra-simples
 * Agora usa a loja SOLO NECESSITO (loja 2) via variáveis de ambiente
 */

// Configuração dinâmica da loja 2
const STORE_CONFIG = {
  name: 'SOLO NECESSITO',
  domain: (process.env.NEXT_PUBLIC_SHOPIFY_STORE_2_DOMAIN || process.env.SHOPIFY_STORE_2_DOMAIN || 'nkgzhm-1d.myshopify.com'),
  storefrontAccessToken: process.env.SHOPIFY_STORE_2_STOREFRONT_TOKEN || 'token_placeholder'
};

interface CartItem {
  shopifyId: string;
  quantity: number;
}

/**
 * Cria URL de checkout usando nossa API route (evita CORS)
 * Usa loja 2 (SOLO NECESSITO)
 */
export async function createSimpleCheckoutUrl(items: CartItem[]): Promise<string | null> {
  try {
    if (!items || items.length === 0) {
      console.warn('❌ Nenhum item para checkout');
      return null;
    }

    console.log('🛒 Criando checkout simples para', items.length, 'itens');
    console.log('🏪 Usando loja:', STORE_CONFIG.name);

    // Fazer requisição para nossa API route
    const response = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items }),
    });
    
    if (!response.ok) {
      console.error('❌ Erro HTTP:', response.status, response.statusText);
      return null;
    }
    
    const data = await response.json();
    console.log('📦 Resposta da API:', data);
    
    if (data.error) {
      console.error('❌ Erro da API:', data.error);
      return null;
    }
    
    if (!data.checkoutUrl) {
      console.error('❌ URL de checkout não encontrada');
      return null;
    }
    
    console.log('✅ Checkout criado com sucesso:', data.checkoutUrl);
    return data.checkoutUrl;
    
  } catch (error) {
    console.error('❌ Erro ao criar checkout:', error);
    return null;
  }
}

/**
 * Função de compatibilidade - retorna a configuração da loja 2
 */
export function getStoreConfig() {
  return STORE_CONFIG;
}