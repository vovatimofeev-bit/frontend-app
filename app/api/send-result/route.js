export async function POST(request) {
  try {
    // 1. Получаем данные из запроса
    const data = await request.json();
    
    // 2. Проверяем что есть email
    const { email, results } = data;
    
    if (!email) {
      return Response.json(
        { error: "Email обязателен" },
        { status: 400 }
      );
    }
    
    // 3. Здесь будет реальная отправка email
    // Пока просто возвращаем успех
    return Response.json({ 
      ok: true, 
      message: "Отчет отправлен (тестовый режим)",
      email: email
    });
    
  } catch (error) {
    return Response.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

// Добавим GET для теста
export async function GET() {
  return Response.json({ 
    ok: true, 
    message: "API работает!",
    timestamp: new Date().toISOString()
  });
}