import { Router } from 'express';
import { claimPurchaseIncome, createTicket, myProducts, myTickets, myTransactions } from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);
router.get('/products', myProducts);
router.post('/purchases/:id/claim', claimPurchaseIncome);
router.get('/transactions', myTransactions);
router.get('/tickets', myTickets);
router.post('/tickets', createTicket);
export default router;
