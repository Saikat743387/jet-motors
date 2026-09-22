import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';
import { connectDb } from './config/db.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { ApiError } from './utils/apiError.js';
import { asyncHandler } from './utils/asyncHandler.js';
import { findImage, imageStream } from './utils/uploads.js';
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import depositRoutes from './routes/deposit.routes.js';
import withdrawalRoutes from './routes/withdrawal.routes.js';
import teamRoutes from './routes/team.routes.js';
import userRoutes from './routes/user.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { publicSettings } from './controllers/user.controller.js';
import { backfillDepositBalance, ensureAdmin, seedIfEmpty } from './seed/seed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.set('trust proxy', 1);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
const corsOptions = {
  credentials: true,
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    const normalized = origin.replace(/\/+$/, '');
    if (normalized.endsWith('.vercel.app')) return cb(null, true);
    if (env.allowedOrigins.length === 0) return cb(null, true);
    if (env.allowedOrigins.includes(normalized)) return cb(null, true);
    if (normalized === 'http://localhost:5173' || normalized === 'http://localhost:5174') return cb(null, true);
    return cb(new Error(`CORS blocked for origin: ${origin}`));
  },
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(morgan(env.isProd ? 'combined' : 'dev'));
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === '/api/health',
  })
);

app.get(
  '/uploads/:filename',
  asyncHandler(async (req, res) => {
    const file = await findImage(req.params.filename);
    if (!file) throw new ApiError(404, 'Image not found');
    res.setHeader('Content-Type', file.contentType || 'application/octet-stream');
    res.setHeader('Content-Length', String(file.length));
    imageStream(req.params.filename).pipe(res);
  })
);

app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

app.get('/api/health', (_req, res) => res.json({ ok: true, name: 'JET MOTORS' }));
app.get('/api/debug/db', asyncHandler(async (_req, res) => {
  const mongoose = (await import('mongoose')).default;
  res.json({ db: mongoose.connection.name, host: mongoose.connection.host, readyState: mongoose.connection.readyState });
}));
app.get('/api/settings', publicSettings);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/deposits', depositRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/me', userRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

const start = async () => {
  await connectDb();
  await ensureAdmin();
  await seedIfEmpty();
  await backfillDepositBalance();
  app.listen(env.port, () => {
    console.log(`JET MOTORS API listening on :${env.port}`);
  });
};

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
