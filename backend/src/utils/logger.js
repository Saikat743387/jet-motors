import { ActivityLog } from '../models/ActivityLog.js';

export async function logActivity({ actorId, actorRole = 'system', action, targetType, targetId, details, ip }) {
  try {
    await ActivityLog.create({ actorId, actorRole, action, targetType, targetId, details, ip });
  } catch (err) {
    console.error('Failed to write activity log', err.message);
  }
}
