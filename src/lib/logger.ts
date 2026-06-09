import * as Sentry from "@sentry/nextjs";

const isProd = process.env.NODE_ENV === "production";

export const logger = {
  error(message: string, data?: Record<string, unknown> | Error) {
    if (isProd) {
      if (data instanceof Error) {
        Sentry.captureException(data, { extra: { message } });
      } else {
        Sentry.captureException(new Error(message), { extra: data });
      }
    } else {
      console.error(message, data);
    }
  },

  warn(message: string, data?: Record<string, unknown>) {
    if (isProd) {
      Sentry.addBreadcrumb({
        category: "warning",
        message,
        data,
        level: "warning",
      });
    } else {
      console.warn(message, data);
    }
  },

  info(message: string, data?: Record<string, unknown>) {
    if (isProd) {
      Sentry.addBreadcrumb({
        category: "info",
        message,
        data,
        level: "info",
      });
    } else {
      console.log(message, data);
    }
  },
};
