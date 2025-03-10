import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  error?: any;
};

export const successResponse = <T>(
  c: Context,
  statusCode: number,
  message: string,
  data?: T
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    statusCode,
    message,
    data,
  }
  return c.json(response, statusCode as ContentfulStatusCode);
};

export const errorResponse = (
  c: Context,
  statusCode: number,
  message: string,
  error?: any
): Response => {
  const response: ApiResponse = {
    success: false,
    statusCode,
    message,
    error,
  };
  return c.json(response, statusCode as ContentfulStatusCode);
}
