import Submission from '../models/Submission.js';
import Image from '../models/Image.js';
import Verdict from '../models/Verdict.js';
import Policy from '../models/Policy.js';
import Appeal from '../models/Appeal.js';
import { analyzeImage, determineOutcome } from '../utils/moderation.js';

// POST /api/submissions
export const createSubmission = async (req, res, next) => {
  let submission = null;

  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'At least one image is required' });
    }

    // Fetch ALL policies and snapshot full config (including disabled) for audit trail
    const allPolicies = await Policy.find();
    const activePolicies = allPolicies.filter((p) => p.enabled);

    if (activePolicies.length === 0) {
      return res.status(400).json({ message: 'No active moderation policies configured' });
    }

    // Full policy snapshot at submission time — non-retroactive per requirements
    const policySnapshot = allPolicies.map((p) => ({
      category: p.category,
      enabled: p.enabled,
      confidenceThreshold: p.confidenceThreshold,
      enforcementBehavior: p.enforcementBehavior,
    }));

    // Create submission record first (Pending while processing)
    submission = await Submission.create({ user: req.user._id });

    const imageIds = [];
    const verdicts = [];
    const allTriggeredCategories = new Set();

    const PRIORITY = { Approved: 0, 'Flagged for Review': 1, Blocked: 2 };
    let overallOutcome = 'Approved';

    for (const file of req.files) {
      const image = await Image.create({
        submission: submission._id,
        originalName: file.originalname,
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
      });
      imageIds.push(image._id);

      const groqResults = await analyzeImage(file.path, file.mimetype, activePolicies);

      const { outcome, categoryBreakdown, triggeredCategories } = determineOutcome(
        groqResults,
        activePolicies
      );

      const verdict = await Verdict.create({
        image: image._id,
        submission: submission._id,
        user: req.user._id,
        outcome,
        categoryBreakdown,
        policySnapshot,
      });

      verdicts.push(verdict);
      triggeredCategories.forEach((c) => allTriggeredCategories.add(c));

      if (PRIORITY[outcome] > PRIORITY[overallOutcome]) overallOutcome = outcome;
    }

    // Update submission with final outcome
    submission.images = imageIds;
    submission.overallOutcome = overallOutcome;
    submission.triggeredCategories = [...allTriggeredCategories];
    submission.appealEligible = ['Flagged for Review', 'Blocked'].includes(overallOutcome);
    await submission.save();

    res.status(201).json({ submission, verdicts });
  } catch (err) {
    // Clean up the incomplete submission so it doesn't stay stuck in Pending
    if (submission?._id) {
      await Submission.findByIdAndDelete(submission._id).catch(() => {});
      await Image.deleteMany({ submission: submission._id }).catch(() => {});
      await Verdict.deleteMany({ submission: submission._id }).catch(() => {});
    }
    next(err);
  }
};

// GET /api/submissions — with filters: outcome, category, date + appeal status
export const getSubmissions = async (req, res, next) => {
  try {
    const { outcome, category, startDate, endDate, page = 1, limit = 20 } = req.query;

    const filter = { user: req.user._id };

    if (outcome) filter.overallOutcome = outcome;
    if (category) filter.triggeredCategories = category;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [submissions, total] = await Promise.all([
      Submission.find(filter)
        .populate({ path: 'images', select: 'originalName mimetype size' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Submission.countDocuments(filter),
    ]);

    // Attach appeal status to each submission for list-level tracking (requirement 4.3)
    const submissionIds = submissions.map((s) => s._id);
    const appeals = await Appeal.find({ submission: { $in: submissionIds } }).select(
      'submission status'
    );
    const appealMap = {};
    appeals.forEach((a) => { appealMap[a.submission.toString()] = a.status; });

    const result = submissions.map((s) => ({
      ...s.toJSON(),
      appealStatus: appealMap[s._id.toString()] || null,
    }));

    res.json({
      submissions: result,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/submissions/:id
export const getSubmissionById = async (req, res, next) => {
  try {
    const submission = await Submission.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).populate('images');

    if (!submission) return res.status(404).json({ message: 'Submission not found' });

    const [verdicts, appeal] = await Promise.all([
      Verdict.find({ submission: submission._id }),
      Appeal.findOne({ submission: submission._id }).populate({ path: 'reviewedBy', select: 'name' }),
    ]);

    res.json({ submission, verdicts, appeal });
  } catch (err) {
    next(err);
  }
};

// POST /api/submissions/:id/appeal
export const createAppeal = async (req, res, next) => {
  try {
    const { justification } = req.body;

    if (!justification || justification.trim() === '') {
      return res.status(400).json({ message: 'Justification is required' });
    }

    const submission = await Submission.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!submission) return res.status(404).json({ message: 'Submission not found' });

    if (!submission.appealEligible) {
      return res.status(400).json({
        message: 'Only Flagged or Blocked submissions can be appealed',
      });
    }

    const existing = await Appeal.findOne({ submission: submission._id });
    if (existing) {
      return res.status(400).json({ message: 'An appeal has already been filed for this submission' });
    }

    const appeal = await Appeal.create({
      submission: submission._id,
      user: req.user._id,
      justification: justification.trim(),
    });

    res.status(201).json(appeal);
  } catch (err) {
    next(err);
  }
};

// GET /api/submissions/:id/appeal
export const getAppeal = async (req, res, next) => {
  try {
    const submission = await Submission.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!submission) return res.status(404).json({ message: 'Submission not found' });

    const appeal = await Appeal.findOne({ submission: submission._id })
      .populate({ path: 'reviewedBy', select: 'name' });

    if (!appeal) return res.status(404).json({ message: 'No appeal found for this submission' });

    res.json(appeal);
  } catch (err) {
    next(err);
  }
};
