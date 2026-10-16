import { NextResponse } from "next/server";
import { admin } from "@/lib/server/auth";

export const GET = admin(async () => NextResponse.json({ ok: true }));
