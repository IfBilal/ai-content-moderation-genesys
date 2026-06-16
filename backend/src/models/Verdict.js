import mongoose from 'mongoose';

const categoryResultSchema = new mongoose.Schema(
  {
    category: { type: String, required: true },
    detected: { type: Boolean, required: true },
    confidence: { type: Number, min: 0, max: 100, required: true },
    reasoning: { type: String, required: true },
    triggered: { type: Boolean, default: false },
  },
  { _id: false }
);

const policySnapshotSchema = new mongoose.Schema(
  {
    category: { type: String, required: true },
    enabled: { type: Boolean, required: true },
    confidenceThreshold: { type: Number, required: true },
    enforcementBehavior: { type: String, required: true },
  },
  { _id: false }
);

const verdictSchema = new mongoose.Schema(
  {
    image: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Image',
      required: true,
    },
    submission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Submission',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    outcome: {
      type: String,
      enum: ['Approved', 'Flagged for Review', 'Blocked'],
      required: true,
    },
    categoryBreakdown: [categoryResultSchema],
    policySnapshot: [policySnapshotSchema],
  },
  { timestamps: true }
);

export default mongoose.model('Verdict', verdictSchema);
