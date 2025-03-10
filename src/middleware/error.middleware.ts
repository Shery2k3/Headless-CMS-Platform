import type { Context, Next } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export const errorHandler = async (c: Context, next: Next) => {
  try {
    await next();
  } catch (err: unknown) {
    console.error(err);
    
    const statusCode = err && typeof err === 'object' && 'status' in err ? err.status as number : 500;
    const errorMessage = err instanceof Error ? err.message : "Internal Server Error";
    
    return c.json({
      success: false,
      message: errorMessage,
    }, statusCode as ContentfulStatusCode);
  }
};