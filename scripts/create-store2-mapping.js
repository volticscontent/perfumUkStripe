const fs = require('fs');
const path = require('path');

// Carregar variáveis de ambiente (.env.local)
try {
  const dotenv = require('dotenv');
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log('[dotenv] Carregado .env.local');
  } else {
    dotenv.config();
    console.log('[dotenv] Carregado .env padrão');
  }
} catch (e) {
  console.warn('[dotenv] não encontrado, seguindo sem carregar .env');
}

/**
 * Script para criar mapeamento dos produtos para a Loja 2 (SOLO NECESSITO)
 * Baseado nos produtos existentes, cria IDs de variantes simulados para a Loja 2
 */

// Configuração da Loja 2 via ENV com fallback
const STORE_2_CONFIG = {
  id: '2',
  name: 'SOLO NECESSITO (Store 2)',
  domain: process.env.SHOPIFY_STORE_2_DOMAIN || process.env.NEXT_PUBLIC_SHOPIFY_STORE_2_DOMAIN || 'sn.theperfumeuk.shop',
  storeName: 'SOLO NECESSITO (Store 2)'
};

console.log('🏪 Criando mapeamento para Loja 2 (SOLO NECESSITO)...');
console.log(`📍 Domínio: ${STORE_2_CONFIG.domain}`);

// Função para gerar ID de variante simulado para Loja 2
function generateStore2VariantId(productIndex) {
  // Base: 10187399000000 + índice do produto * 1000 + variação
  const baseId = 10187399000000;
  return baseId + (productIndex * 1000) + Math.floor(Math.random() * 100);
}

// Função para processar produtos
function createStore2Mapping() {
  try {
    // Carregar produtos existentes
    const productsPath = path.join(__dirname, '..', 'data', 'unified_products_en_gbp.json');
    
    if (!fs.existsSync(productsPath)) {
      throw new Error('Arquivo de produtos não encontrado: ' + productsPath);
    }

    const productsData = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
    const products = productsData.products || [];

    console.log(`📦 Processando ${products.length} produtos...`);

    let processedCount = 0;
    let store2Products = [];
    let checkoutMapping = {};

    products.forEach((product, index) => {
      // Gerar ID de variante para Loja 2
      const store2VariantId = generateStore2VariantId(index + 1);
      
      // Criar mapeamento para Loja 2
      const store2Mapping = {
        product_id: store2VariantId,
        variant_id: store2VariantId,
        handle: product.handle,
        domain: STORE_2_CONFIG.domain,
        store_name: STORE_2_CONFIG.storeName,
        sku: product.sku,
        title: product.title,
        price: product.price.regular,
        currency: product.price.currency
      };

      // Adicionar mapeamento da Loja 2 ao produto
      if (!product.shopify_mapping) {
        product.shopify_mapping = {};
      }
      product.shopify_mapping['2'] = store2Mapping;

      // Adicionar ao array de produtos da Loja 2
      store2Products.push({
        id: product.id,
        handle: product.handle,
        title: product.title,
        sku: product.sku,
        price: product.price.regular,
        currency: product.price.currency,
        store2_variant_id: store2VariantId,
        checkout_url: `https://${STORE_2_CONFIG.domain}/cart/${store2VariantId}:1`
      });

      // Criar mapeamento para checkout
      checkoutMapping[product.id] = {
        variant_id: store2VariantId,
        handle: product.handle,
        title: product.title,
        sku: product.sku,
        price: product.price.regular,
        checkout_url: `https://${STORE_2_CONFIG.domain}/cart/${store2VariantId}:1`,
        domain: STORE_2_CONFIG.domain
      };

      processedCount++;
    });

    // Salvar produtos atualizados com mapeamento da Loja 2
    const updatedProductsPath = path.join(__dirname, '..', 'data', 'unified_products_en_gbp.json');
    fs.writeFileSync(updatedProductsPath, JSON.stringify(productsData, null, 2));
    console.log(`✅ Produtos atualizados salvos: ${updatedProductsPath}`);

    // Salvar lista específica da Loja 2
    const store2ProductsPath = path.join(__dirname, '..', 'data', 'store2-products-with-variants.json');
    const store2Data = {
      store: STORE_2_CONFIG,
      total_products: store2Products.length,
      products: store2Products,
      generated_at: new Date().toISOString()
    };
    fs.writeFileSync(store2ProductsPath, JSON.stringify(store2Data, null, 2));
    console.log(`✅ Produtos da Loja 2 salvos: ${store2ProductsPath}`);

    // Salvar mapeamento para checkout
    const checkoutMappingPath = path.join(__dirname, '..', 'data', 'store2-checkout-mapping.json');
    const mappingData = {
      store: STORE_2_CONFIG,
      total_mappings: Object.keys(checkoutMapping).length,
      mappings: checkoutMapping,
      generated_at: new Date().toISOString()
    };
    fs.writeFileSync(checkoutMappingPath, JSON.stringify(mappingData, null, 2));
    console.log(`✅ Mapeamento de checkout salvo: ${checkoutMappingPath}`);

    // Relatório final
    console.log('\n📊 RELATÓRIO DE MAPEAMENTO:');
    console.log(`🏪 Loja: ${STORE_2_CONFIG.storeName}`);
    console.log(`📍 Domínio: ${STORE_2_CONFIG.domain}`);
    console.log(`📦 Total de produtos processados: ${processedCount}`);
    console.log(`🔗 Total de URLs de checkout criadas: ${Object.keys(checkoutMapping).length}`);
    
    // Mostrar alguns exemplos
    console.log('\n🔗 EXEMPLOS DE URLs DE CHECKOUT:');
    const exampleProducts = store2Products.slice(0, 5);
    exampleProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.title}`);
      console.log(`   SKU: ${product.sku}`);
      console.log(`   Variant ID: ${product.store2_variant_id}`);
      console.log(`   URL: ${product.checkout_url}`);
      console.log('');
    });

    return {
      success: true,
      processed: processedCount,
      store2Products,
      checkoutMapping
    };

  } catch (error) {
    console.error('❌ Erro ao criar mapeamento:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Executar o script
if (require.main === module) {
  console.log('🚀 Iniciando criação de mapeamento para Loja 2...\n');
  
  const result = createStore2Mapping();
  
  if (result.success) {
    console.log('\n✅ Mapeamento criado com sucesso!');
    console.log(`📦 ${result.processed} produtos mapeados para a Loja 2`);
  } else {
    console.log('\n❌ Falha ao criar mapeamento');
    process.exit(1);
  }
}

module.exports = { createStore2Mapping, STORE_2_CONFIG };