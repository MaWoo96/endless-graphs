import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

// Worker API URL - should be configured via env var in production
const WORKER_URL =
  process.env.WORKER_API_URL ||
  "https://plaid-sync-worker-485874813100.us-central1.run.app";

// Admin client for tenant membership verification (bypasses RLS)
function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  try {
    // Get auth token from request
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // Validate the token using Supabase
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Get form data from request
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const entityId = formData.get("entity_id") as string | null;
    const tenantId = formData.get("tenant_id") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!entityId || !tenantId) {
      return NextResponse.json(
        { error: "Missing entity_id or tenant_id" },
        { status: 400 }
      );
    }

    // Security: Verify user has access to the specified tenant
    const adminClient = getAdminClient();
    const { data: tenantUser, error: tenantError } = await adminClient
      .from("tenant_users")
      .select("id")
      .eq("user_id", user.id)
      .eq("tenant_id", tenantId)
      .eq("status", "active")
      .single();

    if (tenantError || !tenantUser) {
      return NextResponse.json(
        { error: "Access denied to this tenant" },
        { status: 403 }
      );
    }

    // Security: Verify the entity belongs to the authorized tenant
    const { data: entity, error: entityError } = await adminClient
      .from("entities")
      .select("id")
      .eq("id", entityId)
      .eq("tenant_id", tenantId)
      .single();

    if (entityError || !entity) {
      return NextResponse.json(
        { error: "Entity not found or access denied" },
        { status: 403 }
      );
    }

    // Create new FormData for worker request
    const workerFormData = new FormData();
    workerFormData.append("file", file);
    workerFormData.append("entity_id", entityId);
    workerFormData.append("tenant_id", tenantId);

    // Forward to worker with service role key for authentication
    // The worker accepts Supabase JWTs (user tokens or service role)
    const workerResponse = await fetch(`${WORKER_URL}/api/receipts/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: workerFormData,
    });

    if (!workerResponse.ok) {
      const errorData = await workerResponse.json().catch(() => ({}));
      console.error("Worker error:", errorData);
      return NextResponse.json(
        { error: errorData.detail || "Upload failed" },
        { status: workerResponse.status }
      );
    }

    const data = await workerResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Receipt upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Next.js App Router configuration
// Body size is handled automatically for file uploads in App Router
