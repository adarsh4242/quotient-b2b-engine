import Product from '../models/Product.js';

const supplierFields = 'name legalName verificationTier verificationBadge isVerified gstinStatus businessAgeYears complianceScore tradeHistory documents buyerRatings';
export const listProducts = async (req, res) => res.json(await Product.find({ isActive: true }).populate('supplierId', supplierFields).sort({ createdAt: -1 }));
export const listAllProducts = async (req, res) => res.json(await Product.find().populate('supplierId', supplierFields).sort({ createdAt: -1 }));
export const createProduct = async (req, res) => res.status(201).json(await Product.create(req.body));
export const updateProduct = async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json(await Product.findById(product._id).populate('supplierId', supplierFields));
};
export const deleteProduct = async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json({ message: 'Product archived' });
};