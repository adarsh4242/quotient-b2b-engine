import mongoose from 'mongoose';

const historySchema = new mongoose.Schema({
  senderRole: { type: String, enum: ['buyer', 'sales', 'admin', 'system'], required: true },
  unitPrice: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  timestamp: { type: Date, default: Date.now },
  note: { type: String, trim: true, maxlength: 300 }
}, { _id: false, strict: 'throw' });

const paymentTerms = ['NET_15', 'NET_30', 'NET_60', 'NET_90', 'MILESTONE'];

const quoteSchema = new mongoose.Schema({
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  requestedQty: { type: Number, required: true, min: 1 },
  offeredUnitPrice: { type: Number, required: true, min: 0 },
  counterUnitPrice: { type: Number, min: 0 },
  paymentTerms: { type: String, enum: paymentTerms, default: 'NET_30', index: true },
  customPaymentTerms: { type: String, trim: true, maxlength: 500 },
  paymentTermAdjustmentPercentage: { type: Number, min: -100, max: 100, default: 0 },
  paymentTermAdjustmentAmount: { type: Number, default: 0 },
  paymentTermGuardrailBreached: { type: Boolean, default: false },
  fulfillmentQuantity: { type: Number, min: 0 },
  backorderQuantity: { type: Number, min: 0, default: 0 },
  restockLeadTimeDays: { type: Number, min: 0, default: 0 },
  stockFulfillmentStatus: { type: String, enum: ['in_stock', 'partial', 'backorder'], default: 'in_stock' },
  status: { type: String, enum: ['pending', 'approved', 'countered', 'rejected', 'expired'], default: 'pending', index: true },
  history: { type: [historySchema], default: [] },
  turnCount: { type: Number, default: 0, min: 0 },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 48 * 60 * 60 * 1000), index: true },
  approvedAt: { type: Date, index: true },
  pdfGeneratedAt: { type: Date }
}, { timestamps: true, strict: 'throw' });

quoteSchema.index({ buyerId: 1, createdAt: -1 });
quoteSchema.index({ status: 1, expiresAt: 1 });

export default mongoose.model('Quote', quoteSchema);