// ============================================================================
// PERFIL DE BRIAN CARO (QA Analyst → QA Automation): la "fuente de verdad" del buscador.
// Define los skills que domina (con su peso), los keywords de búsqueda, los
// skills del mercado para detectar brechas y las regiones con su idioma.
// El motor de matching y la analítica se apoyan en estos datos.
// ============================================================================
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

// Datos del perfil extraídos del CV (Curriculum-Vitae de brianhcaro)
// Esta es la fuente de verdad que usa el motor de matching.
const PROFILE = {
  fullName: 'Brian Caro',
  title: 'QA Analyst',
  headline:
    'Manual & Automation QA | Playwright · API Testing (REST/GraphQL) · Mobile & Web Testing | QA con IA',
  location: 'Balvanera, CABA, Argentina',
  yearsExperience: 5,
  summary:
    'QA profesional con más de 5 años de experiencia en sectores fintech y banca (Globant: Citibanamex, W. L. Gore, Mars Inc., Openbank México y YPF), especializado en pruebas funcionales, regresión y smoke, y testing de APIs (REST/GraphQL) para web y mobile bajo metodologías ágiles (Scrum). Actualmente en transición hacia QA Automation con Playwright y TypeScript, apoyado en herramientas de IA generativa (Claude, Copilot) para generar y mantener casos de prueba automatizados con mayor cobertura y menor mantenimiento.',
  email: 'brianhcaro@gmail.com',
  linkedin: 'https://www.linkedin.com/in/brianhcaro',
  github: 'https://github.com/brianhcaro',
  languages: ['Español (nativo)', 'Inglés (C2)'],
  englishLevel: 'C2',

  // Proyectos públicos del portafolio en GitHub (fuente: repos de brianhcaro, sin forks).
  // ↑ projects: ejemplos reales de testing y desarrollo para mostrar en la analítica
  projects: [
    {
      nombre: 'Curriculum-Vitae',
      descripcion:
        'Sitio personal del CV online: experiencia, skills y contacto con formulario vía EmailJS, deploy en GitHub Pages y descarga del PDF.',
      url: 'https://github.com/brianhcaro/Curriculum-Vitae',
      home: 'https://brianhcaro.github.io/Curriculum-Vitae/',
      lenguaje: 'CSS',
    },
  ],

  // Skills con pesos (0-1) para calcular el match
  // ↑ skills: tecnologías que Brian domina, con peso 0-1 según su importancia
  skills: {
    qa: 1,
    'manual testing': 1,
    'test automation': 0.8,
    automation: 0.7,
    playwright: 0.7,
    typescript: 0.6,
    javascript: 0.5,
    'web testing': 1,
    'mobile testing': 1,
    'api testing': 1,
    'functional testing': 1,
    regression: 1,
    'smoke testing': 0.9,
    'test cases': 1,
    'test plans': 0.8,
    gherkin: 0.8,
    'black box': 0.8,
    'white box': 0.7,
    rest: 0.9,
    graphql: 0.8,
    postman: 0.9,
    sql: 0.6,
    jira: 1,
    agile: 0.9,
    scrum: 0.9,
    git: 0.8,
    github: 0.8,
    'ci/cd': 0.6,
    uat: 0.7,
    fintech: 0.8,
    banking: 0.8,
    mobile: 0.9,
    android: 0.9,
    ios: 0.7,
    ai: 0.6,
    ia: 0.6,
    'generative ai': 0.6,
    llm: 0.5,
  },

  // Prioridades de búsqueda (términos para filtrar/clasificar ofertas)
  // ↑ keywords: términos con los que se filtra/clasifica cada oferta de QA
  keywords: [
    'qa',
    'quality assurance',
    'software tester',
    'test engineer',
    'qa analyst',
    'qa engineer',
    'test automation',
    'automation engineer',
    'playwright',
    'api testing',
    'manual testing',
    'mobile testing',
    'sdet',
    'test analyst',
  ],

  // Habilidades del MERCADO (lo que las ofertas suelen pedir) para detectar
  // "gaps": tecnologías requeridas por la vacante que el CV no posee.
  // Cada entrada: { name, aliases[], has: bool (si está en el CV) }
  // ↑ marketSkills: lo que pide el mercado; has=false marca las brechas del CV
  marketSkills: [
    { name: 'cypress', aliases: ['cypress'], has: false },
    { name: 'playwright', aliases: ['playwright'], has: true, weight: 0.7 },
    { name: 'selenium', aliases: ['selenium'], has: false },
    { name: 'appium', aliases: ['appium'], has: false },
    { name: 'katalon', aliases: ['katalon'], has: false },
    { name: 'docker', aliases: ['docker'], has: false },
    { name: 'kubernetes', aliases: ['kubernetes', 'k8s'], has: false },
    { name: 'ci/cd', aliases: ['ci/cd', 'cicd', 'jenkins', 'github actions', 'gitlab ci'], has: true, weight: 0.6 },
    { name: 'python', aliases: ['python'], has: false },
    { name: 'java', aliases: ['java'], has: false },
    { name: 'typescript', aliases: ['typescript', 'ts'], has: true, weight: 0.6 },
    { name: 'javascript', aliases: ['javascript', 'js'], has: true, weight: 0.5 },
    { name: 'node.js', aliases: ['node'], has: false },
    { name: 'sql', aliases: ['sql', 'mysql', 'postgres', 'sql server'], has: true, weight: 0.6 },
    { name: 'postman', aliases: ['postman'], has: true, weight: 0.9 },
    { name: 'jira', aliases: ['jira'], has: true, weight: 1 },
    { name: 'azure devops', aliases: ['azure devops', 'azure'], has: false },
    { name: 'aws', aliases: ['aws'], has: false },
    { name: 'graphql', aliases: ['graphql'], has: true, weight: 0.8 },
    { name: 'rest', aliases: ['rest'], has: true, weight: 0.9 },
    { name: 'load testing', aliases: ['load testing', 'jmeter', 'k6', 'gatling'], has: false },
    { name: 'performance testing', aliases: ['performance testing'], has: false },
    { name: 'mobile testing', aliases: ['mobile testing', 'android testing', 'ios testing'], has: true, weight: 0.9 },
    { name: 'api testing', aliases: ['api testing'], has: true, weight: 1 },
    { name: 'agile', aliases: ['agile'], has: true, weight: 0.9 },
    { name: 'scrum', aliases: ['scrum'], has: true, weight: 0.9 },
    { name: 'git', aliases: ['git'], has: true, weight: 0.8 },
    { name: 'fintech', aliases: ['fintech', 'banking', 'banca'], has: true, weight: 0.8 },
    { name: 'gherkin', aliases: ['gherkin', 'bdd', 'cucumber'], has: true, weight: 0.8 },
    { name: 'ai', aliases: ['ai', 'artificial intelligence', 'generative ai', 'llm'], has: true, weight: 0.6 },
    { name: 'html', aliases: ['html'], has: false },
    { name: 'css', aliases: ['css'], has: false },
    { name: 'react', aliases: ['react'], has: false },
    { name: 'maestro', aliases: ['maestro'], has: false },
    { name: 'testrail', aliases: ['testrail'], has: false },
    { name: 'zephyr', aliases: ['zephyr'], has: false },
    { name: 'soapui', aliases: ['soapui', 'ready api', 'readyapi'], has: false },
    { name: 'browserstack', aliases: ['browserstack'], has: false },
    { name: 'sauce labs', aliases: ['sauce labs', 'saucelabs'], has: false },
    { name: 'testng', aliases: ['testng'], has: false },
    { name: 'junit', aliases: ['junit'], has: false },
    { name: 'webdriverio', aliases: ['webdriverio', 'webdriver.io'], has: false },
    { name: 'robot framework', aliases: ['robot framework'], has: false },
    { name: 'testcafe', aliases: ['testcafe'], has: false },
  ],

  // Regiones soportadas
  // ↑ regions: cada región con label, idioma (es/en) y países relacionados
  regions: {
    argentina: {
      label: 'Argentina',
      lang: 'es',
      countries: ['Argentina', 'AR', 'Buenos Aires'],
      keywords: ['argentina', 'buenos aires', 'caba', 'capital federal'],
    },
    europa: {
      label: 'Europa',
      lang: 'en',
      countries: ['Spain', 'España', 'Germany', 'Alemania', 'France', 'Netherlands', 'Netherlands', 'United Kingdom', 'Ireland', 'Portugal'],
    },
    eeuu: {
      label: 'Estados Unidos',
      lang: 'en',
      countries: ['United States', 'USA', 'EEUU', 'EE.UU', 'Remote - US'],
    },
    mexico: {
      label: 'México',
      lang: 'es',
      countries: ['Mexico', 'México', 'CDMX', 'Ciudad de México', 'Querétaro', 'Guadalajara'],
    },
    peru: {
      label: 'Perú',
      lang: 'es',
      countries: ['Peru', 'Perú', 'Lima'],
    },
    colombia: {
      label: 'Colombia',
      lang: 'es',
      countries: ['Colombia', 'Bogotá', 'Barranquilla', 'Medellín'],
    },
    chile: {
      label: 'Chile',
      lang: 'es',
      countries: ['Chile', 'Santiago', 'Las Condes'],
    },
  },
};

// Lee el PDF del CV opcionalmente desde el repo (no se parsea el PDF a fondo,
// solo se usa como referencia; el perfil estructurado es la fuente principal).
export async function loadCvPath() {
  const candidates = [
    'F:\\Curriculum-Vitae\\CV Brian Caro 2026.pdf',
    'F:/Curriculum-Vitae/CV Brian Caro 2026.pdf',
  ];
  for (const c of candidates) {
    try {
      await readFile(c);
      return c;
    } catch {
      // intenta el siguiente
    }
  }
  return null;
}

export { PROFILE };