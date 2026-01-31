import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { Buffer } from "buffer";

const YOUR_EMAIL = "bes8158@gmail.com";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, version, metrics } = body;

    if (!metrics || !Array.isArray(metrics)) {
      return NextResponse.json(
        { status: "error", message: "Нет метрик" },
        { status: 400 }
      );
    }

    // ===== TEXT REPORT (вместо pdfkit) =====
    let text = `Poligramm Test Result (${version})\n\n`;

    metrics.forEach((m: any) => {
      text += `Question ${m.questionIndex + 1}\n`;
      text += `Response Time: ${m.responseTimeMs} ms\n`;
      text += `Voice RMS Avg: ${m.voiceRmsAvg ?? "N/A"}\n`;
      text += `Voice RMS Peak: ${m.voiceRmsPeak ?? "N/A"}\n\n`;
    });

    const reportBuffer = Buffer.from(text, "utf-8");

    // ===== EMAIL =====
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await transporter.sendMail({
      from: `"Poligramm Test" <${process.env.SMTP_USER}>`,
      to: YOUR_EMAIL,
      subject: `Новый результат теста ${version}`,
      text: `Email пользователя: ${email}`,
      attachments: [
        {
          filename: `result-${version}.txt`,
          content: reportBuffer
        }
      ]
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
