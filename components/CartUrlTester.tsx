'use client';

import { useState } from 'react';
import { createDirectCheckoutUrl } from '@/lib/clientCheckout';

interface CartItem {
  shopifyId: string;
  quantity: number;
}

export default function CartUrlTester() {
  const [items, setItems] = useState<CartItem[]>([
    { shopifyId: '50384400482589', quantity: 1 } // Variant ID da Store 1 (EURO PRIDE) - 3-piece-premium-fragrance-collection-set-1
  ]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const addItem = () => {
    setItems([...items, { shopifyId: '', quantity: 1 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof CartItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const testCheckout = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = createDirectCheckoutUrl(items);
      setResult(response);
    } catch (error) {
      setResult({ error: 'Erro na requisição', details: error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Teste de Checkout - EURO PRIDE
      </h1>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Configuração da Loja</h2>
        <div className="bg-blue-50 p-4 rounded-lg">
          <p><strong>Loja:</strong> EURO PRIDE (Store 1)</p>
          <p><strong>Domínio:</strong> ton-store-1656.myshopify.com</p>
          <p><strong>Produto Padrão:</strong> 3-Piece Fragrance Set</p>
          <p><strong>Variant ID (exemplo):</strong> 50384400482589</p>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Itens do Carrinho</h2>
        
        {items.map((item, index) => (
          <div key={index} className="flex gap-4 mb-3 p-4 border rounded-lg">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Variant ID</label>
              <input
                type="text"
                value={item.shopifyId}
                onChange={(e) => updateItem(index, 'shopifyId', e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Ex: 50384400482589"
              />
            </div>
            <div className="w-24">
              <label className="block text-sm font-medium mb-1">Qtd</label>
              <input
                type="number"
                value={item.quantity}
                onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                className="w-full p-2 border rounded"
                min="1"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => removeItem(index)}
                className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Remover
              </button>
            </div>
          </div>
        ))}

        <div className="flex gap-4">
          <button
            onClick={addItem}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Adicionar Item
          </button>
          
          <button
            onClick={testCheckout}
            disabled={loading || items.length === 0}
            className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
          >
            {loading ? 'Testando...' : 'Testar Checkout'}
          </button>
        </div>
      </div>

      {result && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Resultado do Teste</h2>
          
          {result.checkoutUrl ? (
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-green-800 font-semibold mb-2">✅ Checkout criado com sucesso!</p>
              <p className="mb-2"><strong>URL do Checkout:</strong></p>
              <a 
                href={result.checkoutUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline break-all"
              >
                {result.checkoutUrl}
              </a>
              <div className="mt-4">
                <button
                  onClick={() => window.open(result.checkoutUrl, '_blank')}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Abrir Checkout
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-red-800 font-semibold mb-2">❌ Erro no checkout</p>
              <p className="mb-2"><strong>Erro:</strong> {result.error}</p>
              {result.details && (
                <div className="mt-2">
                  <p className="font-medium">Detalhes:</p>
                  <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Exemplos de Produtos da Store 1 (EURO PRIDE):</h3>
        <div className="text-sm space-y-1">
          <p><strong>3-piece-premium-fragrance-collection-set-1:</strong> 50384400482589</p>
          <p><strong>3-piece-premium-fragrance-collection-set-18:</strong> 50384401465629</p>
          <p><strong>3-piece-premium-fragrance-collection-set-25:</strong> 50384403398941</p>
          <p><strong>3-piece-premium-fragrance-collection-set-44:</strong> 50384403562781</p>
          <p className="text-gray-600 italic">IDs baseados em public/data/shopify_variant_mapping.json</p>
        </div>
      </div>
    </div>
  );
}