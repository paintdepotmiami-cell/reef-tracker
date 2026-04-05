import { Router, Request, Response } from 'express';
import { supabase } from '../services/supabase';

export const inventoryRouter = Router();

// Get all animals grouped by type
inventoryRouter.get('/', async (req: Request, res: Response) => {
  const type = req.query.type as string | undefined;
  let query = supabase.from('reef_animals').select('*').order('name');

  if (type) query = query.eq('type', type);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Get single animal
inventoryRouter.get('/:id', async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('reef_animals')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: 'Not found' });
  res.json(data);
});

// Create animal
inventoryRouter.post('/', async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('reef_animals')
    .insert(req.body)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// Update animal
inventoryRouter.patch('/:id', async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('reef_animals')
    .update({ ...req.body, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Delete animal
inventoryRouter.delete('/:id', async (req: Request, res: Response) => {
  const { error } = await supabase
    .from('reef_animals')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// Equipment endpoints
export const equipmentRouter = Router();

equipmentRouter.get('/', async (_req: Request, res: Response) => {
  const { data, error } = await supabase.from('reef_equipment').select('*').order('category');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

equipmentRouter.post('/', async (req: Request, res: Response) => {
  const { data, error } = await supabase.from('reef_equipment').insert(req.body).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// Supplements endpoints
export const supplementsRouter = Router();

supplementsRouter.get('/', async (_req: Request, res: Response) => {
  const { data, error } = await supabase.from('reef_supplements').select('*').order('name');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

supplementsRouter.post('/', async (req: Request, res: Response) => {
  const { data, error } = await supabase.from('reef_supplements').insert(req.body).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// Maintenance log
export const maintenanceRouter = Router();

maintenanceRouter.get('/', async (_req: Request, res: Response) => {
  const { data, error } = await supabase.from('reef_maintenance').select('*').order('date', { ascending: false }).limit(50);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

maintenanceRouter.post('/', async (req: Request, res: Response) => {
  const { data, error } = await supabase.from('reef_maintenance').insert(req.body).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});
