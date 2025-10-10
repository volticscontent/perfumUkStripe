const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

// Configuração da Loja 2 (SOLO NECESSITO) usando Storefront API
const STORE_CONFIG = {
  name: 'SOLO NECESSITO',
  domain: process.env.SHOPIFY_STORE_2_DOMAIN || 'nkgzhm-1d.myshopify.com', // API sempre usa domínio .myshopify.com
  customDomain: process.env.NEXT_PUBLIC_SHOPIFY_STORE_2_DOMAIN || process.env.SHOPIFY_STORE_2_DOMAIN || 'nkgzhm-1d.myshopify.com', // Domínio customizado (para checkout/redirect)
  storefrontToken: process.env.SHOPIFY_STORE_2_STOREFRONT_TOKEN,
  apiVersion: process.env.SHOPIFY_API_VERSION || '2024-07'
};

console.log('🏪 Buscando produtos da Loja 2 (SOLO NECESSITO)...');
console.log('📍 Domínio:', STORE_CONFIG.domain);

// Query GraphQL para buscar produtos com variantes
const PRODUCTS_QUERY = `
  query getProducts($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          handle
          title
          description
          tags
          productType
          vendor
          createdAt
          updatedAt
          variants(first: 10) {
            edges {
              node {
                id
                title
                sku
                price {
                  amount
                  currencyCode
                }
                compareAtPrice {
                  amount
                  currencyCode
                }
                availableForSale
                quantityAvailable
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
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
            maxVariantPrice {
              amount
              currencyCode
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

async function fetchProducts() {
  try {
    const response = await fetch(`https://${STORE_CONFIG.domain}/api/${STORE_CONFIG.apiVersion}/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': STORE_CONFIG.storefrontToken
      },
      body: JSON.stringify({
        query: PRODUCTS_QUERY,
        variables: {
          first: 50 // Buscar até 50 produtos
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.errors) {
      console.error('❌ Erros na consulta GraphQL:', data.errors);
      return null;
    }

    return data.data.products;
  } catch (error) {
    console.error('❌ Erro ao buscar produtos:', error.message);
    return null;
  }
}

function processProducts(productsData) {
  const products = [];
  
  productsData.edges.forEach((edge, index) => {
    const product = edge.node;
    
    // Extrair ID numérico do Shopify ID
    const productId = product.id.replace('gid://shopify/Product/', '');
    
    // Processar variantes
    const variants = product.variants.edges.map(variantEdge => {
      const variant = variantEdge.node;
      const variantId = variant.id.replace('gid://shopify/ProductVariant/', '');
      
      return {
        id: variantId,
        title: variant.title,
        sku: variant.sku,
        price: variant.price ? parseFloat(variant.price.amount) : 0,
        compareAtPrice: variant.compareAtPrice ? parseFloat(variant.compareAtPrice.amount) : null,
        availableForSale: variant.availableForSale,
        quantityAvailable: variant.quantityAvailable
      };
    });

    // Processar imagens
    const images = product.images.edges.map(imageEdge => imageEdge.node.url);

    const processedProduct = {
      id: productId,
      handle: product.handle,
      title: product.title,
      description: product.description,
      vendor: product.vendor,
      productType: product.productType,
      tags: product.tags,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      variants: variants,
      images: images,
      priceRange: {
        min: parseFloat(product.priceRange.minVariantPrice.amount),
        max: parseFloat(product.priceRange.maxVariantPrice.amount),
        currency: product.priceRange.minVariantPrice.currencyCode
      },
      shopify_mapping: {
        "2": {
          product_id: parseInt(productId),
          variant_id: variants.length > 0 ? parseInt(variants[0].id) : null,
          handle: product.handle,
          domain: STORE_CONFIG.domain,
          store_name: "SOLO NECESSITO",
          sku: variants.length > 0 ? variants[0].sku : null,
          price: variants.length > 0 ? variants[0].price.toString() : "0",
          compare_at_price: variants.length > 0 && variants[0].compareAtPrice ? variants[0].compareAtPrice.toString() : null
        }
      }
    };

    products.push(processedProduct);
    
    console.log(`✅ Produto ${index + 1}: ${product.title}`);
    console.log(`   📦 ID: ${productId}`);
    console.log(`   🔗 Handle: ${product.handle}`);
    console.log(`   💰 Preço: ${processedProduct.priceRange.currency} ${processedProduct.priceRange.min}`);
    console.log(`   🎯 Variantes: ${variants.length}`);
    if (variants.length > 0) {
      console.log(`   🆔 Primeira Variante ID: ${variants[0].id}`);
    }
    console.log('');
  });

  return products;
}

async function main() {
  console.log('🚀 Iniciando busca de produtos da Loja 2 (SOLO NECESSITO)...\n');

  const productsData = await fetchProducts();
  
  if (!productsData) {
    console.error('❌ Falha ao buscar produtos');
    process.exit(1);
  }

  console.log(`📊 Total de produtos encontrados: ${productsData.edges.length}\n`);

  const processedProducts = processProducts(productsData);

  // Salvar dados processados
  const outputPath = path.join(__dirname, '..', 'data', 'store2-products-with-variants.json');
  
  const outputData = {
    store: STORE_CONFIG.name,
    domain: STORE_CONFIG.domain,
    totalProducts: processedProducts.length,
    fetchedAt: new Date().toISOString(),
    products: processedProducts
  };

  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
  
  console.log(`💾 Dados salvos em: ${outputPath}`);
  console.log(`📈 Total de produtos processados: ${processedProducts.length}`);
  
  // Estatísticas
  const totalVariants = processedProducts.reduce((sum, product) => sum + product.variants.length, 0);
  console.log(`🎯 Total de variantes: ${totalVariants}`);
  
  // Salvar mapeamento simplificado para checkout
  const checkoutMapping = {};
  processedProducts.forEach(product => {
    if (product.variants.length > 0) {
      checkoutMapping[product.handle] = {
        productId: product.id,
        variantId: product.variants[0].id,
        price: product.variants[0].price,
        title: product.title
      };
    }
  });

  const mappingPath = path.join(__dirname, '..', 'data', 'store2-checkout-mapping.json');
  fs.writeFileSync(mappingPath, JSON.stringify(checkoutMapping, null, 2));
  
  console.log(`🔗 Mapeamento de checkout salvo em: ${mappingPath}`);
  console.log('\n✅ Busca concluída com sucesso!');
}

main().catch(console.error);