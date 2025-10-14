// Checkout com Stripe
interface CartItem {
  shopifyId: string; // Mantemos o nome para compatibilidade, mas agora é o ID do Stripe
  quantity: number;
}

// Função principal para redirecionar direto para o checkout
export function redirectToCheckout(items: CartItem[]): void {
  try {
    // Usar sempre Stripe Checkout (não precisamos mais verificar useStripe)
    redirectToStripeCheckout(items);
  } catch (error) {
    console.error('❌ Erro crítico no checkout:', error);
    alert('Erro ao processar checkout. Tente novamente.');
  }
}

// Função para checkout com Stripe
export async function redirectToStripeCheckout(items: CartItem[]): Promise<void> {
  try {
    if (items.length === 0) {
      console.error('Carrinho vazio');
      alert('Seu carrinho está vazio.');
      return;
    }

    console.log('📦 Itens validados do carrinho:', items);

    // Formatar itens para o formato esperado pela API
    const formattedItems = items.map(item => ({
      price_id: item.shopifyId, // ID do preço no Stripe
      quantity: item.quantity
    }));

    // Chamar a API para criar a sessão de checkout
    const response = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: formattedItems,
        success_url: `${window.location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${window.location.origin}/checkout/cancel`,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro ao criar sessão de checkout');
    }

    const { url } = await response.json();
    
    if (url) {
      console.log('✅ Redirecionando para Stripe Checkout:', url);
      window.location.href = url;
    } else {
      throw new Error('Não foi possível obter a URL de checkout');
    }
  } catch (error) {
    console.error('❌ Erro no checkout:', error);
    alert('Erro ao processar checkout. Tente novamente.');
  }
}