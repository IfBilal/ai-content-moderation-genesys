import Appeal from '../models/Appeal.js';
import Submission from '../models/Submission.js';

export const getAppeals = async (req, res, next) => {
  try {
    const { status = 'Pending', page = 1, limit = 20 } = req.query;

    const validStatuses = ['Pending', 'Accepted', 'Rejected', 'all'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status filter' });
    }

    const filter = status === 'all' ? {} : { status };
    const skip = (Number(page) - 1) * Number(limit);

    const [appeals, total] = await Promise.all([
      Appeal.find(filter)
        .populate({ path: 'user', select: 'name email' })
        .populate({
          path: 'submission',
          select: 'overallOutcome triggeredCategories createdAt',
        })
        .populate({ path: 'reviewedBy', select: 'name email' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Appeal.countDocuments(filter),
    ]);

    res.json({
      appeals,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    next(err);
  }
};

export const reviewAppeal = async (req, res, next) => {
  try {
    const { status, adminResponse } = req.body;

    if (!['Accepted', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be Accepted or Rejected' });
    }

    const appeal = await Appeal.findById(req.params.id);
    if (!appeal) return res.status(404).json({ message: 'Appeal not found' });

    if (appeal.status !== 'Pending') {
      return res.status(400).json({ message: 'Appeal has already been reviewed' });
    }

    appeal.status = status;
    appeal.adminResponse = adminResponse || null;
    appeal.reviewedBy = req.user._id;
    appeal.reviewedAt = new Date();
    await appeal.save();

    // On acceptance override the submission outcome to Approved
    if (status === 'Accepted') {
      await Submission.findByIdAndUpdate(appeal.submission, {
        overallOutcome: 'Approved',
        appealEligible: false,
      });
    }

    await appeal.populate([
      { path: 'user', select: 'name email' },
      { path: 'submission', select: 'overallOutcome triggeredCategories createdAt' },
      { path: 'reviewedBy', select: 'name email' },
    ]);

    res.json(appeal);
  } catch (err) {
    next(err);
  }
};
