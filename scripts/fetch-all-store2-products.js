const fs = require('fs');
const path = require('path');

// Configuração da Loja 2 (WIFI MONEY)
const STORE_CONFIG = {
  name: 'WIFI MONEY',
  domain: (process.env.SHOPIFY_STORE_2_DOMAIN || process.env.NEXT_PUBLIC_SHOPIFY_STORE_2_DOMAIN || 'nkgzhm-1d.myshopify.com')
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, ''),
  adminToken: process.env.SHOPIFY_STORE_2_ADMIN_TOKEN,
  apiVersion: process.env.SHOPIFY_API_VERSION || '2023-10'
};

// Validação do token
if (!STORE_CONFIG.adminToken) {
  console.error('❌ ERRO: SHOPIFY_STORE_2_ADMIN_TOKEN não encontrado nas variáveis de ambiente');
  console.error('Configure a variável de ambiente antes de executar o script');
  process.exit(1);
}

/**
 * Busca todos os produtos da loja
 */
async function fetchAllProducts() {
  const products = [];
  let hasNextPage = true;
  let cursor = null;
  
  console.log(`🔍 Buscando todos os produtos da loja ${STORE_CONFIG.name}...`);
  
  while (hasNextPage) {
    try {
      const query = `
        query getProducts($first: Int!, $after: String) {
          products(first: $first, after: $after) {
            edges {
              node {
                id
                handle
                title
                status
                vendor
                productType
                tags
                createdAt
                updatedAt
                variants(first: 10) {
                  edges {
                    node {
                      id
                      title
                      price
                      compareAtPrice
                      sku
                      inventoryQuantity
                      availableForSale
                    }
                  }
                }
                images(first: 5) {
                  edges {
                    node {
                      id
                      url
                      altText
                    }
                  }
                }
              }
              cursor
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      `;
      
      const variables = {
        first: 50,
        after: cursor
      };
      
      const response = await fetch(`https://${STORE_CONFIG.domain}/admin/api/${STORE_CONFIG.apiVersion}/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': STORE_CONFIG.adminToken
        },
        body: JSON.stringify({ query, variables })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
      }
      
      const productEdges = data.data.products.edges;
      products.push(...productEdges.map(edge => edge.node));
      
      hasNextPage = data.data.products.pageInfo.hasNextPage;
      cursor = data.data.products.pageInfo.endCursor;
      
      console.log(`📦 Encontrados ${products.length} produtos até agora...`);
      
    } catch (error) {
      console.error('❌ Erro ao buscar produtos:', error.message);
      break;
    }
  }
  
  return products;
}

/**
 * Processa e organiza os dados dos produtos
 */
function processProducts(products) {
  return products.map(product => ({
    id: product.id,
    handle: product.handle,
    title: product.title,
    status: product.status,
    vendor: product.vendor,
    productType: product.productType,
    tags: product.tags,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    variants: product.variants.edges.map(edge => ({
      id: edge.node.id,
      title: edge.node.title,
      price: edge.node.price,
      compareAtPrice: edge.node.compareAtPrice,
      sku: edge.node.sku,
      inventoryQuantity: edge.node.inventoryQuantity,
      availableForSale: edge.node.availableForSale
    })),
    images: product.images.edges.map(edge => ({
      id: edge.node.id,
      url: edge.node.url,
      altText: edge.node.altText
    }))
  }));
}

/**
 * Salva os resultados em arquivo
 */
function saveResults(products) {
  const outputDir = path.join(__dirname, '..', 'data', 'store2');
  
  // Criar diretório se não existir
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `all-products-${timestamp}.json`;
  const filepath = path.join(outputDir, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(products, null, 2));
  
  console.log(`💾 Dados salvos em: ${filepath}`);
  console.log(`📊 Total de produtos: ${products.length}`);
  
  // Salvar também um arquivo resumo
  const summary = {
    totalProducts: products.length,
    timestamp: new Date().toISOString(),
    store: STORE_CONFIG.name,
    domain: STORE_CONFIG.domain,
    products: products.map(p => ({
      handle: p.handle,
      title: p.title,
      status: p.status,
      variantCount: p.variants.length
    }))
  };
  
  const summaryFilename = `summary-${timestamp}.json`;
  const summaryFilepath = path.join(outputDir, summaryFilename);
  fs.writeFileSync(summaryFilepath, JSON.stringify(summary, null, 2));
  
  console.log(`📋 Resumo salvo em: ${summaryFilepath}`);
}

/**
 * Função principal
 */
async function main() {
  try {
    console.log('🚀 Iniciando busca de todos os produtos...');
    console.log(`🏪 Loja: ${STORE_CONFIG.name} (${STORE_CONFIG.domain})`);
    
    const products = await fetchAllProducts();
    
    if (products.length === 0) {
      console.log('⚠️ Nenhum produto encontrado');
      return;
    }
    
    console.log('🔄 Processando dados dos produtos...');
    const processedProducts = processProducts(products);
    
    console.log('💾 Salvando resultados...');
    saveResults(processedProducts);
    
    console.log('✅ Busca concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante a execução:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

async function fetchAllProductsRest() {
  const products = [];
  let nextPageInfo = null;
  let page = 1;

  while (true) {
    let url = `https://${STORE_CONFIG.domain}/admin/api/${STORE_CONFIG.apiVersion}/products.json?limit=250`;
    if (nextPageInfo) url += `&page_info=${nextPageInfo}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': STORE_CONFIG.adminToken,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`REST error! status: ${response.status}`);
    }

    const data = await response.json();
    const batch = data.products || [];
    products.push(...batch);

    const linkHeader = response.headers.get('link');
    if (linkHeader && linkHeader.includes('rel="next"')) {
      const nextMatch = linkHeader.match(/<[^>]*[?&]page_info=([^&>]+)[^>]*>;\s*rel="next"/);
      nextPageInfo = nextMatch ? nextMatch[1] : null;
      page++;
    } else {
      break;
    }
  }

  // Converter para estrutura semelhante à GraphQL processProducts
  return products.map(p => ({
    id: p.id,
    handle: p.handle,
    title: p.title,
    status: p.status,
    vendor: p.vendor,
    productType: p.product_type,
    tags: p.tags,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    variants: (p.variants || []).map(v => ({
      id: v.id,
      title: v.title,
      price: v.price,
      compareAtPrice: v.compare_at_price,
      sku: v.sku,
      inventoryQuantity: v.inventory_quantity,
      availableForSale: v.available
    })),
    images: (p.images || []).map(img => ({
      id: img.id,
      url: img.src,
      altText: img.alt
    }))
  }));
}

async function fetchAllProductsLiveOrRest() {
  try {
    const graph = await fetchAllProducts();
    if (Array.isArray(graph) && graph.length > 0) return graph;
    throw new Error('GraphQL empty or failed, falling back to REST');
  } catch (e) {
    console.warn(`⚠️  GraphQL falhou (${e.message}). Tentando via REST...`);
    return await fetchAllProductsRest();
  }
}

/**
 * Salva os resultados em arquivo
 */
function saveResults(products) {
  const outputDir = path.join(__dirname, '..', 'data', 'store2');
  
  // Criar diretório se não existir
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `all-products-${timestamp}.json`;
  const filepath = path.join(outputDir, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(products, null, 2));
  
  console.log(`💾 Dados salvos em: ${filepath}`);
  console.log(`📊 Total de produtos: ${products.length}`);
  
  // Salvar também um arquivo resumo
  const summary = {
    totalProducts: products.length,
    timestamp: new Date().toISOString(),
    store: STORE_CONFIG.name,
    domain: STORE_CONFIG.domain,
    products: products.map(p => ({
      handle: p.handle,
      title: p.title,
      status: p.status,
      variantCount: p.variants.length
    }))
  };
  
  const summaryFilename = `summary-${timestamp}.json`;
  const summaryFilepath = path.join(outputDir, summaryFilename);
  fs.writeFileSync(summaryFilepath, JSON.stringify(summary, null, 2));
  
  console.log(`📋 Resumo salvo em: ${summaryFilepath}`);
}

/**
 * Função principal
 */
async function main() {
  try {
    console.log('🚀 Iniciando busca de todos os produtos...');
    console.log(`🏪 Loja: ${STORE_CONFIG.name} (${STORE_CONFIG.domain})`);
    
    const products = await fetchAllProducts();
    
    if (products.length === 0) {
      console.log('⚠️ Nenhum produto encontrado');
      return;
    }
    
    console.log('🔄 Processando dados dos produtos...');
    const processedProducts = processProducts(products);
    
    console.log('💾 Salvando resultados...');
    saveResults(processedProducts);
    
    console.log('✅ Busca concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante a execução:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { fetchAllProducts, processProducts, saveResults, fetchAllProductsRest, fetchAllProductsLiveOrRest };