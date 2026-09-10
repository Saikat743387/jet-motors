import { Router } from 'express';
import {
  cancelDeposit,
  createDeposit,
  createDepositValidators,
  depositOptions,
  listDeposits,
  simulatePay,
} from '../controllers/deposit.controller.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(protect);
router.get('/options', depositOptions);
router.get('/', listDeposits);
router.post('/', createDepositValidators, validate, createDeposit);
router.post('/:id/simulate', simulatePay);
router.post('/:id/cancel', cancelDeposit);
export default router;
