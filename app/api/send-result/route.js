export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const data = await request.json();
    const { email } = data;
    
    if (!email) {
      return Response.json(
        { error: "Email обязателен" },
        { status: 400 }
      );
    }
    
    return Response.json({ 
      ok: true, 
      message: "Отчет отправлен на Vercel",
      email: email
    });
    
  } catch (error) {
    return Response.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

// Для теста
export async function GET() {
  return Response.json({ 
    ok: true, 
    message: "API работает на Vercel",
    timestamp: new Date().toISOString()
  });
}