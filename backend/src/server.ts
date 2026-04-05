import express from 'express';
import cors from 'cors';
import { healthRouter } from './routes/health';
import { testsRouter } from './routes/tests';
import { inventoryRouter, equipmentRouter, supplementsRouter, maintenanceRouter } from './routes/inventory';
import { photosRouter } from './routes/photos';

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
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

// Start
app.listen(PORT, () => {
  console.log(`Reef Tracker API running on port ${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health`);
});
