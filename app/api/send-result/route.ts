import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { Buffer } from "buffer";

import { liteQuestions } from "@/app/data/questions-lite";
import { questions as proQuestions } from "@/app/data/questions";

const YOUR_EMAIL = process.env.MAIL_TO;

export async function POST(req: Request) {
  try {
    const { email, version, metrics } = await req.json();

    if (!metrics || !Array.isArray(metrics)) {
      return NextResponse.json(
        { status: "error", message: "Нет метрик" },
        { status: 400 }
      );
    }

    const reportText = `Результаты теста (${version}) для ${email}`;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await transporter.sendMail({
      from: `"Poligramm" <${process.env.SMTP_USER}>`,
      to: YOUR_EMAIL,
      subject: `Результат теста ${version}`,
      text: reportText
    });

    return NextResponse.json({ status: "ok" });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    return NextResponse.json(
      { status: "error", message: "Ошибка сервера" },
      { status: 500 }
    );
  }
}

// Для проверки в браузере
export async function GET() {
  return NextResponse.json({ status: "send-result alive" });
}
