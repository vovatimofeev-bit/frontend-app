"use client";

import { useEffect, useRef, useState } from "react";

/* =========================
   108 ВОПРОСОВ (ГОТОВЫЕ)
   ========================= */
const questions: string[] = [
  "Ваше имя настоящее?",
  "Вам больше 18 лет?",
  "Вы сейчас находитесь один?",
  "Вы понимаете цель этого теста?",
  "Вы согласились пройти тест добровольно?",

  "Вы сейчас спокойны?",
  "Вы чувствуете напряжение?",
  "У вас учащённое сердцебиение?",
  "Вам комфортно сейчас?",
  "Вы чувствуете тревогу?",

  "Вы когда-либо лгали близким?",
  "Вы лгали за последние 24 часа?",
  "Вы часто говорите неправду?",
  "Вам сложно говорить правду?",
  "Вы скрываете важную информацию?",

  "Вы боитесь последствий правды?",
  "Вы боитесь быть разоблачённым?",
  "Вы боитесь этого теста?",
  "Вы переживаете за результат?",
  "Вы ожидаете плохой исход?",

  "Вы совершали поступки, за которые стыдно?",
  "Вы испытываете чувство вины?",
  "Вы скрываете прошлые ошибки?",
  "Вы жалеете о некоторых решениях?",
  "Вы хотели бы изменить прошлое?",

  "Вы когда-либо предавали доверие?",
  "Вы изменяли партнёру?",
  "Вы скрывали измену?",
  "Вы врали о верности?",
  "Вы боялись, что правда вскроется?",

  "Вы брали чужое без разрешения?",
  "Вы присваивали то, что вам не принадлежит?",
  "Вы нарушали закон?",
  "Вы избегали ответственности?",
  "Вы обманывали ради выгоды?",

  "Вы манипулировали людьми?",
  "Вы использовали других в своих целях?",
  "Вы сознательно причиняли вред?",
  "Вы оправдывали плохие поступки?",
  "Вы считали это допустимым?",

  "Вы часто контролируете эмоции?",
  "Вы подавляете страх?",
  "Вы скрываете агрессию?",
  "Вы испытывали сильную злость?",
  "Вы хотели причинить вред?",

  "Вы когда-либо угрожали кому-то?",
  "Вы применяли физическую силу?",
  "Вы теряли контроль над собой?",
  "Вы боялись себя в такие моменты?",
  "Вы сожалеете об этом?",

  "Вы зависимы от чего-либо?",
  "У вас есть вредные привычки?",
  "Вы скрывали зависимость?",
  "Вы отрицали проблему?",
  "Вы пытались бросить?",

  "Вы обманывали врачей?",
  "Вы скрывали симптомы?",
  "Вы врали о своём состоянии?",
  "Вы игнорировали лечение?",
  "Вы осознавали риск?",

  "Вы считаете себя честным человеком?",
  "Вы гордитесь собой?",
  "Вы доверяете себе?",
  "Вы уважаете себя?",
  "Вы принимаете ответственность?",

  "Вы готовы услышать правду о себе?",
  "Вы готовы к результатам теста?",
  "Вы готовы принять выводы?",
  "Вы согласны с процедурой?",
  "Вы отвечали честно?",

  "Вы отвечали без умысла обмана?",
  "Вы не пытались контролировать голос?",
  "Вы не пытались скрыть эмоции?",
  "Вы не пытались исказить ответы?",
  "Вы говорили правду?",

  "Вы хотите завершить тест?",
  "Вы понимаете, что тест окончен?",
  "Вы осознаёте свои ответы?"
];

/* ========================= */

type Answer = {
  question: string;
  audio: Blob;
  durationMs: number;
};

export default function TestPage() {
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const startTimeRef = useRef<number>(0);
  const answersRef = useRef<Answer[]>([]);

  /* ===== МИКРОФОН ===== */
  useEffect(() => {
    async function init() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);

        recorder.ondataavailable = e => chunksRef.current.push(e.data);

        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          const durationMs = Date.now() - startTimeRef.current;

          answersRef.current.push({
            question: questions[index],
            audio: blob,
            durationMs
          });

          chunksRef.current = [];

          if (index < questions.length - 1) {
            setIndex(i => i + 1);
          } else {
            setDone(true);
            console.log("RESULT:", answersRef.current);
          }
        };

        recorderRef.current = recorder;
      } catch {
        setError("Не удалось получить доступ к микрофону");
      }
    }

    init();
  }, [index]);

  /* ===== АВТО-ЗАПИСЬ ===== */
  useEffect(() => {
    const recorder = recorderRef.current;
    if (!recorder || done) return;

    startTimeRef.current = Date.now();
    recorder.start();

    const timer = setTimeout(() => {
      if (recorder.state === "recording") recorder.stop();
    }, 3000); // ⏱ 3 секунды, без пауз

    return () => clearTimeout(timer);
  }, [index, done]);

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black text-red-500 text-center">
        {error}
      </main>
    );
  }

  if (done) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black text-white text-xl">
        Тест завершён
      </main>
    );
  }

  const progress = Math.round(((index + 1) / questions.length) * 100);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center px-6">
      <div className="max-w-md w-full space-y-8">

        <div className="w-full bg-neutral-800 rounded-full h-2">
          <div className="bg-neutral-100 h-full" style={{ width: `${progress}%` }} />
        </div>

        <div className="text-sm text-neutral-400 text-center">
          Вопрос {index + 1} из {questions.length}
        </div>

        <div className="text-xl text-center leading-relaxed">
          {questions[index]}
        </div>

        <div className="text-center text-neutral-500 text-sm">
          Говорите сразу — запись идёт автоматически
        </div>

      </div>
    </main>
  );
}

