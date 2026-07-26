import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const creationId = searchParams.get("creationId");
  const myRequests = searchParams.get("my") === "true";

  const supabase = createAdminClient();

  if (creationId) {
    // Fetch requests for a specific creation (only for the creator)
    // First, verify that the requesting user is the creator of the creation
    const { data: creation, error: creatErr } = await supabase
      .from("creations")
      .select("user_id")
      .eq("id", creationId)
      .single();

    if (creatErr || !creation) {
      return NextResponse.json({ error: "Creation not found" }, { status: 404 });
    }

    if (creation.user_id !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: requests, error } = await supabase
      .from("collaboration_requests")
      .select(`
        id,
        requester_id,
        status,
        created_at,
        requester:users!collaboration_requests_requester_id_fkey(id, name, title, image)
      `)
      .eq("creation_id", creationId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ requests: requests ?? [] });
  }

  if (myRequests) {
    // Fetch requests made by the current user
    const { data: requests, error } = await supabase
      .from("collaboration_requests")
      .select(`
        id,
        creation_id,
        status,
        created_at,
        creation:creations!collaboration_requests_creation_id_fkey(id, title, world_id, user_id)
      `)
      .eq("requester_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ requests: requests ?? [] });
  }

  // Default: maybe return pending requests where user is creator? We'll just return empty.
  return NextResponse.json({ requests: [] });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { creationId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const creationId = String(body.creationId ?? "").trim();
  if (!creationId) {
    return NextResponse.json({ error: "Creation ID required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Check if the creation exists and get its owner
  const { data: creation, error: creatErr } = await supabase
    .from("creations")
    .select("user_id, title, mode, is_public")
    .eq("id", creationId)
    .single();

  if (creatErr || !creation) {
    return NextResponse.json({ error: "Creation not found" }, { status: 404 });
  }

  // Prevent requesting to join your own creation
  if (creation.user_id === session.user.id) {
    return NextResponse.json({ error: "Cannot request to join your own creation" }, { status: 400 });
  }

  // Optionally, only allow requests if creation is not public? Or always allow.
  // We'll allow requests regardless.

  // Check if there's already a pending request from this user for this creation
  const { data: existingRequest, error: existErr } = await supabase
    .from("collaboration_requests")
    .select("id, status")
    .eq("creation_id", creationId)
    .eq("requester_id", session.user.id)
    .eq("status", "pending")
    .single();

  if (existErr && existErr.code !== "PGRST116") { // PGRST116 means no rows returned
    return NextResponse.json({ error: existErr.message }, { status: 500 });
  }

  if (existingRequest) {
    return NextResponse.json({ error: "You already have a pending request for this creation" }, { status: 409 });
  }

  // Insert the request
  const { data: request, error } = await supabase
    .from("collaboration_requests")
    .insert({
      creation_id: creationId,
      requester_id: session.user.id,
      status: "pending",
    })
    .select(`
      id,
      creation_id,
      requester_id,
      status,
      created_at,
      requester:users!collaboration_requests_requester_id_fkey(id, name, title, image)
    `)
    .single();

  if (error || !request) {
    return NextResponse.json({ error: error?.message || "Could not send request" }, { status: 500 });
  }

  // TODO: Notify the creation owner (via email or in-app notification) - omitted for brevity

  return NextResponse.json({ request }, { status: 201 });
}