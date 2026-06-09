import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();

  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("omb_cost_principles")
      .select("id")
      .limit(1);

    const latency_ms = Date.now() - start;

    if (error) {
      return NextResponse.json(
        {
          status: "degraded",
          db: "unreachable",
          latency_ms,
          error: error.message,
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      status: "ok",
      db: "connected",
      latency_ms,
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev",
    });
  } catch {
    const latency_ms = Date.now() - start;
    return NextResponse.json(
      {
        status: "degraded",
        db: "unreachable",
        latency_ms,
      },
      { status: 503 }
    );
  }
}
