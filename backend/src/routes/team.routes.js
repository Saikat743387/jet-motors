import { Router } from 'express';
import { teamMembers, teamOverview } from '../controllers/team.controller.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);
router.get('/', teamOverview);
router.get('/:level', teamMembers);
export default router;
