// Devuelve la clase CSS que pinta el color del % de match según el score.
// Verde = match alto (>=75), amarillo = medio (>=50), rojo = bajo.
export function matchClass(score) {
  // ↑ Si el score pasa 75, la tarjeta se pinta verde (match-high).
  if (score >= 75) return 'match-high';
  // ↑ Entre 50 y 74, amarillo (match-mid).
  if (score >= 50) return 'match-mid';
  // ↑ Menos de 50, rojo (match-low).
  return 'match-low';
}

// Convierte una fecha (timestamp) en "cuántos días pasaron desde esa fecha".
// Útil para el historial: "Vista hace 3 días", "Vista hoy", etc.
export function daysAgo(ts) {
  if (!ts) return null;
  // Resta el timestamp guardado al tiempo actual y divide por los ms de un día.
  return Math.floor((Date.now() - ts) / (24 * 60 * 60 * 1000));
}

// LinkedIn no tiene API pública de empleos (solo para partners aprobados) y
// scrapearlo viola sus términos de uso. En vez de traer resultados
// automáticos, armamos un link directo a la búsqueda ya filtrada para que
// el usuario la abra y revise con su propia cuenta.

// Mapa región -> texto de ubicación que entiende la URL de LinkedIn.
export const REGION_LOCATION = {
  argentina: 'Argentina',
  europa: 'Europe',
  eeuu: 'United States',
  mexico: 'México',
  peru: 'Perú',
  colombia: 'Colombia',
  chile: 'Chile',
};

// Arma la URL de búsqueda de LinkedIn (sin scrapear nada) con las keywords y la región.
export function linkedinSearchUrl(keywords, region) {
  const params = new URLSearchParams({ keywords, location: REGION_LOCATION[region] || '' });
  // ↑ URLSearchParams codifica los parámetros de forma segura (espacios, tildes, etc.).
  return `https://www.linkedin.com/jobs/search/?${params.toString()}`;
}

// Igual que con LinkedIn: no scrapeamos el sitio de cada consultora ni sabemos
// si tiene una sección "empleos" con una URL predecible (cada una es distinta).
// En vez de eso armamos una búsqueda de Google acotada a su dominio (site:) con
// las keywords del perfil + "empleos", así el link de cada consultora cumple la
// MISMA función que el botón de LinkedIn: abrir una búsqueda ya filtrada, sin
// necesidad de que el usuario googlee todo de nuevo.
export function consultoraSearchUrl(link, keywords) {
  let dominio = '';
  try {
    dominio = new URL(link).hostname.replace(/^www\./, '');
    // ↑ Sacamos el "www." para que el site: search sea más amplio (incluye subdominios).
  } catch {
    dominio = '';
  }
  const query = dominio
    ? `site:${dominio} (empleo OR empleos OR vacante OR "trabajá con nosotros") ${keywords}`
    : `${keywords} empleos`;
  const params = new URLSearchParams({ q: query });
  return `https://www.google.com/search?${params.toString()}`;
}

// Mapas categoría de consultora -> clase CSS que da el color del pill.
// La categoría viene del backend, la clase se resuelve con un lookup.
export const CATEGORY_CLASS = {
  'Especializada en QA': 'cat-qa',
  'Consultora IT con área QA': 'cat-it',
  'Multinacional con oficina AR': 'cat-multi',
  'Staffing / recruiting IT': 'cat-staffing',
  'Banco / Fintech / Billetera': 'cat-fintech',
  'Gobierno / Sector Público': 'cat-gov',
};