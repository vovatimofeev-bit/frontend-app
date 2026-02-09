"use client";

import { useEffect, useRef, useState } from "react";
import { questions } from "@/app/data/questions";

export default function ProPage() {
  const [stage, setStage] = useState<"start" | "test" | "end">("start");
  const [index, setIndex] = useState(0);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [ledActive, setLedActive] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataRef = useRef<Float32Array | null>(null);

  const isListeningRef = useRef(false);
  const cooldownRef = useRef(false);
  const metricsRef = useRef<
    Array<{
      block: string;
      questionIndex: number;
      voiceRmsAvg: number;
      voiceRmsPeak: number;
      responseTimeMs: number;
      timestamp: number;
    }>
  >([]);
  const questionStartRef = useRef<number>(Date.now());

  // Анимация светодиодов
  useEffect(() => {
    if (!sending) {
      setLedActive(0);
      return;
    }

    const interval = setInterval(() => {
      setLedActive(prev => (prev < 4 ? prev + 1 : 0));
    }, 200);

    return () => clearInterval(interval);
  }, [sending]);

  useEffect(() => {
    if (stage !== "test") return;
    if (typeof window === "undefined") return;

    async function initMic() {
      try {
        const stream: MediaStream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: false
          } 
        });
        
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.8;
        source.connect(analyser);

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        dataRef.current = new Float32Array(analyser.fftSize);

        isListeningRef.current = true;
        questionStartRef.current = Date.now();
        listen();
      } catch (err) {
        console.error("Ошибка доступа к микрофону:", err);
        setMessage("Не удалось получить доступ к микрофону");
      }
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
        const responseTime = now - questionStartRef.current;
        
        metricsRef.current.push({
          block: "pro",
          questionIndex: prev,
          voiceRmsAvg: rms,
          voiceRmsPeak: rms,
          responseTimeMs: responseTime,
          timestamp: now,
        });

        questionStartRef.current = now;

        if (prev < questions.length - 1) {
          return prev + 1;
        } else {
          setStage("end");
          return prev;
        }
      });

      setTimeout(() => (cooldownRef.current = false), 1200);
    }

    requestAnimationFrame(listen);
  }

  const handleSendResults = async () => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setMessage("Введите корректный e-mail");
      return;
    }
    setSending(true);
    setMessage("");

    try {
      const res = await fetch("/api/send-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          version: "PRO",
          metrics: metricsRef.current,
        }),
      });

      const data = await res.json();
      if (data.status === "ok" || data.message === "Результат отправлен") {
        setMessage("✅ Письмо отправлено. Вы получите отчет на указанный email в течение 24 часов.");
      } else {
        setMessage("Ошибка сервера. Попробуйте позже.");
      }
    } catch (e) {
      console.error(e);
      setMessage("Ошибка при отправке. Попробуйте позже.");
    } finally {
      setSending(false);
    }
  };

  if (stage === "start") {
    return (
      <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center px-6">
        <div className="max-w-xl text-center space-y-6">
          <h1 className="text-3xl font-semibold">
            Poligramm PRO — Анализ реакций на доверие и искренность
          </h1>
          <p className="text-neutral-300 leading-relaxed">
            Тест использует логику протокольного опроса, применяемого в условиях повышенной 
            психологической нагрузки и высоконагруженных сценариев.
          </p>
          <button
            onClick={() => setStage("test")}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
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
            placeholder="Введите ваш e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded bg-neutral-900 border border-neutral-700"
          />

          <button
            disabled={sending}
            onClick={handleSendResults}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-neutral-800 transition relative"
          >
            {sending ? (
              <div className="flex items-center justify-center">
                {/* 4 светодиода */}
                <div className="flex space-x-1 mr-3">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-4 rounded-full ${
                        ledActive === i 
                          ? 'bg-green-400 shadow-[0_0_6px_#4ade80]' 
                          : 'bg-green-900'
                      }`}
                    />
                  ))}
                </div>
                <span>Отправка...</span>
              </div>
            ) : (
              "Отправить результат"
            )}
          </button>

          {message && <p className={`text-sm ${message.includes("✅") ? "text-green-400" : "text-red-400"}`}>{message}</p>}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        {/* Прогресс с процентами */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-400">Вопрос {index + 1} из {questions.length}</span>
            <span className="text-neutral-500">{Math.round(((index + 1) / questions.length) * 100)}%</span>
          </div>
          <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-1.5 bg-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${((index + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Карточка вопроса */}
        <div className="bg-neutral-900/30 p-8 rounded-xl border border-neutral-700/50">
          <div className="text-2xl leading-relaxed">{questions[index]}</div>
        </div>

        {/* Индикатор микрофона */}
        <div className="flex items-center justify-center space-x-3">
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="w-1 h-6 bg-indigo-500 rounded-full animate-pulse"
                style={{ 
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '0.8s'
                }}
              />
            ))}
          </div>
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            <span className="text-sm text-neutral-400">Говорите для ответа</span>
          </div>
        </div>
      </div>
    </main>
  );
}