"use client";

import { useEffect, useRef, useState } from "react";

const questions: string[] = [
  "Вы понимаете, что сейчас будет происходить?",
  "Вы даёте согласие на прохождение теста?",
  "Вы готовы следовать инструкциям до конца?",
  "Вы чувствуете себя достаточно собранно?",
  "Ваше состояние можно назвать обычным?",
  "Вы выспались сегодня?",
  "Вы не испытываете физического дискомфорта?",
  "Вам сейчас комфортно продолжать?",
  "Вы готовы быть внимательны к своим реакциям?",
  "Вы готовы начать процедуру?",
  "Вы ощущаете опору под телом?",
  "Вы осознаёте своё дыхание?",
  "Ваше дыхание сейчас ровное?",
  "Вы замечаете паузы между вопросами?",
  "Вы ощущаете напряжение в теле?",
  "Вы замечаете биение сердца?",
  "Ваше внимание устойчиво?",
  "Вам легко удерживать фокус?",
  "Вы осознаёте положение своего тела?",
  "Ваши мышцы сейчас расслаблены?",
  "Вы ощущаете вес век?",
  "Вы моргаете реже обычного?",
  "Вы замечаете фоновые звуки?",
  "Они отвлекают вас?",
  "Вы контролируете позу?",
  "Вы чувствуете лёгкость или тяжесть в теле?",
  "Ваше состояние менялось за последние минуты?",
  "Вам комфортно продолжать в этом темпе?",
  "Вы чувствуете внутреннюю собранность?",
  "Вы готовы перейти дальше?",
  "За всю жизнь вы хоть раз говорили неправду?",
  "Вам когда-нибудь было стыдно за свой поступок?",
  "Вы когда-либо нарушали обещание?",
  "Вы когда-нибудь испытывали чувство вины?",
  "Вы приукрашивали свои поступки в рассказах?",
  "Вы скрывали правду, чтобы избежать последствий?",
  "Вы лгали из вежливости?",
  "Вы оправдывали себя задним числом?",
  "Вы считаете себя честным человеком?",
  "Вы считаете себя полностью честным человеком?",
  "Вы допускаете, что можете ошибаться?",
  "Вам важно выглядеть достойно в глазах других?",
  "Вы стремитесь к одобрению?",
  "Вам сложно признавать ошибки?",
  "Вы готовы отвечать максимально искренне?",
  "Вы состоите в значимых отношениях?",
  "Эти отношения для вас важны?",
  "Вы испытывали сомнения в этих отношениях?",
  "Вы чувствовали внутренний конфликт, связанный с партнёром?",
  "Вам было сложно что-то обсуждать открыто?",
  "Вы ощущали необходимость что-то не озвучивать?",
  "Вы боялись последствий откровенности?",
  "Вы чувствовали эмоциональную дистанцию?",
  "Вы испытывали влечение, которое не обсуждали?",
  "Вы чувствовали вину, не называя её прямо?",
  "Вы ощущали напряжение в теме доверия?",
  "Вы считаете доверие важным элементом отношений?",
  "Вы считаете допустимым личное пространство?",
  "Вы иногда сомневаетесь в выборе?",
  "Вы боялись потерять эти отношения?",
  "Вы старались сохранить образ надёжности?",
  "Вы чувствовали, что вас не до конца понимают?",
  "Вы чувствовали, что не до конца откровенны?",
  "Вы ощущали внутреннее противоречие?",
  "Вы избегали сложных разговоров?",
  "Вы чувствовали напряжение, отвечая на эти вопросы?",
  "Это напряжение сохраняется сейчас?",
  "Вы осознаёте свои реакции?",
  "Вы стараетесь контролировать ответы?",
  "Вы готовы продолжать?",
  "Вы анализируете не вопрос, а свою реакцию?",
  "Вы предугадываете следующий вопрос?",
  "Вы сравниваете вопросы между собой?",
  "Вы возвращаетесь к предыдущим ответам?",
  "Вы думаете, как выглядите со стороны?",
  "Вы пытаетесь выглядеть нейтрально?",
  "Вы даёте социально ожидаемые ответы?",
  "Вы ощущаете изменение состояния?",
  "Вы внутренне оправдываетесь?",
  "Вы контролируете дыхание сознательно?",
  "Вам стало сложнее отвечать быстро?",
  "Вы чувствуете сухость во рту?",
  "Вы чувствуете изменение сердцебиения?",
  "Вы стараетесь отвечать «правильно»?",
  "Вы думаете о результате теста?",
  "Вы думаете о последствиях?",
  "Вы ощущаете усталость?",
  "Вы ощущаете напряжение?",
  "Вы чувствуете снижение концентрации?",
  "Вы замечаете это прямо сейчас?",
  "Вам хочется ускорить процесс?",
  "Вам хочется, чтобы тест закончился?",
  "Вы всё ещё стараетесь быть точным?",
  "Вы сомневаетесь в части ответов?",
  "Вы осознаёте это сомнение?",
  "Вы чувствуете усталость?",
  "Ваше напряжение выше, чем в начале?",
  "Вы чувствуете облегчение?",
  "Вам стало труднее удерживать фокус?",
  "Вы хотите что-то изменить в ответах?",
  "Вы считаете свои реакции последовательными?",
  "Вы осознаёте завершение процедуры?",
  "Вы готовы закончить тест?",
  "Вы согласны с завершением?",
  "Вы чувствуете завершённость процесса?",
  "Вы возвращаетесь к обычному состоянию?",
  "Вы готовы продолжить день?",
  "Тест завершён."
];

export default function Page() {
  const [stage, setStage] = useState<"start" | "test" | "end">("start");
  const [index, setIndex] = useState(0);
  const [email, setEmail] = useState("");

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
        if (prev < questions.length - 1) return prev + 1;
        setStage("end");
        return prev;
      });

      setTimeout(() => (cooldownRef.current = false), 1200);
    }

    requestAnimationFrame(listen);
  }

  async function handleSendResult() {
    if (!email) return alert("Введите email!");

    const response = await fetch("https://poligramm-server.vercel.app/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        version: "PRO",
        email,
        metrics: [], // сюда реальные метрики можно вставить
      }),
    });

    const data = await response.json();
    if (data.status === "ok") alert("Результат отправлен на почту!");
  }

  /* ================= START ================= */
  if (stage === "start") {
    return (
      <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center px-6">
        <div className="max-w-xl text-center space-y-6">
          <h1 className="text-3xl font-semibold">
            Психологический тест для пар Poligramm PRO
          </h1>
          <p className="text-neutral-300 leading-relaxed">
            Использует логику протокольного опроса, применяемого в условиях повышенной психологической нагрузки
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
            <br />
            В течение 24 часов вы получите файл с аналитическим заключением на указанный e-mail.
            <br /><br />
            Конфиденциальность гарантирована. Данные не передаются третьим лицам.
          </p>

          <input
            type="email"
            placeholder="Введите ваш e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded bg-neutral-900 border border-neutral-700"
          />

          <p className="text-xs text-neutral-500">
            E-mail используется только для отправки результата
          </p>

          <button
            onClick={handleSendResult}
            className="px-6 py-3 bg-neutral-100 text-neutral-900 rounded"
          >
            Получить результат
          </button>
        </div>
      </main>
    );
  }

  /* ================= TEST ================= */
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center px-6">
      <div className="max-w-xl text-center space-y-6">
        <div className="text-sm text-neutral-400">
          Вопрос {index + 1} из {questions.length}
        </div>
        <div className="text-2xl leading-relaxed">{questions[index]}</div>
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
