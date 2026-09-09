import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ['buyer', 'admin', 'sales'], default: 'buyer', index: true }
}, { timestamps: true, strict: 'throw' });

export default mongoose.model('User', userSchema);