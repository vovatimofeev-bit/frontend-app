import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { Buffer } from "buffer";

import { liteQuestions } from "@/app/data/questions-lite";
import { questions as proQuestions } from "@/app/data/questions";

const YOUR_EMAIL = process.env.MAIL_TO || "vova.timofeev@gmail.com";

// Обязательно для динамического API
export const dynamic = "force-dynamic";

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

    const avg = (arr: number[]) =>
      arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    const rmsValues = metrics.map((m: any) => Number(m.voiceRmsAvg ?? 0));
    const timeValues = metrics.map((m: any) => Number(m.responseTimeMs ?? 0));

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

    function getQuestionText(index: number) {
      if (version === "LITE") return liteQuestions[index]?.text || "(вопрос не найден)";
      return proQuestions[index] || "(вопрос не найден)";
    }

    let text = `ПСИХОЭМОЦИОНАЛЬНЫЙ ПРОФИЛЬ РЕСПОНДЕНТА\n\n`;
    text += `=== ДАННЫЕ РЕСПОНДЕНТА ===\nEmail: ${email || "не указан"}\nТип теста: ${version || "не указан"}\n\n`;
    text += `=== ГЛАВНЫЙ ВЫВОД ===\n`;

    if (tense > reflective && tense > calm) {
      text += `Высокая эмоциональная глубина, повышенная чувствительность и вовлечённость.\n`;
    } else if (reflective > calm) {
      text += `Аналитический, вдумчивый стиль реагирования.\n`;
    } else {
      text += `Эмоциональная устойчивость, спокойствие и внутреннее равновесие.\n`;
    }

    text += `\n=== ЭМОЦИОНАЛЬНЫЙ СРЕЗ ===\n`;
    text += `Спокойные реакции: ${calm}\n`;
    text += `Взвешенные реакции: ${reflective}\n`;
    text += `Эмоционально напряжённые реакции: ${tense}\n\n`;

    text += `=== ДЕТАЛЬНЫЙ АНАЛИЗ ПО ВОПРОСАМ ===\n\n`;
    uniqueMetrics.forEach((m: any) => {
      const qIndex = Number(m.questionIndex);
      const questionText = getQuestionText(qIndex);
      const state = getState(m);
      const time = Number(m.responseTimeMs ?? 0).toFixed(0);
      const rms = Number(m.voiceRmsAvg ?? 0).toFixed(4);

      text += `Вопрос ${qIndex + 1}:\n`;
      text += `«${questionText}»\nВремя реакции: ${time} мс\nГолосовая амплитуда (RMS): ${rms}\nТип реакции: ${state}\n\n`;
    });

    const reportBuffer = Buffer.from(text, "utf-8");

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Poligramm Test" <${process.env.SMTP_USER}>`,
      to: YOUR_EMAIL,
      subject: `Новый результат теста ${version}`,
      text: `Email респондента: ${email}`,
      attachments: [
        {
          filename: `result-${version}.txt`,
          content: reportBuffer,
        },
      ],
    });

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("SERVER ERROR:", err);
    return NextResponse.json({ status: "error", message: "Ошибка сервера" }, { status: 500 });
  }
}
