import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/pricing",
  "/methodology",
  "/terms",
  "/privacy",
  "/about",
  "/security",
  "/contact",
  "/integrations",
  "/resources",
  "/changelog",
  "/blog",
  "/blog/(.*)",
  "/case-studies",
  "/case-studies/(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks/(.*)",
  "/api/cron/(.*)",
  "/api/connections/quickbooks/callback",
  "/api/connections/xero/callback",
  "/api/contact",
  "/api/newsletter",
  "/api/health",
]);

// Note: Rate limiting should be handled at the edge/CDN layer (e.g., Vercel WAF,
// Cloudflare) rather than in serverless middleware, where in-memory state resets
// per invocation and provides no real protection.

export default clerkMiddleware((auth, request) => {
  if (!isPublicRoute(request)) {
    auth().protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
