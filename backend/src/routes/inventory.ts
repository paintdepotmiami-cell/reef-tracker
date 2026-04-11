import { Router, Request, Response } from 'express';
import { supabase } from '../services/supabase';

export const inventoryRouter = Router();

// Get all animals for authenticated user
inventoryRouter.get('/', async (req: Request, res: Response) => {
  const type = req.query.type as string | undefined;
  let query = supabase.from('reef_animals').select('*').eq('user_id', req.user!.id).order('name');

  if (type) query = query.eq('type', type);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Get single animal (must belong to user)
inventoryRouter.get('/:id', async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('reef_animals')
    .select('*')
    .eq('id', req.params.id)
    .eq('user_id', req.user!.id)
    .single();

  if (error) {
    const status = error.code === 'PGRST116' ? 404 : 500;
    return res.status(status).json({ error: status === 404 ? 'Not found' : error.message });
  }
  res.json(data);
});

// Create animal (inject user_id)
inventoryRouter.post('/', async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('reef_animals')
    .insert({ ...req.body, user_id: req.user!.id })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// Update animal (must belong to user)
inventoryRouter.patch('/:id', async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('reef_animals')
    .update({ ...req.body, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .eq('user_id', req.user!.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Delete animal (must belong to user)
inventoryRouter.delete('/:id', async (req: Request, res: Response) => {
  const { error } = await supabase
    .from('reef_animals')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user!.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// Equipment endpoints
export const equipmentRouter = Router();

equipmentRouter.get('/', async (req: Request, res: Response) => {
  const { data, error } = await supabase.from('reef_equipment').select('*')
    .or(`user_id.eq.${req.user!.id},user_id.is.null`)
    .order('category');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

equipmentRouter.post('/', async (req: Request, res: Response) => {
  const { data, error } = await supabase.from('reef_equipment').insert({ ...req.body, user_id: req.user!.id }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// Supplements endpoints
export const supplementsRouter = Router();

supplementsRouter.get('/', async (req: Request, res: Response) => {
  const { data, error } = await supabase.from('reef_supplements').select('*')
    .or(`user_id.eq.${req.user!.id},user_id.is.null`)
    .order('name');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

supplementsRouter.post('/', async (req: Request, res: Response) => {
  const { data, error } = await supabase.from('reef_supplements').insert({ ...req.body, user_id: req.user!.id }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// Maintenance log
export const maintenanceRouter = Router();

maintenanceRouter.get('/', async (req: Request, res: Response) => {
  const { data, error } = await supabase.from('reef_maintenance').select('*')
    .eq('user_id', req.user!.id)
    .order('date', { ascending: false }).limit(50);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

maintenanceRouter.post('/', async (req: Request, res: Response) => {
  const { data, error } = await supabase.from('reef_maintenance').insert({ ...req.body, user_id: req.user!.id }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});
