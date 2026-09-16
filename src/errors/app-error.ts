export type AppErrorDetails = {
  field?: string;
  message: string;
};

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details: AppErrorDetails[];

  constructor(code: string, message: string, statusCode = 500, details: AppErrorDetails[] = []) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}
