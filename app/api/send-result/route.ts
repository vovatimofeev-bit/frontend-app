import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { Buffer } from "buffer";

import { liteQuestions } from "@/app/data/questions-lite";
import { questions as proQuestions } from "@/app/data/questions";

const YOUR_EMAIL = process.env.MAIL_TO || "bes8158@gmail.com";

export const dynamic = "force-dynamic";

// Функция для определения типа реакции
function getReactionType(rms: number, time: number, avgRms: number, avgTime: number): {
  type: string;
  zone: string;
  interpretation: string;
} {
  if (rms > avgRms * 1.4) {
    return {
      type: "ЭМОЦИОНАЛЬНОЕ НАПРЯЖЕНИЕ",
      zone: "Физиологическая тревожность / личностная чувствительность",
      interpretation: "Вопрос затронул эмоционально значимую область. Возможна внутренняя вовлечённость, личная значимость темы, скрытое напряжение или неосознаваемая тревога."
    };
  } else if (time > avgTime * 1.3) {
    return {
      type: "ВЗВЕШЕННАЯ РАЗМЫШЛЯЮЩАЯ РЕАКЦИЯ",
      zone: "Когнитивный контроль / аналитическая обработка",
      interpretation: "Ответ формировался осознанно и обдуманно. Реакция отражает склонность к анализу, саморегуляции и контролю импульсов."
    };
  } else {
    return {
      type: "СПОКОЙНАЯ УВЕРЕННАЯ РЕАКЦИЯ",
      zone: "Эмоциональная стабильность / психологический комфорт",
      interpretation: "Вопрос не вызвал внутреннего конфликта. Реакция спокойная, что указывает на уверенность, отсутствие напряжения и психологическую устойчивость."
    };
  }
}

// Функция для получения главного вывода на основе статистики
function getMainConclusion(calm: number, reflective: number, tense: number, total: number): string {
  const calmPercent = (calm / total) * 100;
  const tensePercent = (tense / total) * 100;
  const reflectivePercent = (reflective / total) * 100;

  if (tensePercent > 40) {
    return "Профиль указывает на высокую эмоциональную вовлечённость и чувствительность. Наблюдается склонность к глубоким эмоциональным реакциям на значимые темы.";
  } else if (reflectivePercent > 30) {
    return "Профиль отражает аналитический тип мышления. Ответы формируются осознанно, с элементами саморегуляции и когнитивного контроля.";
  } else if (calmPercent > 60) {
    return "Профиль указывает на эмоциональную устойчивость, спокойствие и высокий уровень внутреннего равновесия.";
  } else {
    return "Профиль демонстрирует сбалансированный эмоциональный фон с элементами как стабильности, так и ситуационной вовлечённости.";
  }
}

// Функция для определения архетипа личности
function getPersonalityArchetype(calm: number, reflective: number, tense: number, total: number): string {
  const calmPercent = (calm / total) * 100;
  
  if (calmPercent > 70) {
    return "УСТОЙЧИВЫЙ РЕАЛИСТ\nЭмоционально стабилен, уверен, собран и психологически устойчив.";
  } else if (calmPercent > 50) {
    return "АНАЛИТИЧЕСКИЙ НАБЛЮДАТЕЛЬ\nСклонен к рефлексии, внимателен к деталям, предпочитает обдуманные решения.";
  } else if (tense > calm && tense > reflective) {
    return "ЧУВСТВИТЕЛЬНЫЙ ИССЛЕДОВАТЕЛЬ\nЭмоционально вовлечён, открыт переживаниям, склонен к глубокой рефлексии.";
  } else {
    return "СБАЛАНСИРОВАННЫЙ АДАПТАНТ\nГибко реагирует на изменения, сочетает эмоциональную отзывчивость с рациональным подходом.";
  }
}

// Функция для генерации уникального TXT отчета
function generateReport(
  email: string,
  version: string,
  metrics: any[],
  calm: number,
  reflective: number,
  tense: number,
  avgRms: number,
  avgTime: number
): string {
  const total = calm + reflective + tense;
  const questions = version === "LITE" ? liteQuestions : proQuestions;
  
  let report = "ПСИХОЭМОЦИОНАЛЬНЫЙ ПРОФИЛЬ РЕСПОНДЕНТА\n\n";
  
  // === ДАННЫЕ РЕСПОНДЕНТА ===
  report += "=== ДАННЫЕ РЕСПОНДЕНТА ===\n";
  report += `Email: ${email}\n`;
  report += `Тип теста: ${version}\n\n`;
  
  // === ГЛАВНЫЙ ВЫВОД ===
  report += "=== ГЛАВНЫЙ ВЫВОД ===\n";
  report += `${getMainConclusion(calm, reflective, tense, total)}\n\n`;
  
  // === ЭМОЦИОНАЛЬНЫЙ СРЕЗ ===
  report += "=== ЭМОЦИОНАЛЬНЫЙ СРЕЗ ===\n";
  report += `Спокойные реакции: ${calm}\n`;
  report += `Взвешенные реакции: ${reflective}\n`;
  report += `Эмоционально напряжённые реакции: ${tense}\n\n`;
  
  // === ДЕТАЛЬНЫЙ АНАЛИЗ ПО ВОПРОСАМ ===
  report += "=== ДЕТАЛЬНЫЙ АНАЛИЗ ПО ВОПРОСАМ ===\n\n";
  
  const seen = new Set<number>();
  const uniqueMetrics = metrics.filter((m: any) => {
    const idx = m.questionIndex;
    if (seen.has(idx)) return false;
    seen.add(idx);
    return true;
  });
  
  uniqueMetrics.forEach((m: any) => {
    const qIndex = Number(m.questionIndex);
    const questionText = version === "LITE" 
      ? liteQuestions[qIndex]?.text || `Вопрос ${qIndex + 1}`
      : proQuestions[qIndex] || `Вопрос ${qIndex + 1}`;
    
    const time = Number(m.responseTimeMs ?? 0);
    const rms = Number(m.voiceRmsAvg ?? 0);
    
    const reaction = getReactionType(rms, time, avgRms, avgTime);
    
    report += `Вопрос ${qIndex + 1}:\n`;
    report += `«${questionText}»\n\n`;
    report += `Время реакции: ${time.toFixed(0)} мс\n`;
    report += `Голосовая амплитуда (RMS): ${rms.toFixed(4)}\n`;
    report += `Тип реакции: ${reaction.type}\n`;
    report += `Психологическая зона: ${reaction.zone}\n`;
    report += `Интерпретация: ${reaction.interpretation}\n\n`;
  });
  
  // === РЕНТГЕН-БЛОК / ДОПОЛНИТЕЛЬНЫЕ НАБЛЮДЕНИЯ ===
  report += "=== РЕНТГЕН-БЛОК / ДОПОЛНИТЕЛЬНЫЕ НАБЛЮДЕНИЯ ===\n";
  
  const emotionalSurges: number[] = [];
  uniqueMetrics.forEach((m: any) => {
    const qIndex = Number(m.questionIndex);
    const rms = Number(m.voiceRmsAvg ?? 0);
    
    if (rms > avgRms * 1.4) {
      emotionalSurges.push(qIndex + 1);
    }
  });
  
  if (emotionalSurges.length > 0) {
    emotionalSurges.forEach(questionNum => {
      report += `Вопрос ${questionNum}: зафиксирован всплеск эмоциональной интенсивности — возможный личностный триггер.\n`;
    });
  } else {
    report += "Значительных эмоциональных всплесков не зафиксировано. Эмоциональный фон ровный.\n";
  }
  report += "\n";
  
  // === АРХЕТИП ЛИЧНОСТИ ===
  report += "=== АРХЕТИП ЛИЧНОСТИ ПО КОМБИНАЦИИ ИНДЕКСОВ ===\n";
  report += `Архетип: ${getPersonalityArchetype(calm, reflective, tense, total)}\n\n`;
  
  // === ФИНАЛЬНЫЙ ВЫВОД ===
  report += "=== ФИНАЛЬНЫЙ ВЫВОД ===\n";
  report += "Отчёт сформирован на основе анализа поведенческих и физиологических реакций. ";
  report += "Он отражает индивидуальный стиль мышления, уровень честности, самоконтроля, ";
  report += "эмоциональной глубины и реакцию на психологически значимые темы.\n";
  
  // Добавляем уникальный ID отчета
  const reportId = `${version}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  report += `\nID отчета: ${reportId}`;
  report += `\nСгенерировано: ${new Date().toLocaleString('ru-RU')}`;
  
  return report;
}

export async function POST(req: Request) {
  try {
    console.log("📧 Генерация отчета...");
    const body = await req.json();
    const { email, version, metrics } = body;

    console.log("📊 Получены данные:", { 
      email: email ? `${email.substring(0, 3)}...` : 'none', 
      version, 
      metricsCount: metrics?.length || 0 
    });

    if (!metrics || !Array.isArray(metrics) || metrics.length === 0) {
      return NextResponse.json(
        { status: "error", message: "Нет данных метрик для анализа" },
        { status: 400 }
      );
    }

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json(
        { status: "error", message: "Введите корректный email" },
        { status: 400 }
      );
    }

    // Анализ метрик
    const validRms = metrics
      .map((m: any) => Number(m.voiceRmsAvg ?? 0))
      .filter(n => !isNaN(n) && n > 0);
    
    const validTimes = metrics
      .map((m: any) => Number(m.responseTimeMs ?? 0))
      .filter(n => !isNaN(n) && n > 0);

    if (validRms.length === 0 || validTimes.length === 0) {
      return NextResponse.json(
        { status: "error", message: "Недостаточно данных для анализа" },
        { status: 400 }
      );
    }

    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const avgRms = avg(validRms);
    const avgTime = avg(validTimes);

    console.log("📈 Средние показатели:", { 
      avgRms: avgRms.toFixed(4), 
      avgTime: avgTime.toFixed(0) 
    });

    // Подсчет типов реакций
    let calm = 0, reflective = 0, tense = 0;
    
    metrics.forEach((m: any) => {
      const rms = Number(m.voiceRmsAvg ?? 0);
      const time = Number(m.responseTimeMs ?? 0);
      
      if (isNaN(rms) || isNaN(time)) return;
      
      if (rms > avgRms * 1.4) {
        tense++;
      } else if (time > avgTime * 1.3) {
        reflective++;
      } else {
        calm++;
      }
    });

    console.log("🎯 Статистика реакций:", { calm, reflective, tense });

    // Генерация уникального отчета
    console.log("📄 Генерация TXT отчета...");
    const reportText = generateReport(
      email,
      version,
      metrics,
      calm,
      reflective,
      tense,
      avgRms,
      avgTime
    );

    const reportBuffer = Buffer.from(reportText, "utf-8");

    // Проверка конфигурации SMTP
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD;

    if (!smtpUser || !smtpPass) {
      console.error("❌ SMTP credentials missing!");
      return NextResponse.json(
        { 
          status: "error", 
          message: "Сервер не настроен. Обратитесь к администратору."
        }, 
        { status: 500 }
      );
    }

    // Настройка SMTP транспорта
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Тест подключения
    try {
      await transporter.verify();
      console.log("✅ SMTP connection verified");
    } catch (verifyError: any) {
      console.error("❌ SMTP verification failed:", verifyError.message);
      return NextResponse.json(
        { 
          status: "error", 
          message: "Ошибка подключения к почтовому серверу"
        }, 
        { status: 500 }
      );
    }

    // Подготовка и отправка письма с отчетом
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `poligram-${version.toLowerCase()}-${timestamp}-${Date.now()}.txt`;
    
    const mailOptions = {
      from: `"Poligram System" <${smtpUser}>`,
      to: YOUR_EMAIL,
      replyTo: email,
      subject: `Poligram ${version} - Полный отчет от ${email}`,
      text: `Прикреплен полный отчет теста Poligram ${version}.\n\nКлиент: ${email}\nДата: ${new Date().toLocaleString('ru-RU')}\nВопросов: ${metrics.length}`,
      attachments: [
        {
          filename: filename,
          content: reportBuffer,
          contentType: 'text/plain; charset=utf-8',
        }
      ],
    };

    console.log("📤 Отправка отчета на:", YOUR_EMAIL);
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Отчет отправлен! Message ID:", info.messageId);

    return NextResponse.json({ 
      status: "ok", 
      message: "✅ Письмо отправлено. Вы получите отчет на указанный email в течение 24 часов." 
    });

  } catch (err: any) {
    console.error("💥 ОШИБКА СЕРВЕРА:");
    console.error("Message:", err.message);
    console.error("Stack:", err.stack);
    
    return NextResponse.json(
      { 
        status: "error", 
        message: "Внутренняя ошибка сервера. Попробуйте позже."
      }, 
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}