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
        if (prev < liteQuestions.length - 1) return prev + 1;
        setStage("end");
        return prev;
      });

      setTimeout(() => (cooldownRef.current = false), 1200);
    }

    requestAnimationFrame(listen);
  }

  /* ================= START ================= */
  if (stage === "start") {
    return (
      <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center px-6">
        <div className="max-w-xl text-center space-y-6">
          <h1 className="text-3xl font-semibold">
            Психологический тест для пар Poligramm Lite
          </h1>
          <p className="text-neutral-300 leading-relaxed">
            Использует логику протокольного опроса, применяемого в условиях повышенной психологической нагрузки <br/>
            и высоконагруженных сценариях.
          </p>
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

  /* ================= END ================= */
  if (stage === "end") {
    return (
      <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center px-6">
        <div className="max-w-xl text-center space-y-6">
          <h2 className="text-2xl font-semibold">Вы завершили тестирование</h2>
          <p className="text-neutral-300 leading-relaxed">
            Результаты тестирования обрабатываются индивидуально.
            <br /><br />
            В течение 24 часов вы получите файл с аналитическим заключением
            на указанный e-mail.
            <br/><br/>
            Конфиденциальность гарантирована. Данные не передаются третьим лицам.
          </p>

          <input
            type="email"
            placeholder="Укажите свой e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded bg-neutral-900 border border-neutral-700"
          />

          <p className="text-xs text-neutral-500">
            E-mail используется только для отправки результата
          </p>

          <button
            onClick={async () => {
              if (!email) return setMessage("Введите e-mail");
              setSending(true);
              setMessage("");

              try {
                const res = await fetch("https://poligram-server.vercel.app/submit", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    email,
                    version: "Lite",
                    metrics: [], // сюда можно добавить реальные метрики
                  }),
                });

                const data = await res.json();
                if (data.status === "ok") setMessage("Результат успешно отправлен на e-mail!");
                else setMessage("Ошибка при отправке. Попробуйте позже.");
              } catch (err) {
                console.error(err);
                setMessage("Ошибка при отправке. Попробуйте позже.");
              } finally {
                setSending(false);
              }
            }}
            disabled={sending}
            className="px-6 py-3 bg-neutral-100 text-neutral-900 rounded"
          >
            {sending ? "Отправка..." : "Получить результат"}
          </button>

          {message && <p className="text-sm text-yellow-400">{message}</p>}
        </div>
      </main>
    );
  }

  /* ================= TEST ================= */
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center px-6">
      <div className="max-w-xl text-center space-y-6">
        <div className="text-sm text-neutral-400">
          Вопрос {index + 1} из {liteQuestions.length}
        </div>
        <div className="text-2xl leading-relaxed">{liteQuestions[index].text}</div>
        <div className="h-1 bg-neutral-800 rounded">
          <div
            className="h-1 bg-neutral-300 rounded transition-all"
            style={{ width: `${((index + 1) / liteQuestions.length) * 100}%` }}
          />
        </div>
      </div>
    </main>
  );
}
