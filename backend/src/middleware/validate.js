import { validationResult } from 'express-validator';
import { ApiError } from '../utils/apiError.js';

export function validate(req, _res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const first = errors.array()[0];
    throw new ApiError(400, first.msg, errors.array());
  }
  next();
}
