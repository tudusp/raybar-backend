import { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../src/server';

// Vercel serverless function handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers for Vercel
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Handle the request using the Express app
  return new Promise((resolve, reject) => {
    app(req, res, (err: any) => {
      if (err) {
        console.error('❌ Serverless function error:', err);
        reject(err);
      } else {
        resolve(undefined);
      }
    });
  });
}
