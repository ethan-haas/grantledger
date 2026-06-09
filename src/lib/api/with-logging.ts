import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

type RouteHandler = (
  request: Request,
  context?: { params: Record<string, string> }
) => Promise<Response | NextResponse>;

export function withRequestLogging(handler: RouteHandler): RouteHandler {
  return async (request, context) => {
    const start = Date.now();
    const method = request.method;
    const path = new URL(request.url).pathname;

    try {
      const response = await handler(request, context);
      const duration_ms = Date.now() - start;

      logger.info("API request", {
        method,
        path,
        status: response.status,
        duration_ms,
      });

      return response;
    } catch (err) {
      const duration_ms = Date.now() - start;

      logger.error("API request failed", {
        method,
        path,
        duration_ms,
        error: err instanceof Error ? err.message : String(err),
      });

      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}
