import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
// Para Binance podemos revalidar más seguido ya que cambian rápido, por ej. cada 5 minutos
export const revalidate = 300;

export async function GET() {
  try {
    const payload = {
      fiat: 'VES',
      page: 1,
      rows: 5,
      tradeType: 'SELL', // Desde la perspectiva del usuario (vender sus USDT por bolívares)
      asset: 'USDT',
      countries: [],
      proMerchantAds: false, // Permitimos que entren todos (verificados y no verificados) para mejor tasa
      shieldMerchantAds: false,
      publisherType: null,
      payTypes: ['PagoMovil', 'BancoDeVenezuela', 'Banesco', 'Mercantil', 'Provincial', 'BNC'], // Filtro ampliado para incluir transferencias directas a bancos principales (mejora la tasa)
      classifies: ['mass', 'profession', 'tier1', 'tier2'],
    };

    const response = await fetch(
      'https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const json = await response.json();

    if (!json.success || !json.data || json.data.length === 0) {
      throw new Error('La API de Binance no devolvió anuncios válidos.');
    }

    // Extraemos los precios de los primeros 5 anuncios
    const prices = json.data.map((item: { adv: { price: string } }) => parseFloat(item.adv.price));

    // Calculamos el promedio de estos 5 para tener una tasa realista (ni muy alta ni muy baja)
    const sum = prices.reduce((a: number, b: number) => a + b, 0);
    const averageRate = sum / prices.length;

    return NextResponse.json({
      success: true,
      currency: 'VES',
      asset: 'USDT',
      averageRate: averageRate,
      topRates: prices,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Error fetching Binance P2P rate:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al obtener la tasa de Binance';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
