import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';
import { AppError } from '../../errors/app-error';

export const validateBody = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.length ? issue.path.join('.') : 'body',
      message: issue.message,
    }));

    return next(new AppError('VALIDATION_ERROR', 'Request validation failed', 400, details));
  }

  req.body = result.data;
  return next();
};
