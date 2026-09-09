import Supplier from '../models/Supplier.js';
import Product from '../models/Product.js';
import { applyVerification, calculateVerification } from '../utils/verificationEngine.js';

const supplierSummary = 'name legalName verificationTier verificationBadge isVerified gstinStatus businessAgeYears complianceScore tradeHistory documents buyerRatings verificationNotes verifiedAt';

export const listSuppliers = async (req, res) => res.json(await Supplier.find().sort({ createdAt: -1 }));

export const createSupplier = async (req, res) => {
  const supplier = applyVerification(await Supplier.create(req.body));
  await supplier.save();
  res.status(201).json(supplier);
};

export const reviewSupplier = async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);
  if (!supplier) return res.status(404).json({ message: 'Supplier not found' });
  Object.assign(supplier, req.body);
  applyVerification(supplier);
  await supplier.save();
  res.json(supplier);
};

export const verifySupplier = async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);
  if (!supplier) return res.status(404).json({ message: 'Supplier not found' });
  const { tier } = req.body;
  if (tier && !['Gold', 'Silver', 'Unverified'].includes(tier)) return res.status(400).json({ message: 'Invalid verification tier' });
  const calculated = calculateVerification(supplier);
  Object.assign(supplier, { ...calculated, ...(tier ? { verificationTier: tier, isVerified: tier !== 'Unverified' } : {}), verifiedAt: tier === 'Unverified' ? undefined : new Date() });
  await supplier.save();
  res.json(supplier);
};

export const listVerifiedSuppliers = async (req, res) => res.json(await Supplier.find({ isVerified: true }).select(supplierSummary));

export const supplierProducts = async (req, res) => res.json(await Product.find({ supplierId: req.params.id }).populate('supplierId', supplierSummary));