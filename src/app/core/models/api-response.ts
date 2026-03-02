export interface ApiResponse {
  success: boolean;
  data: any;
  message?: string;
}

export interface GenericApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
