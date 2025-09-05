import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/siwe";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
  return NextResponse.json({ authenticated: true, session }, { status: 200 });
}


