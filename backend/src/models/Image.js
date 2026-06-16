import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema(
  {
    submission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Submission',
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    filename: {
      type: String,
      required: true,
    },
    mimetype: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    path: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Image', imageSchema);
