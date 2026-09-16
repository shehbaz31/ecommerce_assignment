import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../errors/app-error';

export const errorMiddleware = (err: unknown, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }

  const message = err instanceof Error ? err.message : 'Internal server error';
  return res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message,
      details: [],
    },
  });
};
