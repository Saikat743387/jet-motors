import { Router } from 'express';
import {
  bankValidators,
  createWithdrawal,
  getBank,
  listWithdrawals,
  saveBank,
} from '../controllers/withdrawal.controller.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(protect);
router.get('/bank', getBank);
router.post('/bank', bankValidators, validate, saveBank);
router.get('/', listWithdrawals);
router.post('/', createWithdrawal);
export default router;
