import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export async function GET() {
  try {
    // La página oficial del BCV suele tener problemas de Certificados SSL o bloqueos por IP.
    // Usaremos DolarAPI (un servicio gratuito y muy estable en Venezuela) para obtener la tasa oficial del BCV.
    const response = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', {
      headers: {
        'Accept': 'application/json'
      },
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    
    // DolarAPI devuelve la tasa oficial en la propiedad "promedio"
    const rate = data.promedio;

    if (typeof rate !== 'number' || isNaN(rate)) {
      throw new Error('Formato de tasa inválido recibido desde la API.');
    }

    return NextResponse.json({
      success: true,
      currency: 'USD',
      rate: rate,
      timestamp: data.fechaActualizacion || new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Error fetching BCV rate:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al obtener la tasa';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
