import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth';
import salesRoutes from './routes/sales';
import purchaseRoutes from './routes/purchase';
import inventoryRoutes from './routes/inventory';
import productionRoutes from './routes/production';
import cashRoutes from './routes/cash';
import reportsRoutes from './routes/reports';
import managementRoutes from './routes/management';
import assetsRoutes from './routes/assets';

dotenv.config();

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3001;

// Test database connection
async function testConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/sales', salesRoutes);
app.use('/api/v1/purchase', purchaseRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/production', productionRoutes);
app.use('/api/v1/cash', cashRoutes);
app.use('/api/v1/reports', reportsRoutes);
app.use('/api/v1/management', managementRoutes);
app.use('/api/v1/assets', assetsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, async () => {
  await testConnection();
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});