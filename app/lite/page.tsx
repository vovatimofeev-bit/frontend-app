"use client";

import { useEffect, useRef, useState } from "react";

const questions: string[] = [
  "Вы понимаете, что сейчас будет происходить?",
  "Вы даёте согласие на прохождение этого теста?",
  "Вы готовы следовать инструкциям?",
  "Ваше текущее состояние можно назвать обычным?",
  "Вам сейчас комфортно продолжать?",
  "Вы готовы начать тестирование?",

  "Вы ощущаете опору под телом?",
  "Вы осознаёте своё дыхание?",
  "Ваше дыхание сейчас ровное?",
  "Вы замечаете паузы между вопросами?",
  "Вы чувствуете напряжение в теле?",
  "Вы замечаете биение сердца?",
  "Ваше внимание сейчас устойчиво?",
  "Вам легко удерживать фокус?",
  "Вы осознаёте положение своего тела?",
  "Ваши мышцы сейчас скорее расслаблены?",
  "Вы замечаете фоновые звуки?",
  "Они отвлекают вас?",
  "Ваше состояние менялось с начала теста?",
  "Вам комфортен текущий темп?",

  "За всю жизнь вы хоть раз говорили неправду?",
  "Вам когда-нибудь было стыдно за свои поступки?",
  "Вы когда-либо нарушали обещания?",
  "Вы испытывали чувство вины?",
  "Вы скрывали правду, чтобы избежать последствий?",
  "Вы лгали из вежливости?",
  "Вы приукрашивали факты, рассказывая о себе?",
  "Вы считаете себя честным человеком?",
  "Вы допускаете, что можете ошибаться?",
  "Вы стараетесь выглядеть лучше в глазах других?",

  "Вы состоите в значимых отношениях?",
  "Эти отношения для вас важны?",
  "Вы испытывали сомнения в этих отношениях?",
  "Вам было сложно говорить о чувствах открыто?",
  "Вы ощущали внутренний конфликт, связанный с партнёром?",
  "Вы что-то не озвучивали, чтобы избежать напряжения?",
  "Вы боялись последствий откровенности?",
  "Вы чувствовали эмоциональную дистанцию?",
  "Вы ощущали вину, не обсуждая её напрямую?",
  "Вы считаете доверие важным элементом отношений?",
  "Вы считаете допустимым личное пространство в паре?",
  "Вы иногда сомневались в своём выборе?",
  "Вы боялись потерять эти отношения?",
  "Вы старались сохранять образ надёжности?",
  "Вы чувствовали, что вас не до конца понимают?",
  "Вы чувствовали, что не до конца откровенны?",
  "Вы ощущали внутреннее противоречие?",
  "Эти вопросы вызывают у вас напряжение?",

  "Вы анализируете не только вопрос, но и свою реакцию?",
  "Вы пытаетесь предугадать следующий вопрос?",
  "Вы сравниваете вопросы между собой?",
  "Вы возвращаетесь мысленно к предыдущим ответам?",
  "Вы стараетесь отвечать «правильно»?",
  "Вы ощущаете изменение своего состояния?",
  "Вы контролируете ответы сознательно?",
  "Вы думаете о результате теста?",
  "Вы чувствуете усталость?",
  "Вы замечаете снижение концентрации?",

  "Вы чувствуете, что тест подходит к завершению?",
  "Ваше напряжение сейчас выше, чем в начале?",
  "Вы чувствуете облегчение?",
  "Вы считаете свои реакции последовательными?",
  "Вы готовы завершить тестирование?",
  "Тест завершён."
];

export default function Page() {
  const [stage, setStage] = useState<"start" | "test" | "end">("start");
  const [index, setIndex] = useState(0);

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
    for (let i = 0; i < data.length; i++) {
      rms += data[i] * data[i];
    }
    rms = Math.sqrt(rms / data.length);

    if (rms > 0.03 && !cooldownRef.current) {
      cooldownRef.current = true;

      setIndex((prev) => {
        if (prev < questions.length - 1) return prev + 1;
        setStage("end");
        return prev;
      });

      setTimeout(() => {
        cooldownRef.current = false;
      }, 1200);
    }

    requestAnimationFrame(listen);
  }

  if (stage === "start") {
    return (
      <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center px-6">
        <div className="max-w-xl text-center space-y-6">
          <h1 className="text-3xl font-semibold">
            Poligram LITE
          </h1>
          <p className="text-neutral-300 leading-relaxed">
            Лёгкая версия теста.
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

  if (stage === "end") {
    return (
      <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center px-6">
        <div className="max-w-xl text-center space-y-6">
          <h2 className="text-2xl font-semibold">Вы завершили тестирование</h2>
          <p className="text-neutral-300 leading-relaxed">
            Результаты тестирования обрабатываются индивидуально.
          </p>
          <button className="px-6 py-3 bg-neutral-100 text-neutral-900 rounded">
            Готово
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center px-6">
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
    </main>
  );
}
