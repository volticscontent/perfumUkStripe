import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Testar se as variáveis de ambiente da Loja 1 (EURO PRIDE) estão disponíveis na API
  const envVars = {
    // Variáveis da Loja 1 (EURO PRIDE)
    SHOPIFY_STORE_1_DOMAIN: process.env.SHOPIFY_STORE_1_DOMAIN || 'NÃO DEFINIDO',
    SHOPIFY_STORE_1_STOREFRONT_TOKEN: process.env.SHOPIFY_STORE_1_STOREFRONT_TOKEN ? 'DEFINIDO' : 'NÃO DEFINIDO',
    SHOPIFY_STORE_1_ADMIN_TOKEN: process.env.SHOPIFY_STORE_1_ADMIN_TOKEN ? 'DEFINIDO' : 'NÃO DEFINIDO',
    NEXT_PUBLIC_SHOPIFY_STORE_1_DOMAIN: process.env.NEXT_PUBLIC_SHOPIFY_STORE_1_DOMAIN || 'NÃO DEFINIDO',
    NEXT_PUBLIC_SHOPIFY_STORE_1_STOREFRONT_TOKEN: process.env.NEXT_PUBLIC_SHOPIFY_STORE_1_STOREFRONT_TOKEN ? 'DEFINIDO' : 'NÃO DEFINIDO',
    NEXT_PUBLIC_STORE_1_FALLBACK_URL: process.env.NEXT_PUBLIC_STORE_1_FALLBACK_URL || 'NÃO DEFINIDO',
    
    // Variáveis legadas (para compatibilidade)
    SHOPIFY_DOMAIN: process.env.SHOPIFY_DOMAIN || 'NÃO DEFINIDO',
    SHOPIFY_STOREFRONT_TOKEN: process.env.SHOPIFY_STOREFRONT_TOKEN ? 'DEFINIDO' : 'NÃO DEFINIDO',
    SHOPIFY_ADMIN_TOKEN: process.env.SHOPIFY_ADMIN_TOKEN ? 'DEFINIDO' : 'NÃO DEFINIDO',
    NODE_ENV: process.env.NODE_ENV || 'NÃO DEFINIDO'
  };

  console.log('🔍 Variáveis de ambiente na API:', envVars);

  return res.status(200).json({
    message: 'Teste de variáveis de ambiente',
    environment: envVars,
    timestamp: new Date().toISOString()
  });
}