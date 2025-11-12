
export type PaginationMeta = {
  total: number;
  limit: number;
  page: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
};

export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
  message: string;
  meta?: PaginationMeta;
};

export type ApiErrorResponse = {
  success: false;
  error: string;
  message: string;
  meta?: PaginationMeta;
};

export class ResponseDto {
  static success<T>(
    data: T,
    message = 'ok',
    meta?: PaginationMeta,
  ): ApiSuccessResponse<T> {
    return { success: true, data, message, ...(meta ? { meta } : {}) };
  }

  static error(
    error: string,
    message: string,
    meta?: PaginationMeta,
  ): ApiErrorResponse {
    return { success: false, error, message, ...(meta ? { meta } : {}) };
  }
}
