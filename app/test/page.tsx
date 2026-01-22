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

const SILENCE_THRESHOLD = 0.02;
const SILENCE_MS = 1500;

const questions: Question[] = [
  { id: 1, text: "Вы сейчас сидите?", type: "baseline" },
  { id: 2, text: "Вы видите этот текст?", type: "baseline" },
  { id: 3, text: "Вы всегда говорите правду?", type: "control" },
  { id: 4, text: "Вы скрывали переписку от партнёра?", type: "target" },
  // 👉 можешь вставить все 108
];

export default function VoiceOnlyTest() {
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState<"init" | "listening" | "done">("init");
  const [answers, setAnswers] = useState<Answer[]>([]);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  const speakingRef = useRef(false);
  const lastSoundTsRef = useRef(0);
  const startSpeakTsRef = useRef(0);
  const sumLevelRef = useRef(0);
  const samplesRef = useRef(0);
  const peakRef = useRef(0);

  useEffect(() => {
    startMic();
    return stopMic;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    resetMetrics();
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
    const buffer = new Float32Array(analyser.fftSize); // ✅ КЛЮЧЕВОЕ ИЗМЕНЕНИЕ

    analyser.getFloatTimeDomainData(buffer);

    let rms = 0;
    for (let i = 0; i < buffer.length; i++) {
      rms += buffer[i] * buffer[i];
    }
    rms = Math.sqrt(rms / buffer.length);

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
    } else if (
      speakingRef.current &&
      now - lastSoundTsRef.current > SILENCE_MS
    ) {
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
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-xl">Тест завершён</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="max-w-md text-center space-y-4">
        <div className="text-sm opacity-60">
          Вопрос {index + 1} из {questions.length}
        </div>
        <div className="text-xl">{questions[index].text}</div>
        <div className="text-sm opacity-50">
          Отвечайте голосом. Пауза завершает ответ.
        </div>
      </div>
    </main>
  );
}
