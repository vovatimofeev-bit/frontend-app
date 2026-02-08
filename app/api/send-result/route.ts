import { NextResponse } from "next/server";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function POST(req: Request) {
console.log("🔥 SEND-RESULT API HIT");
  try {
    const body = await req.json();

    console.log("SEND RESULT BODY:", body);

    // ⚠️ ВАЖНО:
    // здесь ПОКА НЕТ отправки письма
    // мы сначала проверяем, что POST вообще ДОХОДИТ

    return NextResponse.json(
      { status: "ok" },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (e) {
    console.error("API ERROR:", e);
    return NextResponse.json(
      { status: "error" },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}
