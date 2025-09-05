import { NextResponse } from "next/server";
import { issueNonce } from "@/lib/auth/siwe";

export async function GET() {
  const { nonce } = await issueNonce();
  return new NextResponse(nonce, {
    headers: { "content-type": "text/plain" },
  });
}


