'use client';

import { useState, useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { RefreshCw, TrendingUp, Wallet, ArrowRightLeft, DollarSign } from 'lucide-react';
import { calculateArbitrage } from '@/lib/calculator';
import { NumericFormat } from 'react-number-format';

/** 
 * Componente para animar números de forma fluida (Premium UI)
 */
function AnimatedNumber({ value, prefix = '', suffix = '', decimals = 2, className = '' }: { value: number, prefix?: string, suffix?: string, decimals?: number, className?: string }) {
  const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
  
  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  const display = useTransform(spring, (current) => 
    `${prefix}${current.toLocaleString('es-VE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`
  );

  return <motion.span className={className}>{display}</motion.span>;
}

export default function Home() {
  const [isLoadingRates, setIsLoadingRates] = useState(true);
  const [bcvRate, setBcvRate] = useState(0); // Para display visual
  const [bcvCompraRate, setBcvCompraRate] = useState<string>('0');
  const [binanceP2PRate, setBinanceP2PRate] = useState<string>('0');

  // Estados del formulario
  const [inputMode, setInputMode] = useState<'VES' | 'USD'>('VES');
  // Usamos el string sin formato que nos da la librería (ej: "10000.50")
  const [amount, setAmount] = useState<string>('10000');
  const [bankCommissionPct, setBankCommissionPct] = useState<string>('2.5');
  const [gatewayCommissionPct, setGatewayCommissionPct] = useState<string>('4.1');

  const fetchRates = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsLoadingRates(true);
    try {
      const [bcvRes, binanceRes] = await Promise.all([
        fetch('/api/bcv').then(r => r.json()),
        fetch('/api/binance').then(r => r.json())
      ]);
      
      if (bcvRes.success) {
        setBcvRate(bcvRes.rate);
        setBcvCompraRate((bcvRes.rate * 1.005).toFixed(2));
      }
      if (binanceRes.success) {
        setBinanceP2PRate(binanceRes.averageRate.toFixed(2));
      }
    } catch (error) {
      console.error("Error al refrescar tasas", error);
    }
    setIsLoadingRates(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRates(false);
  }, []);

  // Función para cambiar de moneda y convertir automáticamente el monto visual
  const handleModeSwitch = (newMode: 'VES' | 'USD') => {
    if (newMode === inputMode) return;
    
    const currentVal = parseFloat(amount) || 0;
    const bcvCompra = parseFloat(bcvCompraRate) || (bcvRate * 1.005);
    
    if (newMode === 'USD' && inputMode === 'VES') {
      // De VES (Saldo total en cuenta) a equivalente en USD (Saldo total en cuenta)
      const newAmount = bcvCompra > 0 ? (currentVal / bcvCompra) : 0;
      setAmount(newAmount.toFixed(2));
    } else if (newMode === 'VES' && inputMode === 'USD') {
      // De USD a VES (multiplicamos directo por la tasa de compra)
      const newAmount = currentVal * bcvCompra;
      setAmount(newAmount.toFixed(2));
    }
    setInputMode(newMode);
  };

  // Calculamos los resultados en tiempo real (durante el render)
  const numAmount = parseFloat(amount) || 0;
  const numBankComm = parseFloat(bankCommissionPct) || 0;
  const numGateComm = parseFloat(gatewayCommissionPct) || 0;
  const numBcvCompra = parseFloat(bcvCompraRate) || 0;
  const numBinanceRate = parseFloat(binanceP2PRate) || 0;

  const results = calculateArbitrage({
    inputMode,
    amount: numAmount,
    tasaCompraEfectiva: numBcvCompra,
    binanceRate: numBinanceRate,
    bankCommissionPct: numBankComm,
    gatewayCommissionPct: numGateComm,
  });

  // Diferencia porcentual entre lo que me cuesta el dólar vs en cuánto lo vendo en P2P
  const gapPct = numBcvCompra > 0 ? ((numBinanceRate - numBcvCompra) / numBcvCompra) * 100 : 0;

  // Si hay ganancias, encendemos el neón
  const isProfitable = results.gananciaNetaVES > 0;

  return (
    <main className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4 font-sans text-neutral-200">
      
      {/* Contenedor Principal (Tarjeta) */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative"
      >
        {/* Glow effect detrás si es rentable */}
        {isProfitable && (
          <div className="absolute -inset-0.5 bg-green-500/20 blur-2xl rounded-3xl -z-10 transition-opacity duration-1000" />
        )}

        {/* --- HEADER & TASAS --- */}
        <div className="p-6 pb-4 border-b border-neutral-800/50 relative">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="text-green-400 w-5 h-5" />
              Bike VE
            </h1>
            <button 
              onClick={() => fetchRates(true)}
              disabled={isLoadingRates}
              aria-label="Actualizar tasas"
              className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-full transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-neutral-400 ${isLoadingRates ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Tasas minimalistas */}
          <div className="flex gap-3 relative">
            <div className="flex-[1.2] bg-neutral-950/50 rounded-xl p-3 border border-neutral-800/50 flex flex-col justify-center">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] text-neutral-500 font-bold tracking-wide">BCV BASE</span>
                <span className="text-xs text-neutral-300 font-mono">{isLoadingRates ? '...' : `Bs ${bcvRate.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-green-400 font-bold tracking-wide">COMPRA</span>
                {isLoadingRates ? (
                  <span className="text-xs text-green-400 font-mono">...</span>
                ) : (
                  <NumericFormat 
                    value={bcvCompraRate} 
                    onValueChange={values => setBcvCompraRate(values.value)}
                    decimalSeparator=","
                    prefix="Bs "
                    className="bg-transparent w-[80px] text-right outline-none border-b border-dashed border-green-500/40 focus:border-green-400 pb-0.5 transition-colors text-xs text-green-400 font-mono"
                  />
                )}
              </div>
            </div>
            
            <div className="flex-[1] bg-neutral-950/50 rounded-xl p-3 border border-neutral-800/50 flex flex-col justify-center">
              <p className="text-[10px] text-neutral-500 mb-1 font-bold tracking-wide text-right">BINANCE P2P</p>
              <div className="flex flex-col items-end gap-1">
                {isLoadingRates ? (
                  <p className="text-sm text-white font-mono text-right leading-none">...</p>
                ) : (
                  <NumericFormat 
                    value={binanceP2PRate} 
                    onValueChange={values => setBinanceP2PRate(values.value)}
                    decimalSeparator=","
                    prefix="Bs "
                    className="bg-transparent w-[90px] text-right outline-none border-b border-dashed border-neutral-600 focus:border-white pb-0.5 transition-colors text-sm text-white font-mono leading-none"
                  />
                )}
                {!isLoadingRates && numBcvCompra > 0 && (
                  <span className={`text-[9px] font-black border border-neutral-700 px-1.5 py-0.5 rounded bg-neutral-900 mt-0.5 ${gapPct > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    BRECHA {gapPct > 0 ? '+' : ''}{gapPct.toFixed(2)}%
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* --- INPUTS --- */}
        <div className="p-6 space-y-5">
          
          {/* Monto principal */}
          <div>
            <div className="flex justify-between items-end mb-2">
              <label htmlFor="capital-input" className="text-sm font-medium text-neutral-400">Capital Disponible</label>
              
              {/* Toggle de Moneda */}
              <div className="flex bg-neutral-950 rounded-lg p-1 border border-neutral-800" role="group" aria-label="Seleccionar moneda">
                <button
                  onClick={() => handleModeSwitch('VES')}
                  aria-pressed={inputMode === 'VES'}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${inputMode === 'VES' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                >
                  VES
                </button>
                <button
                  onClick={() => handleModeSwitch('USD')}
                  aria-pressed={inputMode === 'USD'}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${inputMode === 'USD' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                >
                  USD
                </button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none" aria-hidden="true">
                {inputMode === 'VES' ? (
                  <span className="text-neutral-500 font-bold">Bs</span>
                ) : (
                  <DollarSign className="w-5 h-5 text-neutral-500" />
                )}
              </div>
              <NumericFormat
                id="capital-input"
                value={amount}
                onValueChange={(values) => setAmount(values.value)}
                thousandSeparator="."
                decimalSeparator=","
                allowNegative={false}
                className="w-full bg-neutral-950 border border-neutral-800 text-white text-2xl font-mono rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all placeholder:text-neutral-700"
                placeholder="0,00"
              />
            </div>
          </div>

          {/* Comisiones (Acordeón visual simple) */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label htmlFor="bank-comm-input" className="text-[10px] font-bold tracking-wider text-neutral-400 block mb-1">COM. BANCO (%)</label>
              <NumericFormat
                id="bank-comm-input"
                value={bankCommissionPct}
                onValueChange={(values) => setBankCommissionPct(values.value)}
                decimalSeparator=","
                className="w-full bg-neutral-950 border border-neutral-800 text-white text-sm font-mono rounded-xl py-2 px-2 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all text-center"
                placeholder="2,5"
              />
            </div>
            <div>
              <label htmlFor="gateway-comm-input" className="text-[10px] font-bold tracking-wider text-neutral-400 block mb-1">PASARELA (%)</label>
              <NumericFormat
                id="gateway-comm-input"
                value={gatewayCommissionPct}
                onValueChange={(values) => setGatewayCommissionPct(values.value)}
                decimalSeparator=","
                className="w-full bg-neutral-950 border border-neutral-800 text-white text-sm font-mono rounded-xl py-2 px-2 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all text-center"
                placeholder="4,1"
              />
            </div>
          </div>
        </div>

        {/* --- PANEL DE RESULTADOS --- */}
        <div className="bg-neutral-950 p-6 border-t border-neutral-800/50 relative overflow-hidden">
          
          {/* Detalles del ciclo */}
          <div className="space-y-3 mb-6">
            <div className="flex justify-between items-center text-sm">
              <span className="text-neutral-500 flex items-center gap-2">
                <Wallet className="w-4 h-4" /> Inversión Total
              </span>
              <div className="text-right">
                <AnimatedNumber value={results.totalDebitadoVES} prefix="Bs " className="text-white font-mono block leading-tight" />
                <span className="text-[10px] text-neutral-500 font-mono">~ {results.usdComprados.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD $</span>
              </div>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-neutral-500 flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4" /> Recuperado (P2P)
              </span>
              <div className="text-right">
                <AnimatedNumber value={results.vesRetorno} prefix="Bs " className="text-white font-mono block leading-tight" />
                <span className="text-[10px] text-neutral-500 font-mono">~ {results.usdtRecibidos.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT $</span>
              </div>
            </div>
          </div>

          {/* Resultado Final (Ganancia y ROI) */}
          <motion.div 
            className={`rounded-2xl p-5 border ${isProfitable ? 'bg-green-500/10 border-green-500/30' : 'bg-neutral-900 border-neutral-800'} transition-colors duration-500`}
          >
            <div className="flex justify-between items-end">
              <div>
                <p className={`text-xs font-bold tracking-wider mb-1 ${isProfitable ? 'text-green-400' : 'text-neutral-500'}`}>
                  GANANCIA NETA
                </p>
                <div className="flex flex-col items-start gap-0.5">
                  <AnimatedNumber 
                    value={results.gananciaNetaVES} 
                    prefix={results.gananciaNetaVES > 0 ? '+Bs ' : 'Bs '} 
                    className={`text-3xl font-black tracking-tight leading-none ${isProfitable ? 'text-green-400' : 'text-white'}`} 
                  />
                  <span className={`text-[10px] font-mono font-bold ${isProfitable ? 'text-green-500/70' : 'text-neutral-500'}`}>
                    {results.gananciaNetaVES > 0 ? '+' : ''}
                    {numBinanceRate > 0 ? (results.gananciaNetaVES / numBinanceRate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'} USDT $
                  </span>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-xs font-bold tracking-wider text-neutral-500 mb-1">ROI</p>
                <AnimatedNumber 
                  value={results.roiPorcentaje} 
                  prefix={results.roiPorcentaje > 0 ? '+' : ''}
                  suffix="%"
                  className={`text-lg font-bold ${isProfitable ? 'text-green-400' : 'text-white'}`} 
                />
              </div>
            </div>
          </motion.div>

        </div>
      </motion.div>
      
      {/* Footer Profesional */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-8 text-center"
      >
        <p className="text-[10px] text-neutral-500 font-mono tracking-wider">
          &copy; {new Date().getFullYear()} BIKE VE. TODOS LOS DERECHOS RESERVADOS.
        </p>
        <p className="text-[10px] text-neutral-600 font-mono mt-1.5">
          DESARROLLADO POR{' '}
          <a 
            href="https://github.com/Rolando0408" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-green-500/70 hover:text-green-400 font-bold transition-colors"
          >
            @Rolando0408
          </a>
        </p>
      </motion.div>
    </main>
  );
}
