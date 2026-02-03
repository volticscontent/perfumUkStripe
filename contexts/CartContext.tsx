import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { usePixel } from '@/hooks/usePixel'
import { useUTM } from '@/hooks/useUTM'
import { validateAndFixCartItem, initializeAutoCleanup } from '@/lib/cacheCleanup'
import stripeVariantMapping from '../data/stripe_variant_mapping.json'
import stripeProductMapping from '../data/stripe_product_mapping.json'
import { stripe } from '@/lib/stripe'

interface CartItem {
  id: number
  handle: string
  stripeId?: string // ID do preço no Stripe
  title: string
  subtitle: string
  price: number
  image: string
  quantity: number
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  removeItem: (id: number) => void
  updateQuantity: (id: number, quantity: number) => void
  clearCart: () => void
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  total: number
  initiateCheckout: () => void
  utm_campaign: string | null
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const pixel = usePixel()
  const { utmParams } = useUTM()

  // Inicializar limpeza automática de cache quando o componente monta
  useEffect(() => {
    initializeAutoCleanup()
  }, [])
  
  const addItem = (newItem: Omit<CartItem, 'quantity'>, quantity: number = 1) => {
    // Validar e corrigir IDs obsoletos antes de adicionar
    const validatedItem = validateAndFixCartItem(newItem)
    if (!validatedItem) {
      console.error('Item com ID obsoleto rejeitado:', newItem)
      return
    }

    // Se o item já tem stripeId, usar ele diretamente
    let stripeId = validatedItem.stripeId || ''
    
    // Se não tem stripeId, tentar obter do mapeamento
    if (!stripeId) {
      const handle = validatedItem.handle || ''
      
      // Verificar primeiro no mapeamento de variantes (que é um objeto simples)
      stripeId = stripeVariantMapping[handle as keyof typeof stripeVariantMapping] || ''
      
      // Se não encontrar, verificar no mapeamento de produtos (que tem estrutura diferente)
      if (!stripeId && handle in stripeProductMapping) {
        const productMapping = stripeProductMapping[handle as keyof typeof stripeProductMapping]
        if (typeof productMapping === 'object' && productMapping !== null && 'price_id' in productMapping) {
          stripeId = productMapping.price_id
        }
      }
    }
    
    // Item com ID do Stripe
    const itemWithStripeId = {
      ...validatedItem,
      stripeId
    }

    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === itemWithStripeId.id)
      
      if (existingItem) {
        // Atualizar quantidade
        const updatedItems = prevItems.map(item =>
          item.id === itemWithStripeId.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
        
        // Rastrear evento AddToCart
        pixel.addToCart({
          value: itemWithStripeId.price * quantity,
          currency: 'GBP',
          content_name: itemWithStripeId.title,
          content_ids: [itemWithStripeId.id]
        })

        return updatedItems
      }

      // Adicionar novo item
      pixel.addToCart({
        value: itemWithStripeId.price * quantity,
        currency: 'GBP',
        content_name: itemWithStripeId.title,
        content_ids: [itemWithStripeId.id]
      })

      return [...prevItems, { ...itemWithStripeId, quantity }]
    })
    setIsOpen(true)
  }

  const removeItem = (id: number) => {
    setItems(items => items.filter(item => item.id !== id))
  }

  const updateQuantity = (id: number, delta: number) => {
    setItems(items =>
      items.map(item =>
        item.id === id
          ? { ...item, quantity: Math.max(1, Math.min(10, item.quantity + delta)) }
          : item
      )
    )
  }

  const clearCart = () => {
    setItems([])
  }

  const initiateCheckout = async () => {
    // Rastrear evento InitiateCheckout antes de redirecionar para Stripe
    pixel.initiateCheckout({
      value: total,
      currency: 'GBP',
      content_ids: items.map(item => item.id),
      num_items: items.length
    })

    try {
      // Criar checkout no Stripe
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: items.map(item => ({
            stripeId: item.stripeId,
            quantity: item.quantity
          })),
          utm_campaign: utmParams.utm_campaign || null
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao criar checkout')
      }

      const { checkoutUrl } = await response.json()
      
      // Redirecionar para o checkout do Stripe
      window.location.href = checkoutUrl
    } catch (error) {
      console.error('Erro ao iniciar checkout:', error)
      alert('Ocorreu um erro ao iniciar o checkout. Por favor, tente novamente.')
    }
  }

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isOpen,
        setIsOpen,
        total,
        initiateCheckout,
        utm_campaign: utmParams.utm_campaign || null
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}