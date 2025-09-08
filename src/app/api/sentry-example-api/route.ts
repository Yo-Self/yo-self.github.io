import * as Sentry from "@sentry/nextjs";
import { NextRequest } from "next/server";

class SentryExampleBackendError extends Error {
  constructor(message: string | undefined) {
    super(message);
    this.name = "SentryExampleBackendError";
  }
}

export async function GET(request: NextRequest) {
  return Sentry.startSpan(
    {
      op: "http.server",
      name: "Sentry Example API Route",
    },
    async (span) => {
      try {
        // Simulate some work
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Throw an error to test Sentry
        throw new SentryExampleBackendError("This error is raised on the backend of the example page.");
      } catch (error) {
        Sentry.captureException(error);
        span.setStatus("internal_error");
        span.recordException(error as Error);
        throw error;
      }
    }
  );
}
