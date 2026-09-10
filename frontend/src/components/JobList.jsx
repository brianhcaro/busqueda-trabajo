import { useState } from 'react';
// ↑ Hook useState: la paginación necesita memoria interna (en qué página estamos).

import { matchClass, daysAgo } from '../utils.js';
// ↑ Helpers: matchClass (color del % de match) y daysAgo (días desde la última vista).

const PAGE_SIZE = 10;
// ↑ Cantidad de ofertas que se muestran por página (constante fija, se corta la lista).

// Sub-componente local: el "badge" que indica si una oferta del historial sigue
// activa o ya no aparece. No se exporta porque solo lo usa JobList.
function HistoryBadge({ job }) {
  // ↑ Recibe solo el job por props para decidir qué mensaje mostrar.

  if (job.active === undefined) return null;
  // ↑ Guardia: si la oferta no tiene el campo `active`, no pintamos ningún badge.

  if (job.active) return <span className="badge badge-active">🟢 Activa ahora</span>;
  // ↑ Render condicional: oferta activa = badge verde "Activa ahora".

  // Si ya no aparece, calculamos hace cuánto se la vio por última vez.
  const d = daysAgo(job.lastSeen);
  const label = d === null ? 'Vista anteriormente' : d <= 0 ? 'Vista hoy' : `Vista hace ${d} día${d === 1 ? '' : 's'}`;
  // ↑ Ternarios anidados para armar el texto: maneja sin fecha, hoy, 1 día o varios.
  return <span className="badge badge-inactive">⚪ {label} (ya no aparece)</span>;
}

// Lista de ofertas de la región: recibe jobs, el modo de vista y el callback onOpen.
export default function JobList({ jobs, viewMode, onOpen }) {
  // ↑ Props desestructurados. onOpen viene del padre: se ejecuta al clickear una card.

  const [page, setPage] = useState(1);
  // ↑ Estado interno de paginación: empieza en la página 1. No le importa al padre.

  // Si no hay ofertas, mostramos un mensaje vacío según la vista (historial o live).
  if (!jobs.length) {
    return (
      <div className="empty">
        {viewMode === 'history'
          ? 'Todavía no hay historial guardado para esta región. Corré una búsqueda primero.'
          : 'No se encontraron ofertas para esta región.'}
        {/* ↑ Ternario dentro del JSX: el mensaje depende del modo de visualización. */}
      </div>
    );
  }

  // Total de páginas = ceil() redondea PARA ARRIBA: 23 ofertas / 10 = 3 páginas.
  const totalPages = Math.max(1, Math.ceil(jobs.length / PAGE_SIZE));
  // ↑ Math.max(1, ...) garantiza al menos 1 página aunque haya 0 ofertas.

  // Si el usuario avanzó y hubo menos resultados, corregimos la página actual.
  const safePage = Math.min(page, totalPages);

  // pageJobs = "rebanada" de la lista según la página: de (página-1)*10 a página*10.
  const pageJobs = jobs.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  // ↑ .slice() no modifica el arreglo original, devuelve una copia recortada.

  return (
    <div>
      <div className="job-list">
        {pageJobs.map((job) => (
          // ↑ .map() recorre SOLO la página actual y genera una card por oferta.
          <div className="job-card" key={job.id} onClick={() => onOpen(job.id)}>
            {/* ↑ key={job.id} identifica cada card (React reutiliza bien los nodos).
                onClick avisa al padre: "abrí el detalle de esta oferta". */}
            <div className="job-top">
              <div>
                <div className="job-title">{job.title}</div>
                <div className="job-company">{job.company} · {job.source}</div>
              </div>
              <span className={`match-pill ${matchClass(job.score)}`}>{job.score}%</span>
              {/* ↑ El color del pill sale de la clase que devuelve matchClass(score). */}
            </div>
            <div className="job-meta">
              <span>📍 {job.location || 'Remote'}</span>
              {/* ↑ || 'Remote': si la oferta no declara ubicación, muestra Remote. */}
              {job.salary && <span>💰 {job.salary}</span>}
              {/* ↑ Render condicional: solo muestra el sueldo si existe el campo. */}
            </div>
            {viewMode === 'history' && (
              <div className="job-history"><HistoryBadge job={job} /></div>
              // ↑ En vista historial, cada card suma su badge de activa/inactiva.
            )}
            {job.matched && job.matched.length > 0 && (
              <div className="job-skill-preview">
                {job.matched.slice(0, 5).map((s) => <span className="mini" key={s}>{s}</span>)}
                {/* ↑ Muestra hasta 5 skills matcheados como chips, cada uno con su key. */}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* La paginación solo se muestra si hay más de una página. */}
      {totalPages > 1 && (
        <div className="pagination">
          <button className="btn small secondary" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>
            ← Anterior
          </button>
          {/* ↑ disabled en la primer página: el botón no hace nada y se ve apagado. */}
          <span className="pagination-info">
            Página {safePage} de {totalPages} · {jobs.length} ofertas
          </span>
          <button className="btn small secondary" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}>
            Siguiente →
          </button>
          {/* ↑ setPage cambia el estado y React re-renderiza con la página nueva. */}
        </div>
      )}
    </div>
  );
}