import path from 'path';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
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
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

dotenv.config();
connectDB();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/coupons', couponRoutes);

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