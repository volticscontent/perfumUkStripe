import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function Return() {
  const router = useRouter();
  const [status, setStatus] = useState(null);
  const [customerEmail, setCustomerEmail] = useState('');

  useEffect(() => {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const sessionId = urlParams.get('session_id');

    if (sessionId) {
      fetch(`/api/session-status?session_id=${sessionId}`)
        .then((res) => res.json())
        .then((data) => {
          setStatus(data.status);
          setCustomerEmail(data.customer_email);
        });
    }
  }, []);

  if (status === 'open') {
    return (
      <div>
        <h1>Processando pagamento...</h1>
        <p>Aguarde enquanto processamos seu pagamento.</p>
      </div>
    );
  }

  if (status === 'complete') {
    return (
      <div>
        <h1>Pagamento realizado com sucesso!</h1>
        <p>
          Obrigado pelo seu pedido! Um e-mail de confirmação será enviado para {customerEmail}.
        </p>
        <button onClick={() => router.push('/')}>
          Voltar à loja
        </button>
      </div>
    );
  }

  return null;
}