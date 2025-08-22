/* 
  Base Error Class for API Errors 
*/

import express from 'express';

export class ApiError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public errorPayload?: any | undefined;
  public stack?: string | undefined;

  constructor(
    statusCode: number,
    message: string,
    errorPayload?: any,
    isOperational = true,
    stack = '',
  ) {
    super(message);

    this.statusCode = statusCode;
    this.isOperational = isOperational;
    if (errorPayload) this.errorPayload = errorPayload;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/* Error instnces for specific error types */

export class NotFoundErrror extends ApiError {
  constructor(message = 'NOT FOUND', errorPayload?: any) {
    super(404, message, errorPayload, true);
  }
}

export class BadRequestError extends ApiError {
  constructor(message = 'BAD REQUEST', errorPayload?: any) {
    super(400, message, errorPayload, true);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'UNAUTHORIZED', errorPayload?: any) {
    super(401, message, errorPayload, true);
  }
}

export class InternalServerError extends ApiError {
  constructor(message = 'INTERNAL SERVER ERROR', errorPayload?: any) {
    super(500, message, errorPayload, true);
  }
}

/* Error handling middleware */

export function errorHandler(
  err: ApiError,
  req: express.Request,
  res: express.Response,
  _next: express.NextFunction,
) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const errorPayload = err.errorPayload || {};

  /*  Log error in console only if in development mode. */

  if (process.env.NODE_ENV === 'development') {
    console.error('An Errror Occured:', {
      message: err.message,
      stack: err.stack,
      statusCode,
      errorPayload,
    });
  }

  if (err instanceof ApiError) {
    res.status(statusCode).json({
      success: false,
      status_code: statusCode,
      message,
      error: errorPayload,
    });
  } else {
    return res.status(500).json({
      success: false,
      message: 'An unexpected error occurred.',
    });
  }
}
