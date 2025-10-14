import { useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'

export default function CheckoutSuccess() {
  const router = useRouter()
  const { clearCart } = useCart()
  const { session_id } = router.query

  useEffect(() => {
    // Limpar o carrinho quando a página de sucesso é carregada
    if (session_id) {
      clearCart()
    }
  }, [session_id, clearCart])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
        <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
        
        <h1 className="text-2xl font-bold mb-2">Pagamento Confirmado!</h1>
        <p className="text-gray-600 mb-6">
          Seu pedido foi processado com sucesso. Você receberá um email com os detalhes da sua compra.
        </p>
        
        {session_id && (
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <p className="text-sm text-gray-500">ID da transação:</p>
            <p className="text-xs font-mono break-all">{session_id}</p>
          </div>
        )}
        
        <div className="space-y-4">
          <Link href="/" className="block w-full bg-black text-white py-3 rounded-full font-medium hover:bg-gray-900">
            Voltar para a loja
          </Link>
          
          <Link href="/collections/mens" className="block w-full bg-white text-black border border-black py-3 rounded-full font-medium hover:bg-gray-50">
            Ver mais perfumes
          </Link>
        </div>
      </div>
    </div>
  )
}