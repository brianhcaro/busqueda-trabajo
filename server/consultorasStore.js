// ============================================================================
// Tracker de contacto de consultoras: guarda qué estado tiene cada consultora
// (Sin contactar, Contactado, Respondió, Entrevista agendada, Descartada)
// junto con la fecha y las notas. Persiste todo en data/consultoras-status.json
// usando el mismo patrón de archivo JSON que history.js.
// ============================================================================

// ↑ Importa las funciones de archivos del módulo nativo de Node
import { readFile, writeFile, mkdir } from 'node:fs/promises';
// ↑ Une rutas de forma segura según el sistema operativo
import { join } from 'node:path';
// ↑ Convierte la URL de este módulo en una ruta de archivo válida
import { fileURLToPath } from 'node:url';

// ↑ Carpeta de este módulo, para construir rutas relativas desde ella
const __dirname = fileURLToPath(new URL('.', import.meta.url));
// ↑ Carpeta data/ (raíz del proyecto) donde se persistió todo antes
const DATA_DIR = join(__dirname, '..', 'data');
// ↑ Ruta del archivo JSON que guarda el estado de todas las consultoras
const DATA_FILE = join(DATA_DIR, 'consultoras-status.json');

// ↑ Estados posibles en orden lógico: de "no contacté" hasta "descartada"
export const ESTADOS = ['Sin contactar', 'Contactado', 'Respondió', 'Entrevista agendada', 'Descartada'];

// ↑ Crea la carpeta data/ si no existe (igual que en history.js)
async function ensureDir() {
  try {
    await mkdir(DATA_DIR, { recursive: true });
  } catch {
    // ya existe
  }
}

// ↑ Lee el estado persistido de todas las consultoras desde el disco
export async function loadStatus() {
  try {
    const raw = await readFile(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    // ↑ Primera vez (o archivo roto): devuelve un objeto vacío
    return {}; // { [consultoraId]: { estado, fecha, notas, updatedAt } }
  }
}

// ↑ Actualiza y guarda el estado de UNA consultora en el archivo
export async function setStatus(id, { estado, fecha, notas }) {
  // ↑ Valida que el estado enviado esté dentro de la lista permitida
  if (estado && !ESTADOS.includes(estado)) {
    throw new Error('estado inválido');
  }
  // ↑ Carga el estado actual de todas las consultoras
  const all = await loadStatus();
  // ↑ Toma lo previo de esta consultora (o un objeto vacío si no existe)
  const prev = all[id] || {};
  // ↑ Conserva lo anterior si un campo no viene; updatedAt siempre se renueva
  all[id] = {
    estado: estado ?? prev.estado ?? 'Sin contactar',
    fecha: fecha ?? prev.fecha ?? '',
    notas: notas ?? prev.notas ?? '',
    updatedAt: Date.now(),
  };
  // ↑ Garantiza la carpeta y escribe el archivo con todos los estados
  await ensureDir();
  await writeFile(DATA_FILE, JSON.stringify(all), 'utf-8');
  return all[id];
}
