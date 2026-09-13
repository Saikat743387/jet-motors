import { body } from 'express-validator';
import { asyncHandler } from '../utils/asyncHandler.js';
import { cookieOptions, loginUser, publicUser, registerUser, signToken } from '../services/auth.service.js';

export const registerValidators = [
  body('mobile').trim().notEmpty().withMessage('Mobile number is required'),
  body('password').notEmpty().withMessage('Password is required'),
  body('confirmPassword').notEmpty().withMessage('Confirm password is required'),
];

export const loginValidators = [
  body('password').notEmpty().withMessage('Password is required'),
  body().custom((value) => {
    const hasMobile = typeof value.mobile === 'string' && value.mobile.trim().length > 0;
    const hasUserId = typeof value.userId === 'string' && value.userId.trim().length > 0;
    if (!hasMobile && !hasUserId) throw new Error('Mobile number or User ID is required');
    return true;
  }),
];

export const register = asyncHandler(async (req, res) => {
  const user = await registerUser({
    mobile: req.body.mobile?.trim(),
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    inviteCode: req.body.inviteCode,
    ip: req.ip,
  });
  const token = signToken(user);
  res.cookie('token', token, cookieOptions());
  res.status(201).json({ user: publicUser(user), token });
});

export const login = asyncHandler(async (req, res) => {
  const user = await loginUser({
    mobile: req.body.mobile?.trim(),
    userId: req.body.userId?.trim(),
    password: req.body.password,
    ip: req.ip,
  });
  const token = signToken(user);
  res.cookie('token', token, cookieOptions());
  res.json({ user: publicUser(user), token });
});

export const logout = asyncHandler(async (_req, res) => {
  res.clearCookie('token', { path: '/' });
  res.json({ message: 'Logged out' });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: publicUser(req.user) });
});
