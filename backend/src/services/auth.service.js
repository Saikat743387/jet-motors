import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { Referral } from '../models/Referral.js';
import { getSettings } from '../models/AppSettings.js';
import { ApiError } from '../utils/apiError.js';
import { nextUserId, uniqueInviteCode } from '../utils/ids.js';
import { duplicateKeyFields } from '../utils/duplicateKey.js';
import { logActivity } from '../utils/logger.js';

const MOBILE_RE = /^[6-9]\d{9}$/;
export const FIXED_ADMIN_USERID = 'Saikat7433';

export function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

export function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: env.isProd ? 'strict' : 'lax',
    secure: env.cookieSecure,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  };
}

async function linkReferrals(session, newUser, referrer) {
  const chain = [{ userId: referrer._id, level: 1 }];
  const level2 = await Referral.findOne({ memberId: referrer._id, level: 1 }).session(session);
  if (level2) chain.push({ userId: level2.userId, level: 2 });
  const level3Parent = level2
    ? await Referral.findOne({ memberId: level2.userId, level: 1 }).session(session)
    : null;
  if (level3Parent) chain.push({ userId: level3Parent.userId, level: 3 });
  else {
    const maybeL3 = await Referral.findOne({ memberId: referrer._id, level: 2 }).session(session);
    if (maybeL3) chain.push({ userId: maybeL3.userId, level: 3 });
  }

  const docs = chain.map((row) => ({
    userId: row.userId,
    memberId: newUser._id,
    level: row.level,
  }));
  if (docs.length) await Referral.insertMany(docs, { session });
}

export async function registerUser({ mobile, password, confirmPassword, inviteCode, ip }) {
  if (!MOBILE_RE.test(mobile)) throw new ApiError(400, 'Enter a valid 10-digit Indian mobile number');
  if (!password || password.length < 6) throw new ApiError(400, 'Password must be at least 6 characters');
  if (password !== confirmPassword) throw new ApiError(400, 'Passwords do not match');

  const settings = await getSettings();
  const existing = await User.findOne({ mobile });
  if (existing) throw new ApiError(409, 'Mobile number is already registered');

  let referrer = null;
  if (inviteCode && inviteCode.trim()) {
    const trimmedCode = inviteCode.trim().toUpperCase();
    referrer = await User.findOne({ inviteCode: trimmedCode });
    if (!referrer) throw new ApiError(400, 'Invalid referral code');
    if (referrer.status === 'blocked') throw new ApiError(400, 'Referral code is not valid');
    if (referrer.mobile === mobile) throw new ApiError(400, 'You cannot refer yourself');
  } else if (settings.inviteRequired) {
    throw new ApiError(400, 'Referral code is required');
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const userId = await nextUserId();
      const code = await uniqueInviteCode();
      const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

      const [user] = await User.create(
        [
          {
            userId,
            mobile,
            passwordHash,
            inviteCode: code,
            referredBy: referrer?._id || null,
            role: 'user',
          },
        ],
        { session }
      );

      if (referrer) await linkReferrals(session, user, referrer);

      await session.commitTransaction();
      await logActivity({
        actorId: user._id,
        actorRole: 'user',
        action: 'user.register',
        targetType: 'user',
        targetId: user.userId,
        ip,
      });
      return user;
    } catch (err) {
      await session.abortTransaction();
      if (err && err.code === 11000) {
        const keys = duplicateKeyFields(err);
        if (keys.includes('mobile')) {
          throw new ApiError(409, 'Mobile number is already registered');
        }
        if (attempt < 2) continue;
        throw new ApiError(409, 'Unable to create account, please try again');
      }
      throw err;
    } finally {
      session.endSession();
    }
  }
}

export async function loginUser({ mobile, userId, password, ip }) {
  const rawMobile = typeof mobile === 'string' ? mobile.trim() : '';
  const rawUserId = typeof userId === 'string' ? userId.trim() : '';

  if (rawUserId) {
    if (rawUserId !== FIXED_ADMIN_USERID) throw new ApiError(401, `Invalid User ID: expected ${FIXED_ADMIN_USERID} got ${rawUserId}`);
    if (!password) throw new ApiError(400, 'User ID and password are required');
    const user = await User.findOne({ userId: rawUserId, role: 'admin' }).select('+passwordHash');
    if (!user) throw new ApiError(401, `Admin not found for ${rawUserId}`);
    if (user.status === 'blocked') throw new ApiError(403, 'Account is blocked');
    const ok = await argon2.verify(user.passwordHash, password);
    if (!ok) throw new ApiError(401, `Password mismatch for ${rawUserId}`);
    await logActivity({
      actorId: user._id,
      actorRole: user.role,
      action: 'user.login',
      targetType: 'user',
      targetId: user.userId,
      ip,
    });
    return user;
  }

  if (!rawMobile || !password) throw new ApiError(400, 'Mobile number and password are required');

  const user = await User.findOne({ mobile: rawMobile }).select('+passwordHash');
  if (!user) throw new ApiError(401, 'Invalid mobile number or password');
  if (user.status === 'blocked') throw new ApiError(403, 'Account is blocked');
  if (user.role === 'admin') {
    throw new ApiError(403, 'Admin must login via Admin Dashboard with User ID Saikat7433');
  }

  const ok = await argon2.verify(user.passwordHash, password);
  if (!ok) throw new ApiError(401, 'Invalid mobile number or password');

  await logActivity({
    actorId: user._id,
    actorRole: user.role,
    action: 'user.login',
    targetType: 'user',
    targetId: user.userId,
    ip,
  });
  return user;
}

export function publicUser(user) {
  return {
    id: user._id,
    userId: user.userId,
    mobile: user.mobile,
    inviteCode: user.inviteCode,
    balance: user.balance,
    totalDeposit: user.totalDeposit,
    totalWithdrawal: user.totalWithdrawal,
    totalCommission: user.totalCommission,
    status: user.status,
    role: user.role,
    createdAt: user.createdAt,
  };
}
