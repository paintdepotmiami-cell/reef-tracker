import { Router, Request, Response } from 'express';
import { supabase } from '../services/supabase';
import multer from 'multer';

export const photosRouter = Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Upload photo to Supabase Storage (scoped to authenticated user)
photosRouter.post('/upload', upload.single('photo'), async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const bucket = 'reef-photos';
  const userFolder = req.user!.id;
  const subfolder = String(req.body.folder || 'general');
  const filename = `${userFolder}/${subfolder}/${Date.now()}_${req.file.originalname}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filename, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: false,
    });

  if (error) return res.status(500).json({ error: error.message });

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filename);

  res.json({
    path: data.path,
    url: urlData.publicUrl,
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
