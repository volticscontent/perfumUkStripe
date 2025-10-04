import { useState } from 'react'
import { useCart } from '@/contexts/CartContext'
import { 
  cleanAllObsoleteCaches, 
  isObsoleteVariantId, 
  getCorrectVariantId,
  validateAndFixCartItem 
} from '@/lib/cacheCleanup'

export default function ObsoleteIdTester() {
  const { addItem, items, clearCart } = useCart()
  const [testResults, setTestResults] = useState<string[]>([])

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testObsoleteId = () => {
    addTestResult('🧪 Testando adição de item com ID obsoleto...')
    
    // Tentar adicionar item com ID obsoleto
    const obsoleteItem = {
      id: 31,
      shopifyId: '51243679383839', // ID obsoleto
      storeId: '1',
      title: '3-piece-premium-fragrance-collection-set-31',
      subtitle: 'Eau de Parfum Spray - 100ML',
      price: 49.99,
      image: '/images/placeholder.jpg'
    }
    
    addTestResult(`Tentando adicionar item com ID obsoleto: ${obsoleteItem.shopifyId}`)
    addItem(obsoleteItem, 1)
    
    // Verificar se o ID foi corrigido
    setTimeout(() => {
      const currentItems = items
      const addedItem = currentItems.find(item => item.id === 31)
      
      if (addedItem) {
        if (addedItem.shopifyId === '51141199855928') {
          addTestResult('✅ SUCESSO: ID obsoleto foi automaticamente corrigido!')
        } else {
          addTestResult(`❌ FALHA: ID não foi corrigido. ID atual: ${addedItem.shopifyId}`)
        }
      } else {
        addTestResult('❌ FALHA: Item não foi adicionado ao carrinho')
      }
    }, 100)
  }

  const testValidation = () => {
    addTestResult('🧪 Testando validação de IDs...')
    
    const obsoleteId = '51243679383839'
    const correctId = '51141199855928'
    
    addTestResult(`ID obsoleto detectado: ${isObsoleteVariantId(obsoleteId)}`)
    addTestResult(`ID correto obtido: ${getCorrectVariantId(obsoleteId)}`)
    
    const testItem = {
      id: 999,
      shopifyId: obsoleteId,
      title: 'Teste',
      price: 49.99
    }
    
    const validatedItem = validateAndFixCartItem(testItem)
    if (validatedItem && validatedItem.shopifyId === correctId) {
      addTestResult('✅ Validação funcionando corretamente')
    } else {
      addTestResult('❌ Validação falhou')
    }
  }

  const testCacheCleanup = () => {
    addTestResult('🧪 Testando limpeza de cache...')
    
    // Adicionar dados de teste ao localStorage
    localStorage.setItem('test_obsolete', JSON.stringify({
      variantId: '51243679383839',
      data: 'test'
    }))
    
    addTestResult('Dados de teste adicionados ao localStorage')
    
    // Executar limpeza
    cleanAllObsoleteCaches()
    
    // Verificar se foi limpo
    const cleanedData = localStorage.getItem('test_obsolete')
    if (cleanedData) {
      const parsed = JSON.parse(cleanedData)
      if (parsed.variantId === '51141199855928') {
        addTestResult('✅ Cache limpo e corrigido com sucesso')
      } else {
        addTestResult('❌ Cache não foi corrigido')
      }
    } else {
      addTestResult('❌ Dados de teste foram removidos')
    }
  }

  const clearResults = () => {
    setTestResults([])
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-md z-50">
      <h3 className="text-lg font-bold mb-3">🔧 Teste de IDs Obsoletos</h3>
      
      <div className="space-y-2 mb-4">
        <button
          onClick={testObsoleteId}
          className="w-full bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600"
        >
          Testar Adição com ID Obsoleto
        </button>
        
        <button
          onClick={testValidation}
          className="w-full bg-green-500 text-white px-3 py-2 rounded text-sm hover:bg-green-600"
        >
          Testar Validação de IDs
        </button>
        
        <button
          onClick={testCacheCleanup}
          className="w-full bg-purple-500 text-white px-3 py-2 rounded text-sm hover:bg-purple-600"
        >
          Testar Limpeza de Cache
        </button>
        
        <button
          onClick={clearCart}
          className="w-full bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600"
        >
          Limpar Carrinho
        </button>
        
        <button
          onClick={clearResults}
          className="w-full bg-gray-500 text-white px-3 py-2 rounded text-sm hover:bg-gray-600"
        >
          Limpar Resultados
        </button>
      </div>
      
      <div className="border-t pt-3">
        <h4 className="font-semibold mb-2">Resultados dos Testes:</h4>
        <div className="max-h-40 overflow-y-auto text-xs space-y-1">
          {testResults.length === 0 ? (
            <p className="text-gray-500">Nenhum teste executado ainda</p>
          ) : (
            testResults.map((result, index) => (
              <div key={index} className="p-1 bg-gray-50 rounded">
                {result}
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className="mt-3 text-xs text-gray-600">
        <p><strong>Itens no carrinho:</strong> {items.length}</p>
        {items.length > 0 && (
          <div className="mt-1">
            {items.map(item => (
              <div key={item.id} className="text-xs">
                ID: {item.shopifyId} - {item.title}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}