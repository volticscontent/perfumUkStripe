import { useState, useEffect } from 'react'
import { useCart } from '@/contexts/CartContext'
import { useUTM } from '@/hooks/useUTM'
import CheckoutForm from '@/components/CheckoutForm'

export default function CheckoutPage() {
  const { items, total } = useCart()
  const { utmParams } = useUTM() // Garantir que as UTMs sejam carregadas na página de checkout

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Your basket is empty
          </h1>
          <p className="text-gray-600 mb-8 px-2">
            Add some products to your basket to continue with checkout.
          </p>
          <a
            href="/"
            className="bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition-colors"
          >
            Back to shop
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto bg-black h-16 flex items-center justify-center">
        <img src="/images/logo.avif" alt="logo" className="w-42 h-12 mt-12" />
      </div>
      <div className="max-w-4xl mx-auto mt-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Order Summary */}
          <div className="bg-white px-4 pb-8 shadow-sm">
            <h2 className="text-xl text-[#1b1b1b] font-semibold mb-6 mt-10">Order Summary</h2>
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center space-x-4">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-20 h-20 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium line-clamp-2">{item.title.replace(/3-Piece Fragrance\s*/gi, '')}</h3>
                    <p className="text-sm">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">£{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Checkout Form */}
          <div className="bg-white rounded-lg shadow-sm">
            <CheckoutForm items={items} />
          </div>
        </div>
      </div>
    </div>
  )
}