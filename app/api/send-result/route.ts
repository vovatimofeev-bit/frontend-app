export const dynamic = "force-dynamic"; // обязательно для динамического API

import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { Buffer } from "buffer";

import { liteQuestions } from "@/app/data/questions-lite";
import { questions as proQuestions } from "@/app/data/questions";

const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const MAIL_TO = process.env.MAIL_TO;

export async function POST(req: Request) {
  try {
    const { email, version, metrics } = await req.json();

    if (!metrics || !Array.isArray(metrics)) {
      return NextResponse.json(
        { status: "error", message: "Нет метрик" },
        { status: 400 }
      );
    }

    const rmsValues = metrics.map((m: any) => Number(m.voiceRmsAvg ?? 0));
    const timeValues = metrics.map((m: any) => Number(m.responseTimeMs ?? 0));

    const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

    const avgRms = avg(rmsValues);
    const avgTime = avg(timeValues);

    const getState = (m: any) => {
      const rms = Number(m.voiceRmsAvg ?? 0);
      const time = Number(m.responseTimeMs ?? 0);

      if (rms > avgRms * 1.4) return "ЭМОЦИОНАЛЬНОЕ НАПРЯЖЕНИЕ";
      if (time > avgTime * 1.3) return "ВЗВЕШЕННАЯ РАЗМЫШЛЯЮЩАЯ РЕАКЦИЯ";
      return "СПОКОЙНАЯ УВЕРЕННАЯ РЕАКЦИЯ";
    };

    let calm = 0, reflective = 0, tense = 0;

    metrics.forEach((m: any) => {
      const state = getState(m);
      if (state === "СПОКОЙНАЯ УВЕРЕННАЯ РЕАКЦИЯ") calm++;
      if (state === "ВЗВЕШЕННАЯ РАЗМЫШЛЯЮЩАЯ РЕАКЦИЯ") reflective++;
      if (state === "ЭМОЦИОНАЛЬНОЕ НАПРЯЖЕНИЕ") tense++;
    });

    const seen = new Set<number>();
    const uniqueMetrics = metrics.filter((m: any) => {
      const idx = m.questionIndex;
      if (seen.has(idx)) return false;
      seen.add(idx);
      return true;
    });

    const getQuestionText = (index: number) =>
      version === "LITE" ? liteQuestions[index]?.text || "(вопрос не найден)" : proQuestions[index] || "(вопрос не найден)";

    let text = `=== ПСИХОЭМОЦИОНАЛЬНЫЙ ПРОФИЛЬ РЕСПОНДЕНТА ===\n\n`;
    text += `Email: ${email || "не указан"}\nТип теста: ${version || "не указан"}\n\n`;

    uniqueMetrics.forEach((m: any) => {
      const qIndex = Number(m.questionIndex);
      text += `Вопрос ${qIndex + 1}:\n`;
      text += `«${getQuestionText(qIndex)}»\n`;
      text += `Голос RMS: ${(m.voiceRmsAvg ?? 0).toFixed(4)}\n`;
      text += `Время реакции: ${(m.responseTimeMs ?? 0).toFixed(0)} мс\n`;
      text += `Тип реакции: ${getState(m)}\n\n`;
    });

    const reportBuffer = Buffer.from(text, "utf-8");

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: false,
      auth: { user: SMTP_USER!, pass: SMTP_PASS! }
    });

    await transporter.sendMail({
      from: `"Poligramm Test" <${SMTP_USER}>`,
      to: MAIL_TO,
      subject: `Новый результат теста ${version}`,
      text: `Результаты респондента: ${email}`,
      attachments: [{ filename: `result-${version}.txt`, content: reportBuffer }]
    });

    return NextResponse.json({ status: "ok" });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    return NextResponse.json({ status: "error", message: "Ошибка сервера" }, { status: 500 });
  }
}

// Проверка маршрута в браузере
export async function GET() {
  return NextResponse.json({ status: "send-result alive" });
}
