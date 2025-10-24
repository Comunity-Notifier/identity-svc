import { ApiErrorResponse, ApiSuccessResponse } from './validators/identity-schema';

class ApiResponse<T = unknown> implements ApiSuccessResponse {
  constructor(
    public data: T | null,
    public success: boolean
  ) {}
}

export function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
  };
}

export function createErrorResponse(code: string, message: string): ApiErrorResponse {
  return {
    success: false,
    error: { code, message },
  };
}
