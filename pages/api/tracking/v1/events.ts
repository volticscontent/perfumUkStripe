import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Configurar headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Responder a requisições OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Aceita POST e GET para evitar erros no pixel.js
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Log do evento para debug (opcional)
    if (process.env.NODE_ENV === 'development') {
      console.log('[Tracking Endpoint Hit]', {
        method: req.method,
        query: req.query,
        body: req.body,
        timestamp: new Date().toISOString()
      });
    }

    // Resposta de sucesso simples
    const mockId = 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    res.status(200).json({ 
      success: true, 
      message: 'Event tracked successfully',
      timestamp: new Date().toISOString(),
      _id: mockId,
      id: mockId,
      data: {
        _id: mockId,
        id: mockId
      }
    });
  } catch (error) {
    console.error('[Tracking Error]', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to track event'
    });
  }
}