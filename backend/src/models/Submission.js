import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    images: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Image',
      },
    ],
    // Worst outcome across all image verdicts. Priority: Blocked > Flagged for Review > Approved.
    // Overridden to 'Approved' when an appeal is accepted.
    overallOutcome: {
      type: String,
      enum: ['Approved', 'Flagged for Review', 'Blocked', 'Pending'],
      default: 'Pending',
    },
    // Denormalized for efficient filtering by category
    triggeredCategories: [{ type: String }],
    appealEligible: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Submission', submissionSchema);
