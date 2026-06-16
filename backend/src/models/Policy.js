import mongoose from 'mongoose';

export const CATEGORIES = [
  'Graphic Violence',
  'Hate Symbols',
  'Self-Harm',
  'Extremist Propaganda',
  'Weapons & Contraband',
  'Harassment & Humiliation',
];

const policySchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: CATEGORIES,
      required: true,
      unique: true,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    // Percentage (0–100). Detections below this are treated as inconclusive.
    confidenceThreshold: {
      type: Number,
      min: 0,
      max: 100,
      default: 70,
    },
    enforcementBehavior: {
      type: String,
      enum: ['Auto-Block', 'Flag for Review'],
      default: 'Flag for Review',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Policy', policySchema);
