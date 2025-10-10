const fs = require('fs');
const path = require('path');

function fileExists(p) {
  try { return fs.existsSync(p); } catch { return false; }
}

function writeOutputs(simpleMapping) {
  // Escrever nos dois locais usados pela app: data/ e public/data/
  const outputDataPath = path.join(__dirname, 'data', 'shopify_variant_mapping.json');
  const outputPublicPath = path.join(__dirname, 'public', 'data', 'shopify_variant_mapping.json');

  fs.writeFileSync(outputDataPath, JSON.stringify(simpleMapping, null, 2));
  fs.writeFileSync(outputPublicPath, JSON.stringify(simpleMapping, null, 2));

  console.log('✅ shopify_variant_mapping.json atualizado com IDs da loja 2');
  console.log(`📊 ${Object.keys(simpleMapping).length} produtos convertidos`);
  console.log(`💾 Gravado em: ${outputDataPath}`);
  console.log(`💾 Gravado em: ${outputPublicPath}`);

  // Mostrar alguns exemplos
  console.log('\n📋 Exemplos de conversão:');
  Object.keys(simpleMapping).slice(0, 5).forEach(handle => {
    console.log(`  ${handle}: ${simpleMapping[handle]}`);
  });
}

function fromValidProductsMapping() {
  const store2MappingPath = path.join(__dirname, 'data', 'store2-valid-products-mapping.json');
  if (!fileExists(store2MappingPath)) return null;

  const store2Data = JSON.parse(fs.readFileSync(store2MappingPath, 'utf8'));
  const simpleMapping = {};

  Object.keys(store2Data).forEach(handle => {
    const product = store2Data[handle];
    if (product && product.variant_id) {
      simpleMapping[handle] = product.variant_id.toString();
    }
  });

  return simpleMapping;
}

function fromCheckoutMapping() {
  const mappingPath = path.join(__dirname, 'data', 'store2-checkout-mapping.json');
  if (!fileExists(mappingPath)) return null;

  const data = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
  const simpleMapping = {};

  // Duas estruturas possíveis:
  // 1) { mappings: { [productId]: { handle, variant_id } } }
  // 2) { [handle]: { variantId } }
  if (data && data.mappings && typeof data.mappings === 'object') {
    Object.values(data.mappings).forEach((m) => {
      if (m && m.handle && m.variant_id) {
        simpleMapping[m.handle] = m.variant_id.toString();
      }
    });
  } else if (data && typeof data === 'object') {
    Object.keys(data).forEach((handle) => {
      const m = data[handle];
      if (m && m.variantId) {
        simpleMapping[handle] = m.variantId.toString();
      }
    });
  }

  return Object.keys(simpleMapping).length ? simpleMapping : null;
}

function fromDetailedReport() {
  const reportPath = path.join(__dirname, 'data', 'store2-products-detailed-report.json');
  if (!fileExists(reportPath)) return null;

  try {
    const data = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    const products = data.products || [];
    const simpleMapping = {};

    products.forEach((p) => {
      const handle = p && p.handle;
      const variants = (p && p.variants) || [];
      if (handle && variants.length > 0) {
        let vid = variants[0].variantId || variants[0].id || variants[0].variant_id;
        if (typeof vid === 'string' && vid.startsWith('gid://shopify/ProductVariant/')) {
          vid = vid.split('/').pop();
        } else if (typeof vid === 'number') {
          vid = String(vid);
        }
        if (vid) {
          simpleMapping[handle] = vid;
        }
      }
    });

    return Object.keys(simpleMapping).length ? simpleMapping : null;
  } catch (e) {
    console.error('Erro ao ler store2-products-detailed-report.json:', e.message);
    return null;
  }
}

function fromProductsWithVariants() {
  const productsPath = path.join(__dirname, 'data', 'store2-products-with-variants.json');
  if (!fileExists(productsPath)) return null;

  const data = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
  const products = data.products || data?.products || [];
  const simpleMapping = {};

  products.forEach((p) => {
    if (p && p.handle && Array.isArray(p.variants) && p.variants.length > 0) {
      const firstVariant = p.variants[0];
      if (firstVariant && firstVariant.id) {
        simpleMapping[p.handle] = firstVariant.id.toString();
      }
    }
  });

  return Object.keys(simpleMapping).length ? simpleMapping : null;
}

function main() {
  let simpleMapping = fromDetailedReport();
  if (!simpleMapping) {
    simpleMapping = fromProductsWithVariants();
  }
  if (!simpleMapping) {
    simpleMapping = fromCheckoutMapping();
  }
  if (!simpleMapping) {
    simpleMapping = fromValidProductsMapping();
  }

  if (!simpleMapping || Object.keys(simpleMapping).length === 0) {
    console.error('❌ Não foi possível gerar shopify_variant_mapping.json. Nenhuma fonte encontrada.');
    console.error('   Verifique se um dos arquivos existe:');
    console.error('   - data/store2-products-detailed-report.json');
    console.error('   - data/store2-products-with-variants.json');
    console.error('   - data/store2-checkout-mapping.json');
    console.error('   - data/store2-valid-products-mapping.json');
    process.exit(1);
  }

  writeOutputs(simpleMapping);
}

if (require.main === module) {
  main();
}