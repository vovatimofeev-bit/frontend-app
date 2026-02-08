import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { Buffer } from "buffer";

import { liteQuestions } from "@/app/data/questions-lite";
import { questions as proQuestions } from "@/app/data/questions";

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

    const avg = (arr: number[]) =>
      arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    const rmsValues = metrics.map((m: any) => Number(m.voiceRmsAvg ?? 0));
    const timeValues = metrics.map((m: any) => Number(m.responseTimeMs ?? 0));

    const avgRms = avg(rmsValues);
    const avgTime = avg(timeValues);

    const getState = (m: any) => {
      const rms = Number(m.voiceRmsAvg ?? 0);
      const time = Number(m.responseTimeMs ?? 0);

      if (rms > avgRms * 1.4) {
        return "ЭМОЦИОНАЛЬНОЕ НАПРЯЖЕНИЕ";
      }

      if (time > avgTime * 1.3) {
        return "ВЗВЕШЕННАЯ РАЗМЫШЛЯЮЩАЯ РЕАКЦИЯ";
      }

      return "СПОКОЙНАЯ УВЕРЕННАЯ РЕАКЦИЯ";
    };

    let calm = 0;
    let reflective = 0;
    let tense = 0;

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
      if (version === "Lite") {
        return liteQuestions[index]?.text || "(вопрос не найден)";
      }
      return proQuestions[index] || "(вопрос не найден)";
    }

    let text = `ПСИХОЭМОЦИОНАЛЬНЫЙ ПРОФИЛЬ РЕСПОНДЕНТА\n\n`;

    // ===== ДАННЫЕ РЕСПОНДЕНТА =====
    text += `=== ДАННЫЕ РЕСПОНДЕНТА ===\n`;
    text += `Email: ${email || "не указан"}\n`;
    text += `Тип теста: ${version || "не указан"}\n\n`;

    // ===== ГЛАВНЫЙ ВЫВОД =====
    text += `=== ГЛАВНЫЙ ВЫВОД ===\n`;

    if (tense > reflective && tense > calm) {
      text += `Профиль указывает на высокую эмоциональную глубину, повышенную чувствительность и сильную личностную вовлечённость. Реакции говорят о внутренней значимости затронутых тем.\n`;
    } else if (reflective > calm) {
      text += `Профиль демонстрирует аналитический, вдумчивый и осознанный стиль реагирования. Респондент склонен к самоконтролю и рациональному принятию решений.\n`;
    } else {
      text += `Профиль указывает на эмоциональную устойчивость, спокойствие и высокий уровень внутреннего равновесия.\n`;
    }

    // ===== СТАТИСТИКА =====
    text += `\n=== ЭМОЦИОНАЛЬНЫЙ СРЕЗ ===\n`;
    text += `Спокойные реакции: ${calm}\n`;
    text += `Взвешенные реакции: ${reflective}\n`;
    text += `Эмоционально напряжённые реакции: ${tense}\n`;

    // ===== АНАЛИЗ ПО ВОПРОСАМ =====
    text += `\n=== ДЕТАЛЬНЫЙ АНАЛИЗ ПО ВОПРОСАМ ===\n\n`;

    uniqueMetrics.forEach((m: any) => {
      const qIndex = Number(m.questionIndex);
      const questionText = getQuestionText(qIndex);
      const state = getState(m);
      const time = Number(m.responseTimeMs ?? 0).toFixed(0);
      const rms = Number(m.voiceRmsAvg ?? 0).toFixed(4);

      let zone = "Нейтральная зона";
      let interpretation = "";

      if (state === "ЭМОЦИОНАЛЬНОЕ НАПРЯЖЕНИЕ") {
        zone = "Физиологическая тревожность / личностная чувствительность";
        interpretation =
          "Вопрос затронул эмоционально значимую область. Возможна внутренняя вовлечённость, личная значимость темы, скрытое напряжение или неосознаваемая тревога.";
      } else if (state === "ВЗВЕШЕННАЯ РАЗМЫШЛЯЮЩАЯ РЕАКЦИЯ") {
        zone = "Когнитивный контроль / аналитическая обработка";
        interpretation =
          "Ответ формировался осознанно и обдуманно. Реакция отражает склонность к анализу, саморегуляции и контролю импульсов.";
      } else {
        zone = "Эмоциональная стабильность / психологический комфорт";
        interpretation =
          "Вопрос не вызвал внутреннего конфликта. Реакция спокойная, что указывает на уверенность, отсутствие напряжения и психологическую устойчивость.";
      }

      text += `Вопрос ${qIndex + 1}:\n`;
      text += `«${questionText}»\n\n`;
      text += `Время реакции: ${time} мс\n`;
      text += `Голосовая амплитуда (RMS): ${rms}\n`;
      text += `Тип реакции: ${state}\n`;
      text += `Психологическая зона: ${zone}\n`;
      text += `Интерпретация: ${interpretation}\n\n`;
    });

    // ===== РЕНТГЕН-БЛОК / WOW =====
    text += `\n=== РЕНТГЕН-БЛОК / ДОПОЛНИТЕЛЬНЫЕ НАБЛЮДЕНИЯ ===\n`;

    uniqueMetrics.forEach((m: any) => {
      const rms = Number(m.voiceRmsAvg ?? 0);
      const time = Number(m.responseTimeMs ?? 0);

      if (rms > avgRms * 1.6) {
        text += `Вопрос ${Number(m.questionIndex) + 1}: зафиксирован всплеск эмоциональной интенсивности — возможный личностный триггер.\n`;
      }

      if (time > avgTime * 1.5) {
        text += `Вопрос ${Number(m.questionIndex) + 1}: отмечена замедленная реакция — возможный внутренний конфликт или сомнение.\n`;
      }
    });

    // ===== АРХЕТИП =====
    text += `\n=== АРХЕТИП ЛИЧНОСТИ ПО КОМБИНАЦИИ ИНДЕКСОВ ===\n`;

    if (tense > calm && tense > reflective) {
      text += `Архетип: ЭМОЦИОНАЛЬНЫЙ ИНТУИТ\nСклонен глубоко переживать события, чувствителен к атмосфере, эмоционально вовлечён.\n`;
    } else if (reflective > calm) {
      text += `Архетип: АНАЛИТИК НАБЛЮДАТЕЛЬ\nРационален, склонен к анализу, самоконтролю и стратегическому мышлению.\n`;
    } else {
      text += `Архетип: УСТОЙЧИВЫЙ РЕАЛИСТ\nЭмоционально стабилен, уверен, собран и психологически устойчив.\n`;
    }

    // ===== ФИНАЛ =====
    text += `\n=== ФИНАЛЬНЫЙ ВЫВОД ===\n`;
    text += `Отчёт сформирован на основе анализа поведенческих и физиологических реакций. Он отражает индивидуальный стиль мышления, уровень честности, самоконтроля, эмоциональной глубины и реакцию на психологически значимые темы.\n`;

    const reportBuffer = Buffer.from(text, "utf-8");

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
      text: `Email респондента: ${email}`,
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
