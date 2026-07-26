import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createAdminClient } from "@/lib/supabase-admin";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: requestId } = await params;

  let body: { status?: "approved" | "rejected" };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const status = body.status;
  if (!status || !["approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Valid status (approved or rejected) required" }, { status: 400 });
  }

  const supabase = createAdminClient();

// Fetch the request to verify it exists and get its creation_id
   const { data: request, error: reqErr } = await supabase
     .from("collaboration_requests")
     .select("id, creation_id, requester_id, status")
     .eq("id", requestId)
     .single();

   if (reqErr || !request) {
     return NextResponse.json({ error: "Request not found" }, { status: 404 });
   }

   // Fetch the creation to get its owner (user_id)
   const { data: creation, error: creationErr } = await supabase
     .from("creations")
     .select("user_id")
     .eq("id", request.creation_id)
     .single();

   if (creationErr || !creation) {
     return NextResponse.json({ error: "Creation not found" }, { status: 404 });
   }

   // Check if the user is the creator of the creation
   if (creation.user_id !== session.user.id) {
     return NextResponse.json({ error: "Forbidden" }, { status: 403 });
   }

  // If already processed, return current state
  if (request.status !== "pending") {
    return NextResponse.json({ error: "Request already processed" }, { status: 400 });
  }

  // Update the request status
  const { data: updatedRequest, error: updErr } = await supabase
    .from("collaboration_requests")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", requestId)
    .select(`
      id,
      creation_id,
      requester_id,
      status,
      created_at,
      updated_at,
      requester:users!collaboration_requests_requester_id_fkey(id, name, title, image)
    `)
    .single();

  if (updErr || !updatedRequest) {
    return NextResponse.json({ error: updErr?.message || "Failed to update request" }, { status: 500 });
  }

  // If approved, add the requester as a member of the creation (if not already)
  if (status === "approved") {
    // Check if already a member
    const { data: existingMember, error: memErr } = await supabase
      .from("creation_members")
      .select("id")
      .eq("creation_id", request.creation_id)
      .eq("user_id", request.requester_id)
      .single();

    if (memErr && memErr.code !== "PGRST116") {
      // Unexpected error
      return NextResponse.json({ error: memErr.message }, { status: 500 });
    }

    if (!existingMember) {
      // Insert as member with role 'member'
      await supabase
        .from("creation_members")
        .insert({
          creation_id: request.creation_id,
          user_id: request.requester_id,
          role: "member",
        });
    }
  }

  // TODO: Notify the requester of the outcome

  return NextResponse.json({ request: updatedRequest });
}