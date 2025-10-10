/**
 * Script para criar produtos na loja SOLO NECESSITO (Store 2) usando os dados de data/unified_products_en_gbp.json
 * e anexar a imagem public/imagem_dos_produtos.jpg a cada produto criado.
 * 
 * Uso:
 *   node scripts/create-store2-products-from-unified.js --limit 10 --offset 0
 *
 * Observações:
 * - Este script lê variáveis da ".env.local" (SHOPIFY_STORE_2_DOMAIN, SHOPIFY_STORE_2_ADMIN_TOKEN)
 * - Não imprime segredos em logs
 */

const fs = require('fs');
const path = require('path');

// Carregar variáveis do .env.local
require('dotenv').config({ path: path.join(process.cwd(), '.env.local') });

const STORE_DOMAIN = process.env.SHOPIFY_STORE_2_DOMAIN || process.env.NEXT_PUBLIC_SHOPIFY_STORE_2_DOMAIN;
const ADMIN_TOKEN = process.env.SHOPIFY_STORE_2_ADMIN_TOKEN;
const API_VERSION = process.env.SHOPIFY_API_VERSION || '2023-10';

if (!STORE_DOMAIN || !ADMIN_TOKEN) {
  console.error('❌ Variáveis de ambiente ausentes: certifique-se de definir SHOPIFY_STORE_2_DOMAIN e SHOPIFY_STORE_2_ADMIN_TOKEN em .env.local');
  process.exit(1);
}

// Caminhos de arquivos
const UNIFIED_PATH = path.join(process.cwd(), 'data', 'unified_products_en_gbp.json');
const IMAGE_PATH = path.join(process.cwd(), 'public', 'imagem_dos_produtos.jpg');

// Parâmetros via CLI
const argv = process.argv.slice(2);
const getArg = (name, def) => {
  const idx = argv.findIndex(a => a === name || a.startsWith(`${name}=`));
  if (idx === -1) return def;
  const val = argv[idx].includes('=') ? argv[idx].split('=')[1] : argv[idx + 1];
  return val ?? def;
};

const LIMIT = parseInt(getArg('--limit', '10'), 10);
const OFFSET = parseInt(getArg('--offset', '0'), 10);
const DELAY_MS = 250; // pequena pausa entre requisições

// Utilitário simples de espera
const wait = (ms) => new Promise(res => setTimeout(res, ms));

// Busca todos os produtos existentes na loja para evitar duplicações por handle
async function fetchAllProductsAdmin() {
  let allProducts = [];
  let nextPageInfo = null;
  let page = 1;

  while (true) {
    try {
      let url = `https://${STORE_DOMAIN}/admin/api/${API_VERSION}/products.json?limit=250`;
      if (nextPageInfo) {
        url += `&page_info=${nextPageInfo}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Shopify-Access-Token': ADMIN_TOKEN,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      const products = result.products || [];
      allProducts = allProducts.concat(products);

      const linkHeader = response.headers.get('link');
      if (linkHeader && linkHeader.includes('rel="next"')) {
        const nextMatch = linkHeader.match(/<[^>]*[?&]page_info=([^&>]+)[^>]*>;\s*rel="next"/);
        if (nextMatch) {
          nextPageInfo = nextMatch[1];
          page++;
        } else {
          break;
        }
      } else {
        break;
      }

      await wait(200);
    } catch (error) {
      console.error(`❌ Erro ao buscar página ${page}:`, error.message);
      break;
    }
  }

  return allProducts;
}

// Cria um produto via Admin REST
async function createProduct(product) {
  const url = `https://${STORE_DOMAIN}/admin/api/${API_VERSION}/products.json`;
  const body = {
    product: {
      title: product.handle,
      handle: product.handle,
      product_type: product.category || 'Fragrance',
      vendor: product.primary_brand || 'SOLO NECESSITO',
      tags: Array.isArray(product.tags) ? product.tags.join(', ') : '',
      status: 'active',
      variants: [
        {
          price: product?.price?.regular ?? 49.99,
          sku: product.sku || undefined,
          requires_shipping: true,
          inventory_management: null,
          inventory_policy: 'deny',
          option1: 'Default Title'
        }
      ]
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': ADMIN_TOKEN,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Falha ao criar produto [${product.handle}] - ${response.status} ${response.statusText} - ${text}`);
  }

  const data = await response.json();
  return data.product;
}

// Anexa imagem ao produto criado
async function attachImageToProduct(productId, imageBuffer, filename) {
  const url = `https://${STORE_DOMAIN}/admin/api/${API_VERSION}/products/${productId}/images.json`;
  const base64 = imageBuffer.toString('base64');
  const body = {
    image: {
      attachment: base64,
      filename
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': ADMIN_TOKEN,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Falha ao anexar imagem ao produto ${productId} - ${response.status} ${response.statusText} - ${text}`);
  }

  const data = await response.json();
  return data.image;
}

// Função para deletar um produto por ID
async function deleteProductById(productId) {
  const url = `https://${STORE_DOMAIN}/admin/api/${API_VERSION}/products/${productId}.json`;
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'X-Shopify-Access-Token': ADMIN_TOKEN,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Falha ao apagar produto ${productId} - ${response.status} ${response.statusText} - ${text}`);
  }

  return true;
}

async function main() {
  console.log('🚀 Iniciando criação de produtos na loja SOLO NECESSITO (Store 2)');
  console.log(`🔧 Loja: ${STORE_DOMAIN} | API versão: ${API_VERSION}`);
  console.log(`📄 Fonte: ${UNIFIED_PATH}`);

  if (!fs.existsSync(UNIFIED_PATH)) {
    console.error('❌ Arquivo unified_products_en_gbp.json não encontrado.');
    process.exit(1);
  }
  if (!fs.existsSync(IMAGE_PATH)) {
    console.error('❌ Imagem public/imagem_dos_produtos.jpg não encontrada.');
    process.exit(1);
  }

  const unified = JSON.parse(fs.readFileSync(UNIFIED_PATH, 'utf8'));
  const products = unified.products || [];
  if (products.length === 0) {
    console.error('❌ Nenhum produto encontrado na fonte unificada.');
    process.exit(1);
  }

  // Carregar produtos existentes para evitar duplicações
  const existing = await fetchAllProductsAdmin();
  const existingHandles = new Set(existing.map(p => p.handle));
  console.log(`📦 Produtos já existentes na loja: ${existing.length}`);

  const imageBuffer = fs.readFileSync(IMAGE_PATH);

  let createdCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  const slice = products.slice(OFFSET, OFFSET + LIMIT);
  for (const p of slice) {
    try {
      if (existingHandles.has(p.handle)) {
        console.log(`⏭️  Pulando (já existe): ${p.handle}`);
        skippedCount++;
        continue;
      }

      const created = await createProduct(p);
      console.log(`✅ Criado: ${created.handle} (ID: ${created.id})`);

      // anexar imagem padrão
      try {
        const image = await attachImageToProduct(created.id, imageBuffer, 'imagem_dos_produtos.jpg');
        console.log(`🖼️  Imagem anexada ao produto ${created.id} (Image ID: ${image.id})`);
      } catch (imgErr) {
        console.warn(`⚠️  Falha ao anexar imagem para ${created.handle}: ${imgErr.message}`);
      }

      createdCount++;
      await wait(DELAY_MS);
    } catch (err) {
      console.error(`❌ Erro ao criar produto ${p.handle}:`, err.message);
      errorCount++;
      await wait(DELAY_MS);
    }
  }

  console.log('\n📊 Resultado:');
  console.log(`• Criados: ${createdCount}`);
  console.log(`• Pulados: ${skippedCount}`);
  console.log(`• Erros: ${errorCount}`);

  if (errorCount === 0) {
    console.log('\n✅ Script executado com sucesso!');
  } else {
    console.log('\n⚠️ Script finalizado com alguns erros.');
  }
}

// Função para deletar os primeiros N produtos do unified_products_en_gbp.json
async function deleteFirstNProductsFromUnified(count) {
  console.log(`🗑️  Apagando os primeiros ${count} produtos conforme unified_products_en_gbp.json...`);

  if (!fs.existsSync(UNIFIED_PATH)) {
    console.error('❌ Arquivo unified_products_en_gbp.json não encontrado.');
    process.exit(1);
  }

  const unified = JSON.parse(fs.readFileSync(UNIFIED_PATH, 'utf8'));
  const handles = (unified.products || []).slice(0, count).map(p => p.handle);

  const existing = await fetchAllProductsAdmin();
  const byHandle = new Map(existing.map(p => [p.handle, p]));

  let deleted = 0;
  let missing = 0;
  let errors = 0;

  for (const h of handles) {
    const prod = byHandle.get(h);
    if (!prod) {
      console.log(`⚠️  Não encontrado na loja: ${h}`);
      missing++;
      continue;
    }

    try {
      await deleteProductById(prod.id);
      console.log(`🗑️  Apagado: ${h} (ID: ${prod.id})`);
      deleted++;
      await wait(200);
    } catch (err) {
      console.warn(`❌ Falha ao apagar ${h}: ${err.message}`);
      errors++;
    }
  }

  console.log('\n📊 Exclusão:');
  console.log(`• Deletados: ${deleted}`);
  console.log(`• Não encontrados: ${missing}`);
  console.log(`• Erros: ${errors}`);
}

if (require.main === module) {
  // Node 18+ possui fetch nativo; caso sua versão não possua, instrua instalar node-fetch.
  if (typeof fetch !== 'function') {
    console.error('❌ Ambiente Node sem fetch nativo. Use Node 18+ ou instale node-fetch.');
    process.exit(1);
  }
  // Suporte a modo de exclusão: --delete-first <N>
  const deleteFirstArg = (process.argv.includes('--delete-first') ? process.argv[process.argv.indexOf('--delete-first') + 1] : null) || null;
  if (deleteFirstArg !== null && deleteFirstArg !== undefined) {
    const count = parseInt(deleteFirstArg, 10) || 10;
    deleteFirstNProductsFromUnified(count)
      .then(() => process.exit(0))
      .catch(err => {
        console.error('❌ Erro fatal:', err.message);
        process.exit(1);
      });
  } else {
    main().catch(err => {
      console.error('❌ Erro fatal:', err.message);
      process.exit(1);
    });
  }
}