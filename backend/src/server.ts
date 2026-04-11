import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { healthRouter } from './routes/health';
import { testsRouter } from './routes/tests';
import { inventoryRouter, equipmentRouter, supplementsRouter, maintenanceRouter } from './routes/inventory';
import { photosRouter } from './routes/photos';
import { requireAuth } from './middleware/auth';

const app = express();
const PORT = process.env.PORT || 10000;

// Validate env vars at startup (before lazy Supabase init)
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  console.log('Starting in degraded mode — API routes will fail until configured.');
}
if (!process.env.SUPABASE_ANON_KEY) {
  console.error('Missing SUPABASE_ANON_KEY — auth middleware will reject all requests');
}

// Security middleware
app.use(helmet());
app.use(cors({
  origin: ['https://reefos.net', 'https://reefos-planner.vercel.app', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting — 100 requests per 15 minutes per IP
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Public routes (no auth required)
app.use('/health', healthRouter);

// Protected routes (require valid Supabase JWT)
app.use('/api/tests', requireAuth, testsRouter);
app.use('/api/animals', requireAuth, inventoryRouter);
app.use('/api/equipment', requireAuth, equipmentRouter);
app.use('/api/supplements', requireAuth, supplementsRouter);
app.use('/api/maintenance', requireAuth, maintenanceRouter);
app.use('/api/photos', requireAuth, photosRouter);

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Reef Tracker API running on port ${PORT}`);
});
