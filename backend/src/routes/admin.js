import { Router } from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import { getPolicies, updatePolicy } from '../controllers/policyController.js';
import { getAppeals, reviewAppeal } from '../controllers/appealController.js';
import { getFlaggedSubmissions, getSubmissionDetail, overrideVerdict } from '../controllers/adminSubmissionController.js';
import { getAnalytics } from '../controllers/analyticsController.js';

const router = Router();

router.use(protect, adminOnly);

// Policies
router.get('/policies', getPolicies);
router.patch('/policies/:id', updatePolicy);

// Appeals queue
router.get('/appeals', getAppeals);
router.patch('/appeals/:id', reviewAppeal);

// Submissions review queue + manual override
router.get('/submissions', getFlaggedSubmissions);
router.get('/submissions/:id', getSubmissionDetail);
router.patch('/submissions/:id/override', overrideVerdict);

// Analytics
router.get('/analytics', getAnalytics);

export default router;
