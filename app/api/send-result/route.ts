import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { subject, text } = await req.json();

    // === ДИАГНОСТИКА ENV ===
    console.log("SMTP_HOST =", process.env.SMTP_HOST);
    console.log("SMTP_PORT =", process.env.SMTP_PORT);
    console.log("SMTP_USER =", process.env.SMTP_USER);
    console.log(
      "SMTP_PASS =",
      process.env.SMTP_PASS ? "OK" : "MISSING"
    );
    // =======================

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false, // true для 465, false для 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: process.env.SMTP_USER, // если хочешь, можно отдельный SMTP_TO
      subject: subject || "Poligramm result",
      text: text || "No text",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("MAIL ERROR:", error);
    return NextResponse.json(
      { error: "Mail send failed" },
      { status: 500 }
    );
  }
}
