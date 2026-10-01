// Tipos de entrada para la calculadora
export interface CalculatorInputs {
  inputMode: 'VES' | 'USD';
  amount: number;
  tasaCompraEfectiva: number;
  binanceRate: number;
  bankCommissionPct: number;      // ej: 2.5 para 2.5%
  gatewayCommissionPct: number;   // ej: 4.1 para 4.1%
}

// Tipos de salida (Resultados)
export interface CalculatorResults {
  usdComprados: number;
  totalDebitadoVES: number;
  usdtRecibidos: number;
  vesRetorno: number;
  gananciaNetaVES: number;
  roiPorcentaje: number;
}

/**
 * Función pura que calcula el ciclo de arbitraje exacto según el PRD.
 */
export function calculateArbitrage(inputs: CalculatorInputs): CalculatorResults {
  const {
    inputMode,
    amount,
    tasaCompraEfectiva,
    binanceRate,
    bankCommissionPct,
    gatewayCommissionPct,
  } = inputs;

  // Si no hay monto o tasas, retornamos ceros para no romper la UI
  if (!amount || !tasaCompraEfectiva || !binanceRate) {
    return {
      usdComprados: 0,
      totalDebitadoVES: 0,
      usdtRecibidos: 0,
      vesRetorno: 0,
      gananciaNetaVES: 0,
      roiPorcentaje: 0,
    };
  }

  let totalDebitadoVES = 0;
  let totalDebitadoUSD = 0;
  
  const bankCommFactor = 1 + (bankCommissionPct / 100);
  const gatewayFactor = 1 - (gatewayCommissionPct / 100);

  // --- BIFURCACIÓN SEGÚN EL TIPO DE ENTRADA ---
  if (inputMode === 'VES') {
    // Si metes 10000 VES, eso equivale a 10000 / TasaCompra en tu cuenta
    totalDebitadoVES = amount;
    totalDebitadoUSD = amount / tasaCompraEfectiva;
  } else {
    // Si metes 100 USD, significa que tu banco te va a descontar 100 * TasaCompra en VES
    totalDebitadoUSD = amount;
    totalDebitadoVES = amount * tasaCompraEfectiva;
  }

  // 1. Monto que debes poner en Binance para que el banco te descuente exactamente el totalDebitadoUSD
  // (Ej: Si quieres gastar 100$, en Binance pides 97.56$ porque el banco le sumará el 2.5%)
  const bankChargeUSD = totalDebitadoUSD / bankCommFactor;

  // 2. Monto neto que te llega a Binance después de que la pasarela te quita el 4.1%
  const usdtRecibidos = bankChargeUSD * gatewayFactor;
  
  // 3. Vendemos esos USDT en P2P
  const vesRetorno = usdtRecibidos * binanceRate;

  // --- CÁLCULO DE MÁRGENES ---
  const gananciaNetaVES = vesRetorno - totalDebitadoVES;
  const roiPorcentaje = (gananciaNetaVES / totalDebitadoVES) * 100;

  return {
    usdComprados: totalDebitadoUSD, // Mostramos el equivalente total en USD de la inversión
    totalDebitadoVES,
    usdtRecibidos,
    vesRetorno,
    gananciaNetaVES,
    roiPorcentaje,
  };
}
