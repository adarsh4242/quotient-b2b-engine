import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 160 },
  sku: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
  description: { type: String, required: true, trim: true, maxlength: 1000 },
  category: { type: String, required: true, trim: true, index: true },
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', index: true },
  image: { type: String, default: '' },
  costPrice: { type: Number, min: 0 },
  minMarginPercentage: { type: Number, min: 0, max: 99.99 },
  currentStock: { type: Number, min: 0, default: 0, index: true },
  reservedStock: { type: Number, min: 0, default: 0 },
  leadTimeDays: { type: Number, min: 0, default: 0 },
  reorderPoint: { type: Number, min: 0, default: 0 },
  isActive: { type: Boolean, default: true, index: true }
}, { timestamps: true, strict: 'throw' });

productSchema.virtual('availableStock').get(function availableStock() {
  return Math.max(0, (this.currentStock || 0) - (this.reservedStock || 0));
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

export default mongoose.model('Product', productSchema);