import Submission from '../models/Submission.js';
import Verdict from '../models/Verdict.js';
import Appeal from '../models/Appeal.js';
import User from '../models/User.js';

export const getAnalytics = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - Number(days));

    const [
      submissionVolume,
      verdictByOutcome,
      verdictByCategory,
      appealStats,
      topUsersBySubmissions,
      topUsersByViolations,
    ] = await Promise.all([

      // 1. Submission volume over time grouped by day
      Submission.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { date: '$_id', count: 1, _id: 0 } },
      ]),

      // 2. Verdict distribution by outcome
      Submission.aggregate([
        { $match: { overallOutcome: { $ne: 'Pending' } } },
        { $group: { _id: '$overallOutcome', count: { $sum: 1 } } },
        { $project: { outcome: '$_id', count: 1, _id: 0 } },
      ]),

      // 3. Verdict distribution by category (only triggered detections)
      Verdict.aggregate([
        { $unwind: '$categoryBreakdown' },
        { $match: { 'categoryBreakdown.triggered': true } },
        { $group: { _id: '$categoryBreakdown.category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $project: { category: '$_id', count: 1, _id: 0 } },
      ]),

      // 4. Appeal stats
      Appeal.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            pending: { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } },
            accepted: { $sum: { $cond: [{ $eq: ['$status', 'Accepted'] }, 1, 0] } },
            rejected: { $sum: { $cond: [{ $eq: ['$status', 'Rejected'] }, 1, 0] } },
          },
        },
        {
          $project: {
            _id: 0,
            total: 1,
            pending: 1,
            accepted: 1,
            rejected: 1,
            resolutionRate: {
              $cond: [
                { $eq: ['$total', 0] },
                0,
                { $multiply: [{ $divide: [{ $add: ['$accepted', '$rejected'] }, '$total'] }, 100] },
              ],
            },
          },
        },
      ]),

      // 5. Top 10 users by submission count
      Submission.aggregate([
        { $group: { _id: '$user', submissionCount: { $sum: 1 } } },
        { $sort: { submissionCount: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
        {
          $project: {
            _id: 0,
            userId: '$_id',
            name: '$user.name',
            email: '$user.email',
            submissionCount: 1,
          },
        },
      ]),

      // 6. Top 10 users by violation count (Flagged or Blocked submissions)
      Submission.aggregate([
        { $match: { overallOutcome: { $in: ['Flagged for Review', 'Blocked'] } } },
        { $group: { _id: '$user', violationCount: { $sum: 1 } } },
        { $sort: { violationCount: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
        {
          $project: {
            _id: 0,
            userId: '$_id',
            name: '$user.name',
            email: '$user.email',
            violationCount: 1,
          },
        },
      ]),
    ]);

    res.json({
      submissionVolume,
      verdictByOutcome,
      verdictByCategory,
      appealStats: appealStats[0] || { total: 0, pending: 0, accepted: 0, rejected: 0, resolutionRate: 0 },
      topUsersBySubmissions,
      topUsersByViolations,
    });
  } catch (err) {
    next(err);
  }
};
