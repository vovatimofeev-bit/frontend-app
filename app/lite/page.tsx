"use client";

import { useEffect, useRef, useState } from "react";
import { liteQuestions } from "@/app/data/questions-lite";

export default function LitePage() {
  const [stage, setStage] = useState<"start" | "test" | "end">("start");
  const [index, setIndex] = useState(0);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataRef = useRef<Float32Array | null>(null);

  const isListeningRef = useRef(false);
  const cooldownRef = useRef(false);

  // ✅ NEW — METRICS
  const metricsRef = useRef<any[]>([]);
  const questionStartRef = useRef<number>(Date.now());

  useEffect(() => {
    if (stage !== "test") return;

    async function initMic() {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();

      analyser.fftSize = 2048;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      dataRef.current = new Float32Array(analyser.fftSize);

      isListeningRef.current = true;
      questionStartRef.current = Date.now();
      listen();
    }

    initMic();

    return () => {
      isListeningRef.current = false;
      audioContextRef.current?.close();
    };
  }, [stage]);

  function listen() {
    if (!isListeningRef.current) return;

    const analyser = analyserRef.current!;
    const data = dataRef.current!;

    analyser.getFloatTimeDomainData(data);

    let rms = 0;
    for (let i = 0; i < data.length; i++) rms += data[i] * data[i];
    rms = Math.sqrt(rms / data.length);

    if (rms > 0.03 && !cooldownRef.current) {
      cooldownRef.current = true;

      setIndex((prev) => {
        const now = Date.now();

        metricsRef.current.push({
          block: "lite",
          questionIndex: prev,
          voiceRmsAvg: rms,
          voiceRmsPeak: rms,
          responseTimeMs: now - questionStartRef.current,
          timestamp: now
        });

        questionStartRef.current = now;

        if (prev < liteQuestions.length - 1) return prev + 1;
        setStage("end");
        return prev;
      });

      setTimeout(() => (cooldownRef.current = false), 1200);
    }

    requestAnimationFrame(listen);
  }

  if (stage === "start") {
    return (
      <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center px-6">
        <div className="max-w-xl text-center space-y-6">
          <h1 className="text-3xl font-semibold">
            Психологический тест для пар Poligramm Lite
          </h1>
          <button
            onClick={() => setStage("test")}
            className="px-6 py-3 bg-neutral-100 text-neutral-900 rounded"
          >
            Начать тест
          </button>
        </div>
      </main>
    );
  }

  if (stage === "end") {
    return (
      <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center px-6">
        <div className="max-w-xl text-center space-y-6">
          <h2 className="text-2xl font-semibold">Вы завершили тестирование</h2>

          <input
            type="email"
            placeholder="Укажите свой e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded bg-neutral-900 border border-neutral-700"
          />

          <button
            onClick={async () => {
              if (!email) return setMessage("Введите e-mail");
              setSending(true);
              setMessage("");

              try {
                const res = await fetch("https://poligram-server.vercel.app/api/submit", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    email,
                    version: "LITE",
                    metrics: metricsRef.current
                  }),
                });

                const data = await res.json();
                if (data.status === "ok") setMessage("Результат отправлен");
                else setMessage("Ошибка при отправке.");
              } catch {
                setMessage("Ошибка при отправке.");
              } finally {
                setSending(false);
              }
            }}
            disabled={sending}
            className="px-6 py-3 bg-neutral-100 text-neutral-900 rounded"
          >
            {sending ? "Отправка..." : "Отправить результат"}
          </button>

          {message && <p className="text-sm text-yellow-400">{message}</p>}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center px-6">
      <div className="max-w-xl text-center space-y-6">
        <div className="text-sm text-neutral-400">
          Вопрос {index + 1} из {liteQuestions.length}
        </div>
        <div className="text-2xl leading-relaxed">{liteQuestions[index].text}</div>
      </div>
    </main>
  );
}
