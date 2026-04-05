import { Router, Request, Response } from 'express';
import { supabase } from '../services/supabase';

export const healthRouter = Router();

healthRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const { count, error } = await supabase
      .from('reef_animals')
      .select('*', { count: 'exact', head: true });

    res.json({
      status: 'ok',
      service: 'reef-tracker-api',
      timestamp: new Date().toISOString(),
      db: error ? 'error' : 'connected',
      animals: count ?? 0,
    });
  } catch {
    res.status(503).json({ status: 'degraded' });
  }
});
