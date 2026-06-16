import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import {
  createSubmission,
  getSubmissions,
  getSubmissionById,
  createAppeal,
  getAppeal,
} from '../controllers/submissionController.js';

const router = Router();

router.use(protect);

router.post('/', upload.array('images', 10), createSubmission);
router.get('/', getSubmissions);
router.get('/:id', getSubmissionById);
router.post('/:id/appeal', createAppeal);
router.get('/:id/appeal', getAppeal);

export default router;
