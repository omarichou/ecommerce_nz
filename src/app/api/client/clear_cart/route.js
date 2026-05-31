import CartModal from "app/DBconfig/models/Cart";
import { connectMongoDB } from "app/DBconfig/mongodb";
import { NextResponse } from "next/server";

export async function DELETE(request) {
  let id_user;
  try {
    const body = await request.json();
    id_user = body.id_user;
  } catch {
    return NextResponse.json({ error: "id_user requis" }, { status: 400 });
  }

  if (!id_user) {
    return NextResponse.json({ error: "id_user requis" }, { status: 400 });
  }

  await connectMongoDB();
  await CartModal.deleteMany({ id_user });
  return NextResponse.json({ success: true });
}
