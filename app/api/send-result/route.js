import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { email, version, metrics } = await request.json();
    
    console.log('📨 Получены результаты:', { 
      email, 
      version, 
      questions: metrics?.length || 0 
    });
    
    return NextResponse.json({
      ok: true,
      message: `✅ Результаты получены! Отчет будет отправлен на ${email}`,
      received: {
        email,
        version,
        questions: metrics?.length || 0,
        timestamp: new Date().toISOString()
      }
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
    
    return NextResponse.json({
      ok: false,
      message: '❌ Ошибка обработки запроса',
      error: error.message
    }, {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    });
  }
}

export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
      'Access-Control-Max-Age': '86400',
    },
  });
}