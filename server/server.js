// Must be first: ES modules evaluate imports before this file's body runs,
// so cloudinary.js would read undefined env vars if dotenv loaded later
import 'dotenv/config';

import path from 'path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';
import productRoutes from './routes/productRoutes.js';
import userRoutes from './routes/userRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import collectionRoutes from './routes/collectionRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import { sanitize, apiLimiter } from './middleware/securityMiddleware.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

connectDB();

const app = express();

// Render and Vercel sit behind a proxy, so rate limiting needs the real
// client IP rather than the proxy's
app.set('trust proxy', 1);

// Security headers. crossOriginResourcePolicy is relaxed because images
// are served from Cloudinary, a different origin.
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// 10mb so a large product CSV fits. The default 100kb rejects them.
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Strip Mongo operators from anything the client sends
app.use(sanitize);

app.use('/api', apiLimiter);

app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/customers', customerRoutes);

// Legacy: images uploaded before Cloudinary still live on disk.
// Safe to remove once no product references a /uploads path.
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/', (req, res) => {
  res.json({ message: 'API is running' });
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});