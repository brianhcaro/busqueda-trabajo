import { useState } from 'react';
// ↑ useState para el filtro por categoría del directorio de consultoras.

import { CATEGORY_CLASS } from '../utils.js';
// ↑ Mapa categoría -> clase CSS (color del pill de cada consultora).

import { saveConsultoraStatus } from '../api.js';
// ↑ Función de la capa API que persiste estado/notas de contacto en el backend.

// Devuelve el dominio (host) de una URL, o '' si no tiene link.
// Ej: dominioDe("https://x.com/site") -> "x.com"
function dominioDe(link) {
  if (!link) return '';
  try {
    return new URL(link).hostname;
    // ↑ new URL() parsea el link; .hostname extrae solo el dominio.
  } catch {
    return '';
    // ↑ Si el link no es válido, tiramos excepción -> devolvemos cadena vacía.
  }
}

// Muestra el favicon de la consultora vía el servicio de Google (que resuelve
// el logo/favicon del dominio). Si no tiene link/dominio, cae a un placeholder
// circular con la inicial del nombre.
function ConsultoraLogo({ link, name }) {
  const dominio = dominioDe(link);
  return (
    <span className="consultora-logo">
      {dominio ? (
        // ↑ Render condicional: si hay dominio, usamos el favicon de Google...
        <img
          src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(dominio)}&sz=64`}
          // ↑ Template literal armando la URL del servicio de favicons de Google.
          alt={`Logo de ${name}`}
          loading="lazy"
          // ↑ loading="lazy": el navegador solo carga la imagen si se hace visible.
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
          // ↑ Si el favicon no carga, lo ocultamos silenciosamente (manejo de error).
        />
      ) : (
        <span className="consultora-logo-init">{name.charAt(0).toUpperCase()}</span>
        // ↑ ...y si no, mostramos la inicial en mayúscula como placeholder.
      )}
    </span>
  );
}

// Directorio de consultoras QA con tracker de contacto.
// Recibe por props el listado, los estados disponibles y el callback onChange
// (que App usa para actualizar su estado local de forma "optimista").
export default function ConsultorasList({ consultoras, estados, onChange }) {
  // ↑ Desestructuración de props: consultoras, estados y la función para avisar al padre.

  const [filtroCat, setFiltroCat] = useState('Todas');
  // ↑ Estado del filtro: 'Todas' muestra todas las consultoras.

  // Guardia: sin consultoras no hay lista que mostrar.
  if (!consultoras.length) {
    return <div className="empty">No se pudo cargar el listado de consultoras. Probá recargar la página.</div>;
  }

  // Lista de categorías únicas para el <select>. Con new Set() eliminamos
  // duplicados y luego el spread (...) lo convierte de vuelta a arreglo.
  const categorias = ['Todas', ...new Set(consultoras.map((c) => c.category))];

  // Filtramos: 'Todas' devuelve todo; si no, solo las de esa categoría.
  const filtradas = filtroCat === 'Todas' ? consultoras : consultoras.filter((c) => c.category === filtroCat);
  // ↑ .filter() devuelve un arreglo NUEVO con los items que cumplen la condición.

  // Cambio de estado de contacto: avisa al padre (UI inmediata) y persiste al
  // backend con la fecha de hoy. El guardado real es asincrónico y "fire and forget".
  function handleEstadoChange(id, estado) {
    onChange(id, { estado });
    // ↑ Optimistic update: la UI cambia al instante sin esperar al server.
    saveConsultoraStatus(id, { estado, fecha: new Date().toISOString().slice(0, 10) });
    // ↑ toISOString() da la fecha con hora; .slice(0, 10) corta y deja solo YYYY-MM-DD.
  }

  // Al terminar de escribir en las notas (evento blur = salir del campo),
  // persistimos lo escrito. No guarda en cada tecla, solo al desenfocar.
  function handleNotasBlur(id, notas) {
    saveConsultoraStatus(id, { notas });
  }

  return (
    <div>
      <div className="consultoras-filter">
        <label className="filter-label" htmlFor="filtro-categoria">Filtrar por categoría:</label>
        {/* ↑ htmlFor conecta el label con el select por su id (accesibilidad). */}
        <select
          id="filtro-categoria"
          className="estado-select"
          value={filtroCat}
          onChange={(e) => setFiltroCat(e.target.value)}
          // ↑ Select controlado: su valor sale del estado y cada cambio lo actualiza.
        >
          {categorias.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
          {/* ↑ Un <option> por categoría, con key única para cada una. */}
        </select>
        <span className="pagination-info">{filtradas.length} consultoras</span>
      </div>

      <div className="job-list">
        {filtradas.map((c) => (
          // ↑ .map() genera una card por cada consultora ya filtrada.
        <div className="job-card consultora-card" key={c.id}>
          {/* ↑ key={c.id} da identidad única a cada card de consultora. */}
          <div className="job-top">
            <ConsultoraLogo link={c.link} name={c.name} />
            {/* ↑ Componente interno: logo/favicon o placeholder con la inicial. */}
            <div>
              <div className="job-title">{c.name}</div>
              <div className="job-company">{c.city || ''}</div>
            </div>
            <span className={`cat-pill ${CATEGORY_CLASS[c.category] || ''}`}>{c.category}</span>
            {/* ↑ La clase del pill se busca en el mapa CATEGORY_CLASS; si no existe, queda ''.
                El fallback || '' evita clases "undefined" en el className. */}
          </div>
          {c.note && <div className="job-meta"><span>{c.note}</span></div>}
          {/* ↑ Nota fija de la consultora (si tiene). Render condicional &&. */}
          <div className="consultora-controls" onClick={(e) => e.stopPropagation()}>
            {/* ↑ stopPropagation: evita que el click en los controles "suba" y
                propague a la card (que no abre modal en esta lista). */}
            <select
              className="estado-select"
              value={c.estado}
              onChange={(e) => handleEstadoChange(c.id, e.target.value)}
              // ↑ Select controlado: el estado de contacto viene en cada consultora.
            >
              {estados.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
            {c.link && (
              // ↑ Render condicional: el botón "Ver perfil" solo si hay link.
              <a className="btn small secondary" href={c.link} target="_blank" rel="noopener noreferrer">
                🔗 Ver perfil
              </a>
            )}
            <input
              className="notas-input"
              type="text"
              placeholder="Notas (contacto, entrevistador, etc.)"
              defaultValue={c.notas || ''}
              // ↑ defaultValue (no value): el input NO es controlado, arranca con la
              //   nota guardada y el usuario escribe libremente hasta el blur.
              onBlur={(e) => handleNotasBlur(c.id, e.target.value)}
              // ↑ onBlur (salir del campo) dispara el guardado de las notas.
            />
          </div>
        </div>
      ))}
      </div>
    </div>
  );
}