export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800">
            Calculadora de Arbitraje
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Calcula el rendimiento neto de tus operaciones
          </p>
        </div>

        {/* Aquí irán los componentes de entrada (Inputs) */}
        <div className="space-y-4">
          <div className="p-4 bg-gray-100 rounded-lg text-center text-gray-500">
            [ Formulario de Entradas en construcción ]
          </div>
        </div>

        {/* Aquí irán los resultados */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="p-4 bg-gray-900 text-white rounded-xl text-center">
            [ Panel de Resultados en construcción ]
          </div>
        </div>
      </div>
    </main>
  );
}
