import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import nodemailer from "nodemailer";
import { Buffer } from "buffer";

const YOUR_EMAIL = "bes8158@gmail.com";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { email, version, metrics } = data;

    // --- Генерация PDF ---
    const doc = new PDFDocument({ margin: 30 });
    const buffers: Buffer[] = [];
    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => {});
    doc.fontSize(20).text(`Результаты теста: ${version}`, { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text("Метрики:");
    doc.fontSize(12).text(JSON.stringify(metrics, null, 2));
    doc.end();
    const pdfBuffer = Buffer.concat(buffers);

    // --- Отправка email через Nodemailer ---
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Письмо клиенту
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Ваш отчёт по тесту ${version}`,
      text: "Здравствуйте! Ваш отчёт во вложении.",
      attachments: [{ filename: `${version}-result.pdf`, content: pdfBuffer }],
    });

    // Копия тебе
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: YOUR_EMAIL,
      subject: `Копия отчёта ${version} для ${email}`,
      text: "Автоматическая копия отчёта пользователя.",
      attachments: [{ filename: `${version}-result.pdf`, content: pdfBuffer }],
    });

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
