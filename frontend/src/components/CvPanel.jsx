// Componente de presentación: muestra el CV de Ali en el panel lateral.
// Recibe el perfil por props (lo manda App) y lo "pinta" sin guardar estado propio.
export default function CvPanel({ profile }) {
  // ↑ Desestructuración de props: sacamos `profile` directamente en la firma,
  //   como si fuera un parámetro normal de la función.

  if (!profile) return null;
  // ↑ Guardia temprana: si el perfil todavía no cargó (null), no renderizamos nada.
  //   Es un "render condicional" simple para no explotar accediendo a null.

  const skills = Object.entries(profile.skills || {});
  // ↑ Object.entries convierte el objeto de skills en un arreglo de pares
  //   [nombre, peso], que es mucho más fácil de recorrer con .map().

  return (
    <aside className="cv-panel panel">
      {/* ↑ <aside> es el contenedor semántico del panel lateral. Lleva las clases
          cv-panel (para el layout) y panel (para el estilo común). */}

      <div className="cv-header">
        <div className="avatar">AT</div>
        {/* ↑ Avatar fijo con las iniciales del candidato. El círculo lo dibuja el CSS. */}
        <div>
          <h2 id="cv-name">{profile.fullName}</h2>
          <p className="cv-role">{profile.headline || profile.title}</p>
          {/* ↑ Operador || : si no hay headline, usamos el title como respaldo. */}
          <p className="cv-loc">📍 {profile.location || ''}</p>
        </div>
      </div>

      <div className="cv-section">
        <h3>Sobre mí</h3>
        <p className="cv-summary">{profile.summary || ''}</p>
        {/* ↑ Al estar entre llaves, el valor de JS se inyecta en el texto del JSX. */}
      </div>

      <div className="cv-section">
        <h3>Skills clave (peso)</h3>
        <div className="skill-tags">
          {skills.map(([k, v]) => (
            // ↑ .map() recorre cada [skill, peso] y genera un <span> por elemento.
            //   La desestructuración [k, v] en el callback separa nombre y peso.
            <span className="tag" key={k}>{k} ({(v * 100) | 0}%)</span>
            // ↑ key={k} le da a React una identidad única a cada skill.
            //   (v * 100) | 0 convierte el peso (0.9) a porcentaje entero (90%).
          ))}
        </div>
      </div>

      <div className="cv-section">
        <h3>Enlaces</h3>
        <div className="links">
          <a href={profile.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
          {/* ↑ target="_blank" abre en pestaña nueva; rel="noopener noreferrer"
              evita que la pestaña nueva pueda manipular la anterior (seguridad). */}
          <a href={profile.github} target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href="https://avtovar.github.io/Curriculum-Vitae/Ali_Tovar_CV.pdf" target="_blank" rel="noopener noreferrer">Ver CV PDF</a>
        </div>
      </div>
    </aside>
  );
}