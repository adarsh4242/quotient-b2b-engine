import mongoose from 'mongoose';

const tierSchema = new mongoose.Schema({
  minQty: { type: Number, required: true, min: 1 },
  discountPercentage: { type: Number, required: true, min: 0, max: 100 }
}, { _id: false, strict: 'throw' });

const paymentTermAdjustmentSchema = new mongoose.Schema({
  term: { type: String, enum: ['NET_15', 'NET_30', 'NET_60', 'NET_90', 'MILESTONE'], required: true },
  adjustmentPercentage: { type: Number, min: -100, max: 100, required: true },
  allowed: { type: Boolean, default: true }
}, { _id: false, strict: 'throw' });

const pricingRuleSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, unique: true, index: true },
  baseUnitPrice: { type: Number, required: true, min: 0 },
  minimumMarginFloorPrice: { type: Number, required: true, min: 0 },
  tierDiscounts: { type: [tierSchema], default: [] },
  autoApprovalThreshold: { type: Number, min: 0 },
  paymentTermAdjustments: { type: [paymentTermAdjustmentSchema], default: [] },
  maxPaymentTermDays: { type: Number, min: 0, default: 90 },
  allowMilestonePayments: { type: Boolean, default: true }
}, { timestamps: true, strict: 'throw' });

export default mongoose.model('PricingRule', pricingRuleSchema);