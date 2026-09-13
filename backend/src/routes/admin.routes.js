import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { adminOnly, protect } from '../middleware/auth.js';
import { saveImage } from '../utils/uploads.js';
import {
  adjustBalanceAdmin,
  confirmDepositAdmin,
  createProduct,
  dashboard,
  deleteProduct,
  getSettingsAdmin,
  getUser,
  getWithdrawalAdmin,
  listAllProducts,
  listCommissionsAdmin,
  listDepositsAdmin,
  listLogs,
  listPurchases,
  listTeamsAdmin,
  listTicketsAdmin,
  listTransactionsAdmin,
  listUsers,
  listWithdrawalsAdmin,
  replyTicket,
  resetPasswordAdmin,
  saveSettingsAdmin,
  toggleUser,
  updateDepositAdmin,
  updateProduct,
  updateUserAdmin,
  updateWithdrawalAdmin,
} from '../controllers/admin.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!/^image\//.test(file.mimetype)) return cb(new Error('Only image uploads are allowed'));
    cb(null, true);
  },
});

const router = Router();
router.use(protect, adminOnly);

router.get('/dashboard', dashboard);
router.get('/users', listUsers);
router.get('/users/:id', getUser);
router.patch('/users/:id', updateUserAdmin);
router.patch('/users/:id/toggle', toggleUser);
router.post('/users/:id/adjust-balance', adjustBalanceAdmin);
router.post('/users/:id/reset-password', resetPasswordAdmin);

router.get('/products', listAllProducts);
router.post('/products', createProduct);
router.patch('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);
router.post(
  '/upload',
  upload.single('image'),
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const ext = path.extname(req.file.originalname || '.jpg');
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    await saveImage(filename, req.file.mimetype, req.file.buffer);
    res.json({ url: `/uploads/${filename}` });
  })
);

router.get('/purchases', listPurchases);
router.get('/deposits', listDepositsAdmin);
router.post('/deposits/:id/confirm', confirmDepositAdmin);
router.patch('/deposits/:id', updateDepositAdmin);
router.get('/withdrawals', listWithdrawalsAdmin);
router.get('/withdrawals/:id', getWithdrawalAdmin);
router.patch('/withdrawals/:id', updateWithdrawalAdmin);
router.get('/transactions', listTransactionsAdmin);
router.get('/teams', listTeamsAdmin);
router.get('/commissions', listCommissionsAdmin);
router.get('/tickets', listTicketsAdmin);
router.post('/tickets/:id/reply', replyTicket);
router.get('/settings', getSettingsAdmin);
router.patch('/settings', saveSettingsAdmin);
router.get('/logs', listLogs);

export default router;
