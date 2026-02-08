import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { email, version, metrics } = await req.json();

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false, // TLS
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailText = `
Пользователь: ${email}
Версия теста: ${version}
Метрики:
${JSON.stringify(metrics, null, 2)}
`;

    await transporter.sendMail({
      from: process.env.SMTP_USER,       // твой Gmail
      to: process.env.SMTP_USER,         // сюда приходит результат
      subject: `Результат теста Poligramm ${version}`,
      text: mailText,
      replyTo: email,                    // чтобы можно было ответить пользователю
    });

    return NextResponse.json({ message: "Результат отправлен" });
  } catch (error) {
    console.error("MAIL ERROR:", error);
    return NextResponse.json({ error: "Ошибка при отправке письма" }, { status: 500 });
  }
}
