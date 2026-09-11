// Pestañas de región: un arreglo con cada país y su bandera, para recorrerlo con .map().
// Importante: NO incluye "analisis" ni "consultoras" porque esos dos no son países:
// son secciones especiales que se agregan como botones aparte, más abajo.
const TABS = [
  { region: 'argentina', label: '🇦🇷 Argentina' },
  { region: 'mexico', label: '🇲🇽 México' },
  { region: 'peru', label: '🇵🇪 Perú' },
  { region: 'colombia', label: '🇨🇴 Colombia' },
  { region: 'chile', label: '🇨🇱 Chile' },
  { region: 'europa', label: '🇪🇺 Europa' },
  { region: 'eeuu', label: '🇺🇸 Estados Unidos' },
  // ↑ Cada item tiene la clave de región (que entiende el backend) y la etiqueta visible.
];

// Componente "tontito" (sin estado): solo recibe la región actual y la función
// que avisa al padre cuando el usuario elige otra región.
export default function RegionTabs({ current, onSelect }) {
  // ↑ Props desestructurados: current = región activa, onSelect = callback que se
  //   dispara al hacer click. Los datos "bajan" del padre, los eventos "suben".

  return (
    <div>
      {/* Fila 1: los países. Cada uno tiene su bandera y su clave de región. */}
      <div className="region-tabs">
        {TABS.map((t) => (
          // ↑ .map() convierte el arreglo TABS en una lista de botones.
          <button
            key={t.region}
            // ↑ key única para que React sepa diferenciar cada botón de la lista.
            className={`region-tab${current === t.region ? ' active' : ''}`}
            // ↑ Template literal: si esta región es la actual, le agrega la clase
            //   'active' (que la pinta con el degradado) vía CSS.
            onClick={() => onSelect(t.region)}
            // ↑ onClick llama a la función del padre pasándole la región elegida.
          >
            {t.label}
            {/* ↑ Muestra la etiqueta (bandera + nombre) guardada en TABS. */}
          </button>
        ))}
      </div>

      {/* Fila 2 (debajo de los países): secciones especiales, escritas a mano.
          Cada una vive en su propio espacio (pestaña separada). */}
      <div className="region-tabs-secondary">
        <button
          className={`region-tab analisis-tab${current === 'analisis' ? ' active' : ''}`}
          onClick={() => onSelect('analisis')}
        >
          📊 Propuesta de Interés
        </button>
        <button
          className={`region-tab consultoras-tab${current === 'consultoras' ? ' active' : ''}`}
          onClick={() => onSelect('consultoras')}
        >
          🏢 Consultoras QA
        </button>
      </div>
    </div>
  );
}