import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    return NextResponse.json({
      status: "ok",
      received: body,
    });
  } catch (error) {
    return NextResponse.json(
      { status: "error", message: "Invalid JSON" },
      { status: 400 }
    );
  }
}
