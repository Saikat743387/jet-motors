import crypto from 'crypto';
import { User } from '../models/User.js';

export function randomCode(length = 8) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
}

export function publicId(prefix, n, width = 6) {
  return `${prefix}${String(n).padStart(width, '0')}`;
}

export async function nextUserId() {
  const count = await User.countDocuments();
  return publicId('JM', count + 1);
}

export async function uniqueInviteCode() {
  for (let i = 0; i < 12; i += 1) {
    const code = randomCode(8);
    const exists = await User.exists({ inviteCode: code });
    if (!exists) return code;
  }
  return randomCode(10);
}

export function transactionRef(prefix = 'TXN') {
  return `${prefix}${Date.now().toString(36).toUpperCase()}${randomCode(4)}`;
}

export function maskAccount(accountNumber = '') {
  const digits = String(accountNumber);
  if (digits.length <= 4) return '••••';
  return `${'•'.repeat(Math.max(6, digits.length - 4))}${digits.slice(-4)}`;
}

export function maskMobile(mobile = '') {
  const digits = String(mobile);
  if (digits.length < 4) return 'XXXXXXXXXX';
  return `${'X'.repeat(digits.length - 4)}${digits.slice(-4)}`;
}
