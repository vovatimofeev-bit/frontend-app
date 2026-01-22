"use client";

import { useEffect, useRef, useState } from "react";

type QuestionType = "baseline" | "control" | "target";

type Question = {
  id: number;
  text: string;
  type: QuestionType;
};

type Answer = {
  id: number;
  type: QuestionType;
  avgLevel: number;
  peakLevel: number;
  durationMs: number;
};

const SILENCE_THRESHOLD = 0.02; // чувствительность
const SILENCE_MS = 1500;       // пауза = конец ответа

// Для примера — возьми свои 64/108 вопросов
const questions: Question[] = [
  { id: 1, text: "Вы сейчас сидите?", type: "baseline" },
  { id: 2, text: "Вы видите этот текст?", type: "baseline" },
  { id: 3, text: "Вы всегда говорите правду?", type: "control" },
  { id: 4, text: "Вы скрывали переписку от партнёра?", type: "target" },
  // … замени на свой полный набор
];

export default function VoiceOnlyTest() {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [status, setStatus] = useState<"init" | "listening" | "done">("init");

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataRef = useRef<Float32Array | null>(null);
  const rafRef = useRef<number | null>(null);

  const speakingRef = useRef(false);
  const lastSoundTsRef = useRef<number>(0);
  const startSpeakTsRef = useRef<number>(0);
  const sumLevelRef = useRef<number>(0);
  const samplesRef = useRef<number>(0);
  const peakRef = useRef<number>(0);

  useEffect(() => {
    startMic();
    return stopMic;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    resetMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  async function startMic() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const ctx = new AudioContext();
    const src = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    src.connect(analyser);

    audioCtxRef.current = ctx;
    analyserRef.current = analyser;
    dataRef.current = new Float32Array(analyser.fftSize);

    setStatus("listening");
    loop();
  }

  function stopMic() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    audioCtxRef.current?.close();
  }

  function resetMetrics() {
    speakingRef.current = false;
    lastSoundTsRef.current = 0;
    startSpeakTsRef.current = 0;
    sumLevelRef.current = 0;
    samplesRef.current = 0;
    peakRef.current = 0;
  }

  function loop() {
    const analyser = analyserRef.current!;
    const data = dataRef.current!;
    analyser.getFloatTimeDomainData(data);

    let rms = 0;
    for (let i = 0; i < data.length; i++) rms += data[i] * data[i];
    rms = Math.sqrt(rms / data.length);

    const now = performance.now();

    if (rms > SILENCE_THRESHOLD) {
      if (!speakingRef.current) {
        speakingRef.current = true;
        startSpeakTsRef.current = now;
      }
      lastSoundTsRef.current = now;
      sumLevelRef.current += rms;
      samplesRef.current += 1;
      peakRef.current = Math.max(peakRef.current, rms);
    } else if (speakingRef.current && now - lastSoundTsRef.current > SILENCE_MS) {
      finalizeAnswer();
    }

    rafRef.current = requestAnimationFrame(loop);
  }

  function finalizeAnswer() {
    const durationMs = Math.round(performance.now() - startSpeakTsRef.current);
    const avgLevel =
      samplesRef.current > 0
        ? Number((sumLevelRef.current / samplesRef.current).toFixed(4))
        : 0;

    const record: Answer = {
      id: questions[index].id,
      type: questions[index].type,
      avgLevel,
      peakLevel: Number(peakRef.current.toFixed(4)),
      durationMs,
    };

    setAnswers(prev => [...prev, record]);

    if (index < questions.length - 1) {
      setIndex(i => i + 1);
    } else {
      setStatus("done");
      console.table([...answers, record]);
    }

    resetMetrics();
  }

  if (status === "done") {
    return (
      <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center">
        <div className="max-w-md text-center space-y-4">
          <div className="text-2xl">Тест завершён</div>
          <div className="text-neutral-400">
            Результаты сохранены в консоли (F12)
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center px-6">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="text-sm text-neutral-400">
          Вопрос {index + 1} из {questions.length}
        </div>
        <div className="text-xl leading-relaxed">
          {questions[index].text}
        </div>
        <div className="text-neutral-400">
          Отвечайте голосом. Пауза завершает ответ.
        </div>
      </div>
    </main>
  );
}



