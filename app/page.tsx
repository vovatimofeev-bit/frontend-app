"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
//import { Permissions } from '@capacitor/permissions';

export default function Page() {
  const router = useRouter();

  // Запрос разрешения на микрофон при загрузке страницы
  useEffect(() => {
    async function requestMic() {
      try {
        const result = await Permissions.request({ name: 'microphone' });
        console.log('Microphone permission:', result);

        if (result.state !== 'granted') {
          alert('Разрешение на микрофон не предоставлено. Работа приложения будет ограничена.');
        }
      } catch (error) {
        console.error('Ошибка запроса микрофона:', error);
      }
    }

    requestMic();
  }, []);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center px-6">
      <div className="max-w-xl text-center space-y-6">
        <h1 className="text-3xl font-semibold">
          Poligram — психологический тест
        </h1>
        <p className="text-neutral-300 leading-relaxed">
          Выберите версию теста:
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.push("/pro")}
            className="px-6 py-3 bg-neutral-100 text-neutral-900 rounded"
          >
            Открыть PRO (108 вопросов)
          </button>

          <button
            onClick={() => router.push("/lite")}
            className="px-6 py-3 bg-neutral-100 text-neutral-900 rounded"
          >
            Открыть LITE (64 вопроса)
          </button>
        </div>
      </div>
    </main>
  );
}
