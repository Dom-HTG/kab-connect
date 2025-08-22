import express from 'express';

export interface ApiResponseDTO {
  success: boolean;
  status_code: number;
  message: string;
  data?: any;
}

export function SuccessResponse(
  res: express.Response,
  payload: ApiResponseDTO,
) {
  return res.status(payload.status_code).json({
    success: payload.success,
    status_code: payload.status_code,
    message: payload.message,
    data: payload.data,
  });
}
