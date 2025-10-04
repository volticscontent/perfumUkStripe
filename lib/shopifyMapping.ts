// Sistema configurado para usar apenas LOJA 1 (EURO PRIDE)

// Tipos para os produtos unificados
interface UnifiedProduct {
  id: string;
  handle: string;
  title: string;
  shopify_mapping: {
    [storeId: string]: {
      product_id: number;
      handle: string;
      domain: string;
      store_name: string;
      sku: string;
    };
  };
}

// Tipos para o mapeamento de variant IDs (estrutura simplificada)
interface ShopifyVariantMapping {
  [handle: string]: string; // handle -> variant_id
}



/**
 * Carrega o mapeamento de variant IDs do arquivo JSON (SEM CACHE)
 */
async function loadVariantMapping(): Promise<ShopifyVariantMapping> {
  try {
    // Sempre carregamos diretamente do arquivo (servidor e cliente)
    if (typeof window === 'undefined') {
      // Servidor: carrega diretamente do arquivo
      const fs = await import('fs');
      const path = await import('path');
      
      const filePath = path.join(process.cwd(), 'data', 'shopify_variant_mapping.json');
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(fileContent);
    } else {
      // Cliente: usa fetch para carregar o arquivo estático
      const response = await fetch('/data/shopify_variant_mapping.json');
      if (!response.ok) {
        console.warn('Não foi possível carregar o mapeamento de variant IDs');
        return {} as ShopifyVariantMapping;
      }
      return await response.json();
    }
  } catch (error) {
    console.error('Erro ao carregar mapeamento de variant IDs:', error);
    return {} as ShopifyVariantMapping;
  }
}

/**
 * Carrega os produtos unificados do arquivo JSON (SEM CACHE)
 */
async function loadUnifiedProducts(): Promise<UnifiedProduct[]> {
  try {
    let data;
    
    // Se estamos no servidor, carregamos diretamente do arquivo
    if (typeof window === 'undefined') {
      const fs = await import('fs');
      const path = await import('path');
      
      const filePath = path.join(process.cwd(), 'data', 'unified_products_en_gbp.json');
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      data = JSON.parse(fileContent);
    } else {
      // Se estamos no cliente, usamos a API route
      const response = await fetch('/api/unified-products');
      if (!response.ok) {
        console.warn('Não foi possível carregar os produtos unificados');
        return [];
      }
      data = await response.json();
    }
    
    const products = data.products || [];
    
    // Produtos unificados carregados
    return products;
  } catch (error) {
    console.error('Erro ao carregar produtos unificados:', error);
    return [];
  }
}

/**
 * Encontra um produto unificado pelo ID
 */
async function findUnifiedProductById(productId: string): Promise<UnifiedProduct | null> {
  const products = await loadUnifiedProducts();
  return products.find(product => product.id === productId) || null;
}

/**
 * Determina o store ID - sempre retorna loja 1 (EURO PRIDE)
 * Sistema configurado para usar apenas a loja 1
 */
function getStoreIdFromUTM(utmCampaign?: string): string {
  // Sempre retorna loja 1 (EURO PRIDE)
  return '1';
}

// FUNÇÃO REMOVIDA - Estava causando erros no sistema

// FUNÇÃO REMOVIDA - Estava causando erros no sistema

/**
 * Obtém o ID da variante do Shopify para um produto específico pelo handle
 */
export async function getShopifyVariantIdByHandle(handle: string): Promise<string | null> {
  try {
    const variantMapping = await loadVariantMapping();
    return variantMapping[handle] || null;
  } catch (error) {
    console.error('Erro ao obter variant ID:', error);
    return null;
  }
}

/**
 * Obtém o ID da variante do Shopify para um produto específico (função de compatibilidade)
 * Busca pelo handle do produto nos dados unificados
 */
export async function getShopifyVariantId(productId: string, utmCampaign?: string): Promise<string | null> {
  try {
    // Busca o produto unificado para obter o handle
    const product = await findUnifiedProductById(productId);
    if (!product) {
      console.warn(`Produto não encontrado: ${productId}`);
      return null;
    }
    
    // Usa o handle para buscar o variant ID
    return await getShopifyVariantIdByHandle(product.handle);
  } catch (error) {
    console.error('Erro ao obter variant ID:', error);
    return null;
  }
}

/**
 * Obtém informações do produto unificado
 */
export async function getUnifiedProductInfo(productId: string): Promise<UnifiedProduct | null> {
  return findUnifiedProductById(productId);
}

/**
 * Verifica se os produtos unificados estão disponíveis
 */
export async function isUnifiedProductsAvailable(): Promise<boolean> {
  const products = await loadUnifiedProducts();
  return products.length > 0;
}

/**
 * Obtém informações completas da variante do Shopify para um produto pelo handle
 */
export async function getShopifyVariantInfo(handle: string): Promise<{
  variantId: string | null;
  product: UnifiedProduct | null;
  storeInfo: any | null;
} | null> {
  try {
    // Busca o variant ID
    const variantId = await getShopifyVariantIdByHandle(handle);
    
    // Busca o produto unificado
    const products = await loadUnifiedProducts();
    const product = products.find(p => p.handle === handle) || null;
    
    // Obtém informações da loja
    const storeId = getStoreIdFromUTM();
    const storeInfo = product?.shopify_mapping?.[storeId] || null;
    
    return {
      variantId,
      product,
      storeInfo
    };
  } catch (error) {
    console.error('Erro ao obter informações da variante:', error);
    return null;
  }
}