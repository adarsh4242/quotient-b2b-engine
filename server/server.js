import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import pricingRuleRoutes from './routes/pricingRuleRoutes.js';
import negotiationRoutes from './routes/negotiationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import supplierRoutes from './routes/supplierRoutes.js';
import { startQuoteExpiryCron } from './jobs/quoteExpiryCron.js';
import { notFound, errorHandler } from './middlewares/errorMiddleware.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173', methods: ['GET', 'POST', 'PUT', 'DELETE'] } });
app.set('io', io);
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
app.get('/', (req, res) => res.json({ name: 'B2B Negotiation Engine API', status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/pricing-rules', pricingRuleRoutes);
app.use('/api/negotiation', negotiationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/suppliers', supplierRoutes);
io.on('connection', (socket) => {
  socket.on('join_buyer_room', (buyerId) => {
    if (buyerId) socket.join(`buyer:${buyerId}`);
  });
  socket.on('join_sales_room', () => socket.join('sales'));
});
app.use(notFound);
app.use(errorHandler);

const port = Number(process.env.PORT || 5000);
connectDB().then(() => {
  startQuoteExpiryCron(io);
  server.listen(port, () => console.log(`API listening on port ${port}`));
}).catch((error) => {
  console.error(error.message);
  process.exit(1);
});