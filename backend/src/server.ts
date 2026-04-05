import express from 'express';
import cors from 'cors';
import { healthRouter } from './routes/health';
import { testsRouter } from './routes/tests';
import { inventoryRouter, equipmentRouter, supplementsRouter, maintenanceRouter } from './routes/inventory';
import { photosRouter } from './routes/photos';

const app = express();
const PORT = process.env.PORT || 10000;

// Check required env vars
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  console.log('Starting in degraded mode...');
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/health', healthRouter);
app.use('/api/tests', testsRouter);
app.use('/api/animals', inventoryRouter);
app.use('/api/equipment', equipmentRouter);
app.use('/api/supplements', supplementsRouter);
app.use('/api/maintenance', maintenanceRouter);
app.use('/api/photos', photosRouter);

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Reef Tracker API running on port ${PORT}`);
});
