import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

// Use anon key for JWT verification (not service_role)
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

// Extend Express Request to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email?: string };
    }
  }
}

/**
 * Auth middleware — verifies Supabase JWT from Authorization header.
 * Rejects with 401 if missing or invalid.
 * Attaches req.user = { id, email } on success.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Auth middleware: missing SUPABASE_URL or SUPABASE_ANON_KEY');
    return res.status(500).json({ error: 'Server auth not configured' });
  }

  try {
    // Create a temporary client with the user's JWT to verify it
    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error } = await supabaseAuth.auth.getUser();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = { id: user.id, email: user.email };
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}
