import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { adminOnly, protect } from '../middleware/auth.js';
import {
  confirmDepositAdmin,
  createProduct,
  dashboard,
  deleteProduct,
  getSettingsAdmin,
  getUser,
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
  saveSettingsAdmin,
  toggleUser,
  updateProduct,
  updateWithdrawalAdmin,
} from '../controllers/admin.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.resolve(__dirname, '../../uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '.jpg');
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  },
});

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
router.patch('/users/:id/toggle', toggleUser);

router.get('/products', listAllProducts);
router.post('/products', createProduct);
router.patch('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);
router.post(
  '/upload',
  upload.single('image'),
  asyncHandler((req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    res.json({ url: `/uploads/${req.file.filename}` });
  })
);

router.get('/purchases', listPurchases);
router.get('/deposits', listDepositsAdmin);
router.post('/deposits/:id/confirm', confirmDepositAdmin);
router.get('/withdrawals', listWithdrawalsAdmin);
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
