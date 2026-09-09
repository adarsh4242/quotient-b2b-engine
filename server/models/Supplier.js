import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 160 },
  legalName: { type: String, trim: true, maxlength: 200 },
  email: { type: String, required: true, lowercase: true, trim: true, index: true },
  gstin: { type: String, trim: true, uppercase: true, index: true },
  isVerified: { type: Boolean, default: false, index: true },
  verificationTier: { type: String, enum: ['Gold', 'Silver', 'Unverified'], default: 'Unverified', index: true },
  gstinStatus: { type: String, enum: ['verified', 'pending', 'invalid', 'not_submitted'], default: 'not_submitted' },
  businessAgeYears: { type: Number, min: 0, default: 0 },
  complianceScore: { type: Number, min: 0, max: 100, default: 0 },
  tradeHistory: { completedOrders: { type: Number, min: 0, default: 0 }, disputeRate: { type: Number, min: 0, max: 100, default: 0 } },
  documents: [{ name: { type: String, required: true }, status: { type: String, enum: ['verified', 'pending', 'rejected'], default: 'pending' } }],
  buyerRatings: [{ score: { type: Number, min: 1, max: 5, required: true }, comment: String }],
  verificationNotes: { type: String, maxlength: 1000 },
  verifiedAt: Date
}, { timestamps: true, strict: 'throw' });

supplierSchema.virtual('verificationBadge').get(function verificationBadge() {
  return this.verificationTier === 'Gold' ? 'Gold Verified' : this.verificationTier === 'Silver' ? 'Silver Verified' : 'Unverified';
});

supplierSchema.set('toJSON', { virtuals: true });
supplierSchema.set('toObject', { virtuals: true });

export default mongoose.model('Supplier', supplierSchema);