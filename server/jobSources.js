// ============================================================================
// Agregador de fuentes de empleo en vivo. Consulta varias APIs públicas que
// NO requieren autenticación, limpia cada oferta, detecta su región y elimina
// los duplicados que aparecen en más de una bolsa.
// ============================================================================
// Fuentes de ofertas ACCESIBLES y ESTABLES (APIs públicas / JSON, sin autenticación).
// Verificadas como funcionales: Remotive, Arbeitnow (Europa) y Himalayas (remote global).
// Evita bolsas que bloquean scraping (LinkedIn, Indeed, WeWorkRemotely HTML).
// ↑ Trae el perfil del candidato (sirve como referencia para clasificar ofertas)
import { PROFILE } from './cvProfile.js';

// ↑ Términos base que definen si una oferta es de QA (se reutilizan en los filtros)
export const BASE_KEYWORDS = ['qa', 'quality', 'tester', 'test', 'automation', 'sdet'];

// ↑ Cabeceras comunes del fetch: presentan la app y evitan que las APIs nos bloqueen
const HEADERS = { 'User-Agent': 'Mozilla/5.0 (job-search-app; +https://github.com/brianhcaro)' };
// ↑ Tiempo máximo de espera por API: 20 segundos, después se aborta la petición
const REQ_TIMEOUT = 20000;

// ↑ Descarga el JSON de una URL con timeout. Si la API tarda mucho, se cancela
async function getJSON(url) {
  // ↑ AbortController permite cortar el fetch cuando queramos
  const ctrl = new AbortController();
  // ↑ Pasado el timeout, abortamos la petición (fetch nativo de Node 15+)
  const timer = setTimeout(() => ctrl.abort(), REQ_TIMEOUT);
  try {
    // ↑ Hace el fetch apuntando a la API con nuestra cabecera y la señal de abort
    const res = await fetch(url, { headers: HEADERS, signal: ctrl.signal });
    // ↑ Si la API devuelve un error HTTP, lanzamos una excepción
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    // ↑ Este bloque SIEMPRE corre: limpia el timer aunque haya funcionado o fallado
    clearTimeout(timer);
  }
}

// ↑ Helper de limpieza: saca etiquetas HTML, junta espacios repetidos y recorta
function clean(str = '') {
  return String(str).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

// ↑ Normaliza una lista de tags a strings limpios y en minúsculas (saca vacíos)
function tagsOf(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map((t) => clean(String(t)).toLowerCase()).filter(Boolean);
}

// ↑ Arma el texto de salario legible usando min/max + moneda de la oferta
function firstSalary(j) {
  const lo = j.salary_min ?? j.minSalary;
  const hi = j.salary_max ?? j.maxSalary;
  if (!lo && !hi) return '';
  const cur = j.currency || 'USD';
  return `${cur} ${lo || ''}${hi ? ' - ' + hi : ''}`.trim();
}

/* ----------------------- Remotive (remote global, tech) ------------------- */
// ↑ Fuente 1: Remotive, bolsa remota de tecnología que acepta búsquedas por texto
// Antes solo buscaba "qa" y se perdían ofertas tituladas "Tester", "SDET",
// "Automation Engineer", etc. Ahora busca varios términos en paralelo y
// deduplica por id de Remotive.
const REMOTIVE_TERMS = ['qa', 'tester', 'sdet', 'automation', 'quality assurance'];

// ↑ Convierte el formato crudo de Remotive al formato interno del buscador
function mapRemotiveJob(j) {
  return {
    id: `remotive-${j.id}`,
    source: 'Remotive',
    title: clean(j.title),
    company: clean(j.company_name),
    location: clean(j.candidate_required_location) || 'Remote',
    regionGuess: guessRegionFromText(`${j.candidate_required_location} ${j.tags}`),
    applyUrl: j.url || j.application_url || '',
    description: clean(j.description),
    tags: tagsOf(j.tags),
    salary: j.salary && clean(j.salary) ? clean(j.salary) : '',
    date: j.publication_date || '',
  };
}

// ↑ Consulta Remotive con varios términos en paralelo y fusiona los resultados
async function fetchRemotive() {
  // ↑ Lanza TODAS las búsquedas a la vez; allSettled tolera que alguna falle
  const results = await Promise.allSettled(
    REMOTIVE_TERMS.map((term) => getJSON(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(term)}`))
  );
  // ↑ Set que evita ofertas repetidas entre los distintos términos buscados
  const seen = new Set();
  const jobs = [];
  for (const r of results) {
    // ↑ Se saltean las búsquedas que fallaron
    if (r.status !== 'fulfilled') continue;
    for (const j of (r.value && r.value.jobs) || []) {
      // ↑ Si el id ya apareció, se descarta (dedup local)
      if (seen.has(j.id)) continue;
      seen.add(j.id);
      // ↑ Se normaliza la oferta al formato interno
      jobs.push(mapRemotiveJob(j));
    }
  }
  return jobs;
}

/* --------------------- Arbeitnow (Europa / global dev) -------------------- */
// ↑ Fuente 2: Arbeitnow, portal de empleo dev con foco en Europa (páginas de ~100)
// La API pagina de a ~100 ofertas; traemos 2 páginas para no perder ofertas QA
// que suelen quedar diluidas entre ofertas de desarrollo.
// ↑ Trae la primera y la segunda página en paralelo
async function fetchArbeitnow() {
  const pages = await Promise.allSettled([
    getJSON('https://www.arbeitnow.com/api/job-board-api'),
    getJSON('https://www.arbeitnow.com/api/job-board-api?page=2'),
  ]);
  const jobs = [];
  for (const p of pages) {
    // ↑ Solo toma las páginas que respondieron y trajeron un array válido
    if (p.status === 'fulfilled' && Array.isArray(p.value?.data)) jobs.push(...p.value.data);
  }
  return jobs.map((j) => ({
    id: `arbeitnow-${j.slug || j.id}`,
    source: 'Arbeitnow',
    title: clean(j.title),
    company: clean(j.company_name),
    location: clean(j.location),
    regionGuess: guessRegionFromText(j.location),
    applyUrl: j.url || `https://www.arbeitnow.com/jobs/${j.slug}`,
    description: clean(j.description),
    tags: tagsOf(j.tags),
    salary: firstSalary(j),
    date: j.created_at || '',
  }));
}

/* ------------------- Himalayas (remote global, por país) ------------------- */
// ↑ Fuente 3: Himalayas, ofertas remotas globales (permite restricción por país)
// ↑ Consulta la API de Himalayas con el término "qa" (hasta 20 resultados)
async function fetchHimalayas() {
  const data = await getJSON('https://himalayas.app/jobs/api/search?q=qa&limit=20');
  // ↑ Lee la lista de ofertas que devuelve la API (o vacío si no viene)
  const jobs = (data && data.jobs) || [];
  return jobs.map((j) => ({
    id: `himalaya-${j.guid || j.slug || Math.random()}`,
    source: 'Himalayas',
    title: clean(j.title),
    company: clean(j.companyName || j.company),
    location: (j.locationRestrictions || []).join(', ') || (j.city || 'Remote'),
    regionGuess: guessRegionFromText((j.locationRestrictions || []).join(', ')),
    applyUrl: j.applicationLink || j.url || '',
    description: clean(j.description),
    tags: tagsOf(j.categories || j.tags),
    salary: firstSalary(j),
    date: j.pubDate ? new Date(j.pubDate * 1000).toISOString() : '',
  }));
}

/* --------------------------- RemoteOK (remote global) ---------------------- */
// ↑ Fuente 4: RemoteOK, feed remoto global (trae todo, hay que filtrarlo acá)
// La API no tiene parámetro de búsqueda: devuelve el feed completo y el primer
// elemento es un aviso legal (sin campo "id"), hay que filtrarlo.
// ↑ Descarga el feed completo; solo quedan los items que tienen id (no el aviso legal)
async function fetchRemoteOK() {
  const data = await getJSON('https://remoteok.com/api');
  const jobs = Array.isArray(data) ? data.filter((j) => j && j.id) : [];
  return jobs
    .filter((j) => {
      // ↑ Filtro local: solo deja ofertas cuyo título/tags mencionen palabras QA
      const text = `${j.position || ''} ${(j.tags || []).join(' ')}`.toLowerCase();
      return BASE_KEYWORDS.some((k) => text.includes(k));
    })
    .map((j) => ({
      id: `remoteok-${j.id}`,
      source: 'RemoteOK',
      title: clean(j.position),
      company: clean(j.company),
      location: clean(j.location) || 'Remote',
      regionGuess: guessRegionFromText(j.location),
      applyUrl: j.url ? `https://remoteok.com${j.url}` : (j.apply_url || ''),
      description: clean(j.description),
      tags: tagsOf(j.tags),
      salary: firstSalary(j),
      date: j.date || '',
    }));
}

/* ---------------------------- Jobicy (remote global) ------------------------ */
// ↑ Fuente 5: Jobicy, bolsa remota que ya acepta filtrar por tag "qa" en la URL
async function fetchJobicy() {
  const data = await getJSON('https://jobicy.com/api/v2/remote-jobs?count=50&tag=qa');
  // ↑ Le pasamos el tag qa en la petición; si no viene la lista, queda vacía
  const jobs = (data && data.jobs) || [];
  return jobs.map((j) => ({
    id: `jobicy-${j.id}`,
    source: 'Jobicy',
    title: clean(j.jobTitle),
    company: clean(j.companyName),
    location: clean(j.jobGeo) || 'Remote',
    regionGuess: guessRegionFromText(j.jobGeo),
    applyUrl: j.url || '',
    description: clean(j.jobExcerpt || j.jobDescription),
    tags: tagsOf(j.jobIndustry || j.jobType),
    salary: (j.annualSalaryMin || j.annualSalaryMax)
      ? `${j.salaryCurrency || 'USD'} ${j.annualSalaryMin || ''}${j.annualSalaryMax ? ' - ' + j.annualSalaryMax : ''}`.trim()
      : '',
    date: j.pubDate || '',
  }));
}

/* -------------------- Clasificación de región (mejorada) ------------------- */
// Detecta si el texto de ubicación pertenece a Argentina, Europa o EEUU.
// ↑ Adivina la región de una oferta a partir de su texto de ubicación
export function guessRegionFromText(text) {
  // ↑ Normaliza el texto a minúsculas con espacios alrededor (seguro para regex)
  const t = ` ${text || ''} `.toLowerCase();
  const arg = /\b(argentina|buenos aires|caba|ciudad autonoma de buenos aires|bs as|capital federal|mar del plata|rosario|cordoba)\b/;
  const us = /\b(usa|united states|new york|san francisco|los angeles|remote[- ]?us|us only|texas|california)\b/;
  const eu = /\b(spain|espana|madrid|barcelona|germany|berlin|france|paris|netherlands|amsterdam|uk|united kingdom|london|ireland|dublin|portugal|lisbon|remoto|remote eu)\b/;
  const mx = /\b(mexico|mexico|cdmx|ciudad de mexico|queretaro|guadalajara|monterrey|puebla)\b/;
  const pe = /\b(peru|peru|lima)\b/;
  const co = /\b(colombia|bogota|barranquilla|medellin|cali)\b/;
  const cl = /\b(chile|santiago|las condes|providencia|valparaiso|concepcion)\b/;
  // ↑ Va probando los patrones en orden y devuelve el primer país que coincida
  if (arg.test(t)) return 'argentina';
  if (us.test(t)) return 'eeuu';
  if (eu.test(t)) return 'europa';
  if (mx.test(t)) return 'mexico';
  if (pe.test(t)) return 'peru';
  if (co.test(t)) return 'colombia';
  if (cl.test(t)) return 'chile';
  // Default: remoto deslocalizado suele ser oportunidad para Argentina/global; lo dejamos eeuu (remote global)
  return 'eeuu';
}

// Clave de deduplicación: mismo título + misma empresa suele ser la misma
// oferta publicada en varias bolsas (muy común entre Remotive/RemoteOK/Jobicy).
// ↑ Genera la llave única: "título::empresa" en minúsculas, sin caracteres raros
function dedupeKey(job) {
  return `${job.title}::${job.company}`.toLowerCase().replace(/[^a-z0-9:]+/g, ' ').trim();
}

/* --------------------------- Agregador maestro --------------------------- */
// ↑ Función pública principal: consulta las 5 fuentes y devuelve la lista final
export async function fetchJobs() {
  // ↑ Dispara las 5 fuentes EN PARALELO; si una falla, las demás siguen igual
  const results = await Promise.allSettled([
    fetchRemotive(),
    fetchArbeitnow(),
    fetchHimalayas(),
    fetchRemoteOK(),
    fetchJobicy(),
  ]);
  // ↑ Set global de llaves para eliminar duplicados entre bolsas distintas
  const seen = new Set();
  const jobs = [];
  for (const r of results) {
    // ↑ Descarta fuentes que fallaron o devolvieron datos inesperados
    if (r.status !== 'fulfilled' || !Array.isArray(r.value)) continue;
    for (const job of r.value) {
      // ↑ Compara por título+empresa: si ya existe, no se agrega de nuevo
      const key = dedupeKey(job);
      if (seen.has(key)) continue;
      seen.add(key);
      jobs.push(job);
    }
  }
  return jobs;
}

// ¿Una oferta es relevante para el perfil QA? (al menos un keyword en título/tags)
export function isRelevant(job) {
  const text = `${job.title} ${job.tags.join(' ')}`.toLowerCase();
  return BASE_KEYWORDS.some((k) => text.includes(k));
}
