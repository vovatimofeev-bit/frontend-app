"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  questions: string[];
};

export default function TestRunner({ questions }: Props) {
  const [index, setIndex] = useState(0);
  const [started, setStarted] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataRef = useRef<Float32Array | null>(null);
  const rafRef = useRef<number | null>(null);
  const cooldownRef = useRef(false);

  async function startTest() {
    if (started) return;
    setStarted(true);

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const audioContext = new AudioContext();
    await audioContext.resume(); // критично для Android WebView

    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();

    analyser.fftSize = 2048;
    source.connect(analyser);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
    dataRef.current = new Float32Array(analyser.fftSize);

    listen();
  }

  function listen() {
    const analyser = analyserRef.current;
    const data = dataRef.current;
    if (!analyser || !data) return;

    analyser.getFloatTimeDomainData(data);

    let rms = 0;
    for (let i = 0; i < data.length; i++) {
      rms += data[i] * data[i];
    }
    rms = Math.sqrt(rms / data.length);

    if (rms > 0.03 && !cooldownRef.current) {
      cooldownRef.current = true;

      setIndex((prev) =>
        prev < questions.length - 1 ? prev + 1 : prev
      );

      setTimeout(() => {
        cooldownRef.current = false;
      }, 1200);
    }

    rafRef.current = requestAnimationFrame(listen);
  }

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      audioContextRef.current?.close();
    };
  }, []);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center px-6">
      {!started ? (
        <button
          onClick={startTest}
          className="px-6 py-3 bg-neutral-200 text-black rounded-lg text-lg"
        >
          Начать тест
        </button>
      ) : (
        <div className="max-w-xl text-center space-y-6">
          <div className="text-sm text-neutral-400">
            Вопрос {index + 1} из {questions.length}
          </div>

          <div className="text-2xl leading-relaxed">
            {questions[index]}
          </div>

          <div className="h-1 bg-neutral-800 rounded">
            <div
              className="h-1 bg-neutral-300 rounded transition-all"
              style={{ width: `${((index + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
      )}
    </main>
  );
}
