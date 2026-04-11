import { Router, Request, Response } from 'express';
import { supabase } from '../services/supabase';
import multer from 'multer';

export const photosRouter = Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Allowed upload folders — prevents arbitrary path traversal
const ALLOWED_FOLDERS = ['general', 'tank', 'livestock', 'test', 'equipment', 'coral', 'fish'];

// Upload photo to Supabase Storage (scoped to authenticated user)
photosRouter.post('/upload', upload.single('photo'), async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const bucket = 'reef-photos';
  const userFolder = req.user!.id;
  const rawFolder = String(req.body.folder || 'general').replace(/[^a-zA-Z0-9_-]/g, '');
  const subfolder = ALLOWED_FOLDERS.includes(rawFolder) ? rawFolder : 'general';
  const safeName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filename = `${userFolder}/${subfolder}/${Date.now()}_${safeName}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filename, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: false,
    });

  if (error) return res.status(500).json({ error: error.message });

  // Signed URL (1 hour) — never expose public URLs for user content
  const { data: signedData, error: signErr } = await supabase.storage
    .from(bucket)
    .createSignedUrl(filename, 3600);

  res.json({
    path: data.path,
    url: signErr ? null : signedData.signedUrl,
    filename: req.file.originalname,
    size: req.file.size,
  });
});

// List photos in a folder (scoped to authenticated user)
photosRouter.get('/:folder', async (req: Request, res: Response) => {
  const userPath = `${req.user!.id}/${req.params.folder}`;
  const { data, error } = await supabase.storage
    .from('reef-photos')
    .list(userPath, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
