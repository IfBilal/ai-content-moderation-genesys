import Policy from '../models/Policy.js';

export const getPolicies = async (req, res, next) => {
  try {
    const policies = await Policy.find().sort('category');
    res.json(policies);
  } catch (err) {
    next(err);
  }
};

export const updatePolicy = async (req, res, next) => {
  try {
    const { enabled, confidenceThreshold, enforcementBehavior } = req.body;

    const update = {};
    if (enabled !== undefined) update.enabled = enabled;
    if (confidenceThreshold !== undefined) update.confidenceThreshold = confidenceThreshold;
    if (enforcementBehavior !== undefined) update.enforcementBehavior = enforcementBehavior;

    const policy = await Policy.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    );

    if (!policy) return res.status(404).json({ message: 'Policy not found' });

    res.json(policy);
  } catch (err) {
    next(err);
  }
};
