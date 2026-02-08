import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

type RequestBody = {
  email: string;
  version: "PRO" | "LITE";
  metrics: Array<{
    block: string;
    questionIndex: number;
    voiceRmsAvg: number;
    voiceRmsPeak: number;
    responseTimeMs: number;
    timestamp: number;
  }>;
};

export async function POST(req: Request) {
  try {
    const { email, version, metrics } = (await req.json()) as RequestBody;

    if (!email || !version || !metrics) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
      return NextResponse.json({ error: "SMTP not configured" }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    const mailText = `
Версия теста: ${version}
E-mail: ${email}
Метрики:
${JSON.stringify(metrics, null, 2)}
`;

    await transporter.sendMail({
      from: `"Poligramm" <${SMTP_USER}>`,
      to: email,
      subject: `Ваш результат Poligramm ${version}`,
      text: mailText,
    });

    return NextResponse.json({ message: "Результат отправлен" });
  } catch (error) {
    console.error("MAIL ERROR:", error);
    return NextResponse.json({ error: "Ошибка при отправке письма" }, { status: 500 });
  }
}
