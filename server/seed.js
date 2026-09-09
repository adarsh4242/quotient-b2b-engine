import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { connectDB } from './config/db.js';
import User from './models/User.js';
import Product from './models/Product.js';
import PricingRule from './models/PricingRule.js';
import Supplier from './models/Supplier.js';

await connectDB();
const admin = await User.findOneAndUpdate({ email: 'admin@example.com' }, { name: 'Demo Admin', email: 'admin@example.com', password: await bcrypt.hash('Password123!', 12), role: 'admin' }, { upsert: true, new: true, setDefaultsOnInsert: true });
const supplierDefinitions = [
  { name: 'Apex Industrial Systems', legalName: 'Apex Industrial Systems Pvt Ltd', email: 'compliance@apex.example', gstin: '27AAPCA1234A1Z5', gstinStatus: 'verified', businessAgeYears: 12, tradeHistory: { completedOrders: 180, disputeRate: 1 }, documents: [{ name: 'Certificate of Incorporation', status: 'verified' }, { name: 'Tax Registration', status: 'verified' }], buyerRatings: [{ score: 4.7 }] },
  { name: 'Northstar Operations', legalName: 'Northstar Operations LLP', email: 'ops@northstar.example', gstin: '29AANPN4321B1Z2', gstinStatus: 'verified', businessAgeYears: 6, tradeHistory: { completedOrders: 54, disputeRate: 4 }, documents: [{ name: 'Certificate of Incorporation', status: 'verified' }, { name: 'Tax Registration', status: 'pending' }], buyerRatings: [{ score: 4.2 }] },
  { name: 'Vertex Edge Labs', legalName: 'Vertex Edge Labs', email: 'hello@vertex.example', gstinStatus: 'pending', businessAgeYears: 2, tradeHistory: { completedOrders: 8, disputeRate: 0 }, documents: [{ name: 'Certificate of Incorporation', status: 'pending' }], buyerRatings: [] }
];
const suppliers = [];
for (const definition of supplierDefinitions) { const supplier = await Supplier.findOneAndUpdate({ email: definition.email }, definition, { upsert: true, new: true, setDefaultsOnInsert: true }); suppliers.push(supplier); }
const productDefinitions = [
  { name: 'Industrial Sensor Array', sku: 'ISA-100', supplierId: suppliers[0]._id, description: 'High-precision sensor array for production monitoring.', category: 'Instrumentation', costPrice: 720, minMarginPercentage: 22, currentStock: 120, reservedStock: 0, leadTimeDays: 14, reorderPoint: 30, image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=900&q=80' },
  { name: 'Warehouse Scanner Pro', sku: 'WSP-200', supplierId: suppliers[1]._id, description: 'Rugged handheld scanner for high-throughput warehouses.', category: 'Operations', costPrice: 680, minMarginPercentage: 25, currentStock: 42, reservedStock: 0, leadTimeDays: 21, reorderPoint: 15, image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=900&q=80' },
  { name: 'Edge Compute Gateway', sku: 'ECG-300', supplierId: suppliers[2]._id, description: 'Secure edge gateway with local analytics and fleet management.', category: 'Infrastructure', costPrice: 760, minMarginPercentage: 24, currentStock: 8, reservedStock: 0, leadTimeDays: 30, reorderPoint: 10, image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=900&q=80' }
];
const products = [];
for (const definition of productDefinitions) products.push(await Product.findOneAndUpdate({ sku: definition.sku }, definition, { upsert: true, new: true, setDefaultsOnInsert: true }));
for (const product of products) await PricingRule.findOneAndUpdate({ productId: product._id }, { productId: product._id, baseUnitPrice: 1200, minimumMarginFloorPrice: 890, tierDiscounts: [{ minQty: 10, discountPercentage: 5 }, { minQty: 50, discountPercentage: 10 }, { minQty: 100, discountPercentage: 15 }], autoApprovalThreshold: 100, paymentTermAdjustments: [{ term: 'NET_15', adjustmentPercentage: -2, allowed: true }, { term: 'NET_30', adjustmentPercentage: 0, allowed: true }, { term: 'NET_60', adjustmentPercentage: 1.5, allowed: true }, { term: 'NET_90', adjustmentPercentage: 1.5, allowed: true }, { term: 'MILESTONE', adjustmentPercentage: 0, allowed: true }], maxPaymentTermDays: 90, allowMilestonePayments: true }, { upsert: true, new: true, setDefaultsOnInsert: true });
console.log(`Seed complete. Admin: ${admin.email} / Password123!`);
process.exit(0);