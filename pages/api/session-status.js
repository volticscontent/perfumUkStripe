import { stripe } from '@/lib/stripe';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);

    res.send({
      status: session.status,
      customer_email: session.customer_details.email
    });
  } catch (err) {
    res.status(err.statusCode || 500).json(err.message);
  }
}