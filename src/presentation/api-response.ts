export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
}

export interface ApiErrorResponse {
  success: boolean;
  error: {
    code: string;
    message: string;
  };
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
