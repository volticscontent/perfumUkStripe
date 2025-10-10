/**
 * Configuração das Lojas Shopify
 * Configurado para usar a LOJA 2 (SOLO NECESSITO) como padrão
 */

export interface ShopifyStore {
  id: string;
  name: string;
  domain: string;
  myshopifyDomain: string;
  fallbackUrl: string;
  storefrontToken?: string;
}

// Configuração das lojas Shopify
export const SHOPIFY_STORES: { [key: string]: ShopifyStore } = {
  '1': {
    id: '1',
    name: 'SOUZABARROS (Euro Pride)',
    domain: 'theperfumeshop.store',
    myshopifyDomain: 'ton-store-1656.myshopify.com',
    fallbackUrl: 'https://ton-store-1656.myshopify.com',
    storefrontToken: process.env.SHOPIFY_STORE_1_STOREFRONT_TOKEN
  },
  '2': {
    id: '2',
    name: 'SOLO NECESSITO',
    domain: process.env.NEXT_PUBLIC_SHOPIFY_STORE_2_DOMAIN || process.env.SHOPIFY_STORE_2_DOMAIN || 'nkgzhm-1d.myshopify.com',
    myshopifyDomain: process.env.SHOPIFY_STORE_2_DOMAIN || 'nkgzhm-1d.myshopify.com',
    fallbackUrl: `https://${process.env.SHOPIFY_STORE_2_DOMAIN || 'nkgzhm-1d.myshopify.com'}`,
    storefrontToken: process.env.SHOPIFY_STORE_2_STOREFRONT_TOKEN
  },
  '3': {
    id: '3',
    name: 'SAMYRA/SADERSTORE',
    domain: 'tpsperfumeshop.shop',
    myshopifyDomain: 'ae888e.myshopify.com',
    fallbackUrl: 'https://ae888e.myshopify.com',
    storefrontToken: process.env.SHOPIFY_STORE_3_STOREFRONT_TOKEN
  }
};

// Configuração padrão agora usa a loja 2 (SOLO NECESSITO)
export const DEFAULT_STORE_ID = '2';

/**
 * Obtém a configuração da loja 2 (loja padrão ativa)
 */
export function getStore2Config(): ShopifyStore {
  return SHOPIFY_STORES['2'];
}

/**
 * Obtém a configuração da loja 3
 */
export function getStore3Config(): ShopifyStore {
  return SHOPIFY_STORES['3'];
}

/**
 * Obtém a configuração de uma loja por ID
 */
export function getStoreById(storeId: string): ShopifyStore {
  return SHOPIFY_STORES[storeId] || SHOPIFY_STORES[DEFAULT_STORE_ID]; // Fallback para loja 2
}

/**
 * Obtém todas as lojas disponíveis
 */
export function getAllStores(): ShopifyStore[] {
  return Object.values(SHOPIFY_STORES);
}

/**
 * Verifica se uma loja existe
 */
export function storeExists(storeId: string): boolean {
  return storeId in SHOPIFY_STORES;
}

/**
 * Obtém o domínio myshopify da loja 2
 */
export function getStore2Domain(): string {
  return SHOPIFY_STORES['2'].myshopifyDomain;
}

/**
 * Obtém o domínio myshopify da loja 3
 */
export function getStore3Domain(): string {
  return SHOPIFY_STORES['3'].myshopifyDomain;
}

/**
 * Obtém a URL de fallback da loja 2
 */
export function getStore2FallbackUrl(): string {
  return SHOPIFY_STORES['2'].fallbackUrl;
}

/**
 * Obtém a URL de fallback da loja 3
 */
export function getStore3FallbackUrl(): string {
  return SHOPIFY_STORES['3'].fallbackUrl;
}

/**
 * Função de compatibilidade - retorna loja padrão
 */
export function getStoreConfig(): ShopifyStore {
  return SHOPIFY_STORES[DEFAULT_STORE_ID];
}

// Exporta a configuração da loja padrão
export default SHOPIFY_STORES[DEFAULT_STORE_ID];