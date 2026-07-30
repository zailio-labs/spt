// app/api/gold-rate/route.js
import { NextResponse } from "next/server";
import { getDealerGoldRate } from "@/lib/gold-price";

export const dynamic = "force-dynamic"; // never statically cache a live rate
export const revalidate = 0;

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const currency = searchParams.get("currency") ?? "AED";

  try {
    const rate = await getDealerGoldRate(currency);
    return NextResponse.json(rate, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error("Failed to fetch gold rate:", err);
    return NextResponse.json(
      { error: "Unable to fetch live gold rate right now." },
      { status: 502 }
    );
  }
}
