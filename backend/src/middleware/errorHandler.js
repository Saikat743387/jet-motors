import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';

export function notFound(_req, res) {
  res.status(404).json({ message: 'Route not found' });
}

export function errorHandler(err, _req, res, _next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      message: err.message,
      details: err.details,
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }

  if (err.code === 11000) {
    return res.status(409).json({ message: 'Duplicate record' });
  }

  console.error(err);
  res.status(500).json({
    message: env.isProd ? 'Internal server error' : err.message,
  });
}
