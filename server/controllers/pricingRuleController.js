import PricingRule from '../models/PricingRule.js';

export const listRules = async (req, res) => res.json(await PricingRule.find().populate('productId', 'name sku').sort({ updatedAt: -1 }));
export const getRuleForProduct = async (req, res) => {
  const rule = await PricingRule.findOne({ productId: req.params.productId });
  if (!rule) return res.status(404).json({ message: 'Pricing rule not found' });
  res.json(rule);
};
export const upsertRule = async (req, res) => res.json(await PricingRule.findOneAndUpdate({ productId: req.body.productId }, req.body, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }));