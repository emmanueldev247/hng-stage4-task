export interface PaginationMeta {
  total: number;
  limit: number;
  page: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export class ResponseDto<T> {
  success: boolean;
  data?: T;
  error?: string;
  message: string;
  meta?: PaginationMeta;

  constructor(partial: Partial<ResponseDto<T>>) {
    Object.assign(this, partial);
  }

  static success<T>(data: T, message = 'Success'): ResponseDto<T> {
    return new ResponseDto({
      success: true,
      data,
      message,
    });
  }

  static error(message: string, error?: string): ResponseDto<null> {
    return new ResponseDto({
      success: false,
      message,
      error,
    });
  }
}