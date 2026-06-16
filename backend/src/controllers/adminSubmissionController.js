import Submission from '../models/Submission.js';
import Verdict from '../models/Verdict.js';
import Appeal from '../models/Appeal.js';

export const getFlaggedSubmissions = async (req, res, next) => {
  try {
    const { outcome = 'Flagged for Review', page = 1, limit = 20 } = req.query;

    const validOutcomes = ['Flagged for Review', 'Blocked', 'Approved', 'Pending', 'all'];
    if (!validOutcomes.includes(outcome)) {
      return res.status(400).json({ message: 'Invalid outcome filter' });
    }

    const filter = outcome === 'all' ? {} : { overallOutcome: outcome };
    const skip = (Number(page) - 1) * Number(limit);

    const [submissions, total] = await Promise.all([
      Submission.find(filter)
        .populate({ path: 'user', select: 'name email' })
        .populate({ path: 'images', select: 'originalName mimetype size' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Submission.countDocuments(filter),
    ]);

    res.json({
      submissions,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    next(err);
  }
};

export const getSubmissionDetail = async (req, res, next) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate({ path: 'user', select: 'name email' })
      .populate('images');

    if (!submission) return res.status(404).json({ message: 'Submission not found' });

    const [verdicts, appeal] = await Promise.all([
      Verdict.find({ submission: submission._id }),
      Appeal.findOne({ submission: submission._id })
        .populate({ path: 'user', select: 'name email' })
        .populate({ path: 'reviewedBy', select: 'name email' }),
    ]);

    res.json({ submission, verdicts, appeal });
  } catch (err) {
    next(err);
  }
};

export const overrideVerdict = async (req, res, next) => {
  try {
    const { outcome } = req.body;

    const validOutcomes = ['Approved', 'Flagged for Review', 'Blocked'];
    if (!validOutcomes.includes(outcome)) {
      return res.status(400).json({ message: 'Invalid outcome. Must be Approved, Flagged for Review, or Blocked' });
    }

    const submission = await Submission.findById(req.params.id);
    if (!submission) return res.status(404).json({ message: 'Submission not found' });

    submission.overallOutcome = outcome;
    submission.appealEligible = ['Flagged for Review', 'Blocked'].includes(outcome);
    await submission.save();

    // Also update all individual verdict documents so detail view stays consistent
    await Verdict.updateMany({ submission: submission._id }, { outcome });

    res.json(submission);
  } catch (err) {
    next(err);
  }
};
