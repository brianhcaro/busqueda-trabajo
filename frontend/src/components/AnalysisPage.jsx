// Página "Propuesta de Interés": qué pide el mercado, qué cubre el CV de Ali,
// brechas detectadas y recomendaciones de mejora. Se renderiza con barras CSS
// (sin librerías externas) a partir del agregado /api/analytics.

// Convierte una clave de región ('argentina', 'eeuu'...) en su bandera emoji.
function flagRegion(region) {
  const flags = { argentina: '🇦🇷', mexico: '🇲🇽', peru: '🇵🇪', colombia: '🇨🇴', chile: '🇨🇱', europa: '🇪🇺', eeuu: '🇺🇸' };
  // ↑ Mapa región -> bandera, igual que en las tabs pero en formato emoji.
  return flags[region] || '🌎';
  // ↑ Si la región no está en el mapa, devolvemos un globo como respaldo.
}

// Sub-componente simple: una tarjeta KPI (valor grande + etiqueta + subtítulo).
function Kpi({ label, value, sub }) {
  return (
    <div className="kpi">
      <div className="kpi-value">{value}</div>
      {/* ↑ El número grande, con el texto degradado que define el CSS. */}
      <div className="kpi-label">{label}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
      {/* ↑ Render condicional: el subtítulo solo aparece si viene por props. */}
    </div>
  );
}

// Página completa del análisis. Recibe `data` (analítica del backend) y `profile`.
export default function AnalysisPage({ data, profile }) {
  // ↑ Desestructuración de props: data trae KPIs/barras/recs; profile identifica al candidato.

  if (!data) return <div className="empty">No hay datos para analizar todavía. Probá actualizar la búsqueda.</div>;
  // ↑ Guardia: sin datos no hay análisis que pintar, mostramos un mensaje vacío.

  // Extraemos del payload todo lo que la página va a usar, con || [] como respaldo
  // para que .map() nunca reciba undefined.
  const total = data.total || 0;
  const avg = data.avgScore || 0;
  const missing = data.missingSkills || [];
  // ↑ Skills pedidas por el mercado y ausentes en el CV (brechas).
  const strong = data.strongSkills || [];
  const skillStats = data.skillStats || [];
  const byRegion = data.byRegion || [];
  const recs = data.recommendations || [];

  // El % más alto de demanda: sirve para escalar el ancho de todas las barras.
  const maxPct = Math.max(1, ...skillStats.map((s) => s.pct));
  // ↑ Math.max con ... (spread) recibe todos los pct; el 1 evita dividir por 0.

  const topDemand = skillStats[0];
  // ↑ El primer item del arreglo = el skill más pedido (ya viene ordenado).

  // % aproximado de cobertura del CV: ofertas totales menos las que piden skills
  // que faltan, sobre el total. Es una métrica simple, no un match por oferta.
  const coverPct = total ? Math.round(((total - missing.reduce((a, m) => a + m.jobsRequesting, 0)) / total) * 100) : 0;
  // ↑ .reduce() suma los jobsRequesting de cada brecha; sin ofertas queda 0.

  return (
    <div className="analysis">
      <div className="analysis-head">
        <h2>Propuesta de Interés</h2>
        <p>
          Análisis de las <strong>{total}</strong> vacantes QA detectadas en todas las regiones, comparadas con el CV de{' '}
          {/* ↑ {' '}: espacio "duro" en JSX para que la palabra siguiente no se pegue. */}
          <strong>{profile?.fullName || 'Ali Tovar'}</strong>.
          {/* ↑ Optional chaining: si profile es null, no explota; usa el nombre por defecto. */}
        </p>
      </div>

      {/* Fila de tarjetas KPI con los números principales del mercado. */}
      <div className="kpis">
        <Kpi value={total} label="Vacantes detectadas" sub="Todas las regiones" />
        <Kpi value={`${avg}%`} label="Match promedio" sub="con tu CV actual" />
        <Kpi value={missing.length} label="Brechas de skills" sub="pedidas y no cubiertas" />
        {topDemand && (
          // ↑ Este KPI extra solo aparece si hay al menos un skill en el ranking.
          <Kpi value={topDemand.pct + '%'} label="Skill más pedido" sub={topDemand.name} />
        )}
      </div>

      {/* Gráfico de demanda vs CV */}
      <section className="analisis-section">
        <h3>¿Qué pide el mercado vs. qué tenés en tu CV?</h3>
        <p className="analisis-note">% de vacantes que piden cada skill. Verde = ya está en tu CV · Rojo = brecha real.</p>
        <div className="bars">
          {skillStats.slice(0, 16).map((s) => (
            // ↑ Recorremos los primeros 16 skills (slice recorta el arreglo).
            <div className={`bar-row${s.has ? ' have' : ' gap'}`} key={s.name}>
              {/* ↑ La clase 'have' (verde) o 'gap' (rojo) depende de si el CV lo tiene.
                  key={s.name} da identidad única a cada fila de barras. */}
              <div className="bar-label">
                {s.name} <span className="bar-pct">({s.pct}%)</span>
              </div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${Math.round((s.pct / maxPct) * 100)}%` }} />
                {/* ↑ El ancho de la barra se inyecta inline. Escalamos contra maxPct
                    para que la más grande llegue al 100% y las demás sean proporcionales. */}
                {s.has && <span className="badge-cv">en tu CV</span>}
                {/* ↑ La etiqueta "en tu CV" se posiciona con CSS sobre la barra. */}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Brechas */}
      <section className="analisis-section">
        <h3>Lo que tenés que mejorar primero (brechas)</h3>
        {missing.length === 0 ? (
          <p className="analisis-note">¡No se detectaron brechas! Tu perfil cubre todo lo que pide el mercado relevado.</p>
          // ↑ Mensaje feliz: sin brechas, no hay chips rojos que mostrar.
        ) : (
<div className="gap-list">
            {missing.slice(0, 12).map((m) => (
              <span className="gap-chip" key={m.name} title={`Pedido en ${m.jobsRequesting} vacantes`}>
                {/* ↑ title = tooltip del navegador al pasar el mouse por encima. */}
                {m.name} · {m.pct}%
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Fortalezas */}
      <section className="analisis-section">
        <h3>Tus fortalezas según el mercado</h3>
        <div className="strengths">
          {strong.map((s) => (
            <span className="strong-chip" key={s.name}>{s.name} ({s.pct}%)</span>
            // ↑ Chips verdes con las skills que el CV ya cubre y cuánto se piden.
          ))}
        </div>
      </section>

      {/* Video por región */}
      <section className="analisis-section">
        <h3>Demanda por región</h3>
        <div className="region-bars">
          {byRegion.map((r) => (
            <div className="bar-row" key={r.region}>
              {/* ↑ key con la clave de región, que es única en el arreglo. */}
              <div className="bar-label">{flagRegion(r.region)} {r.label} · {r.count} vacantes · match {r.avgScore}%</div>
              <div className="bar-track">
                <div className="bar-fill region" style={{ width: `${Math.min(100, (r.count / Math.max(1, Math.max(...byRegion.map((x) => x.count)))) * 100)}%` }} />
                {/* ↑ Ancho = % de vacantes de esta región sobre la región con más vacantes.
                    Math.min(100, ...) garantiza que nunca supere el 100%. */}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recomendaciones */}
      <section className="analisis-section">
        <h3>Recomendaciones</h3>
        <ul className="recs">
          {recs.map((r, i) => (
            // ↑ Usamos el índice i como key: las recs no tienen id propio y no
            //   cambian de orden, así que alcanza.
            <li key={i} className={`rec rec-${(r.priority || 'baja').toLowerCase()}`}>
              {/* ↑ La clase del borde lateral depende de la prioridad (alta/media/baja). */}
              <span className="rec-prio">{r.icon} {r.priority}</span> {r.text}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}