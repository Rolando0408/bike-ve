# Product Requirements Document (PRD)
**Producto:** Calculadora de Arbitraje Cambiario (MVP)
**Versión:** 1.3
**Fecha de actualización:** Octubre 2026

---

## 1. Visión General del Producto
Una aplicación web tipo "drop-in" (sin registro ni fricción de entrada) que permite a los usuarios calcular de forma instantánea y matemáticamente precisa la rentabilidad neta de operaciones de arbitraje cambiario (el "rulo"). El sistema conecta la compra oficial de divisas en la banca nacional (Tasa BCV) con la venta en el mercado secundario (Binance P2P), calculando los márgenes exactos según las comisiones de intermediación bancaria, pasarelas de pago y los diferenciales de tasa.

## 2. Objetivos y Alcance (MVP)
* **Objetivo principal:** Proveer certidumbre financiera inmediata sobre el rendimiento de un ciclo de arbitraje antes de comprometer capital.
* **Métrica de éxito:** Tiempo de resolución (Time-to-Value) < 5 segundos desde que el usuario ingresa a la URL.
* **Fuera del alcance:** Creación de cuentas, historial de operaciones, proyecciones multivariables en el tiempo o gestión de impuestos complejos.

## 3. Historias de Usuario
1. **Como** usuario anónimo, **quiero** poder elegir si calcular en base a los bolívares que tengo disponibles o en base a los dólares que deseo comprar, **para** adaptar el cálculo a mi saldo bancario.
2. **Como** usuario, **quiero** que el sistema cargue automáticamente la tasa BCV y la tasa P2P (Binance), pero me permita editarlas, **para** ahorrar tiempo y simular escenarios futuros.
3. **Como** usuario, **quiero** configurar con precisión las comisiones bancarias y de las tarjetas internacionales, **para** no tener descuadres por "costos ocultos".
4. **Como** usuario, **quiero** ver mi inversión total requerida, el monto recuperado, la ganancia/pérdida neta y el ROI (%) en tiempo real, **para** tomar una decisión rápida sobre si vale la pena operar.

---

## 4. Requisitos Funcionales

### 4.1. Módulo de Entrada de Datos (Inputs y UI)
* **Moneda de Entrada (Toggle):** Selector `VES | USD`. (Por defecto: VES).
* **Monto:** Campo numérico principal.
* **Tasa BCV Oficial (VES/USD):** Autocompletado vía API. Editable.
* **Margen Cambiario Banco (%):** Input numérico (Defecto: 0,5%). *Tooltip: "Diferencial sumado a la tasa oficial del BCV por la mesa de cambio".*
* **Tasa Binance P2P (VES/USDT):** Autocompletado vía API. Editable.
* **Comisión Bancaria (%):** Input numérico. *Tooltip: "Calculado como recargo sobre el monto base (Monto / 1.xx)".*
* **Comisión Pasarela/Tarjeta (%):** Input numérico. *Tooltip: "Calculado como descuento directo del saldo a transferir (Monto - x%)".*

### 4.2. Lógica de Cálculo (Motor Reactivo)
Los cálculos se ejecutarán en tiempo real del lado del cliente. El algoritmo bifurca según la moneda de entrada:

**Ruta A: El usuario ingresa un monto en Bolívares (VES)**
1. `Capital_Neto_VES = Monto_Input / ( 1 + ( Comisión_Banco / 100 ) )` *(Se separa la comisión del capital real para comprar).*
2. `Tasa_Compra_Efectiva = Tasa_BCV * ( 1 + ( Margen_Cambiario / 100 ) )`
3. `USD_Comprados = Capital_Neto_VES / Tasa_Compra_Efectiva`
4. `Total_Debitado_VES = Monto_Input` *(Inversión total).*

**Ruta B: El usuario ingresa un monto en Dólares (USD)**
1. `USD_Comprados = Monto_Input`
2. `Tasa_Compra_Efectiva = Tasa_BCV * ( 1 + ( Margen_Cambiario / 100 ) )`
3. `Costo_Base_VES = USD_Comprados * Tasa_Compra_Efectiva`
4. `Total_Debitado_VES = Costo_Base_VES * ( 1 + ( Comisión_Banco / 100 ) )` *(Monto exacto que el usuario debe tener en su cuenta bancaria).*

**Fase Común (Liquidación):**
5. `USDT_Recibidos = USD_Comprados * ( 1 - ( Comisión_Pasarela / 100 ) )` *(Descuento directo de la pasarela, ej. GPay).*
6. `VES_Retorno = USDT_Recibidos * Tasa_Binance_P2P`
7. `Ganancia_Neta_VES = VES_Retorno - Total_Debitado_VES`
8. `ROI_Porcentaje = ( Ganancia_Neta_VES / Total_Debitado_VES ) * 100`

### 4.3. Módulo de Resultados (Outputs)
Panel destacado que actualiza sus valores instantáneamente:
* **Inversión Requerida:** `Total_Debitado_VES` (Muy importante en Ruta B para indicar saldo necesario).
* **Capital Recuperado:** `VES_Retorno`.
* **Ganancia/Pérdida Neta:** En VES (verde/rojo según el signo).
* **ROI:** Porcentaje de rendimiento del ciclo.

---

## 5. Requisitos No Funcionales y Arquitectura
* **UX/UI:** Single Page Application (SPA), Mobile-First, diseño minimalista y sin fricciones. Uso de *tooltips* para aclarar la naturaleza matemática de cada comisión.
* **Frontend:** React / Next.js con TailwindCSS para manejo de estados complejos y renders rápidos.
* **Backend (Orquestador de APIs):** Microservicio ligero (Ej. FastAPI o Node.js) que actúe como proxy para:
    1.  Obtener y cachear la tasa oficial del BCV (scraping ligero, actualización diaria).
    2.  Consultar la API pública de Binance P2P (`https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search`) para extraer el promedio competitivo de los anuncios de venta rápida de USDT a VES.

## 6. Pruebas de Escritorio (Casos de Aceptación)
* **Caso 1 (Entrada VES):** Si el usuario ingresa 10.000 VES (Com. Banco: 2,5%, Spread: 0,5%, Tasa BCV: 40, Com. GPay: 4,1%, Tasa P2P: 48), el sistema debe mostrar una inversión de 10.000 VES y una ganancia de +1.171,52 VES (ROI: 11,71%).
* **Caso 2 (Entrada USD):** Si el usuario ingresa 250 USD (Mismas tasas), el sistema debe indicarle que requiere tener en cuenta 10.301,25 VES y mostrará una ganancia neta de +1.206,75 VES.