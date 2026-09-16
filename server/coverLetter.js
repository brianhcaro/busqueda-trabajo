// ============================================================================
// Generador de cartas de presentación personalizadas. A partir de una oferta
// y su región arma: el idioma (es/en), el asunto del mail, un resumen de la
// empresa y el cuerpo de la carta listo para copiar y pegar.
// ============================================================================

// ↑ Trae el perfil de Brian (nombre, título, años de experiencia, LinkedIn)
import { PROFILE } from './cvProfile.js';
// ↑ Recalcula el match de la oferta para listar los skills que coinciden
import { computeMatch } from './matcher.js';

// Genera un resumen en una línea de la empresa y sus skills requeridos
// ↑ Resumen breve: empresa, título, ubicación y top de skills que el CV cumple
export function summarize(job) {
  // ↑ Calcula el match de la oferta para conocer los skills coincidentes
  const match = computeMatch(job);
  // ↑ Toma hasta 6 skills que coinciden (los usa el cuerpo de la carta)
  const skills = (match.matched || []).slice(0, 6);
  return {
    companySummary: `${job.company} (${job.source}) busca "${job.title}" en ${job.location}.`,
    requiredSkills: skills,
    topSkill: skills[0] || 'QA Testing',
  };
}

// Detecta el idioma de la carta según la región
// ↑ Devuelve 'es' o 'en', según el idioma configurado para esa región
function langForRegion(regionKey) {
  return (PROFILE.regions[regionKey] || {}).lang || 'es';
}

// Datos de la empresa para el encabezado de la carta
// ↑ Solo renombra ciertas fuentes con su nombre de marca (para el encabezado)
const COMPANIES = {
  'remoteok': 'RemoteOK',
  'weworkremotely': 'We Work Remotely',
};

// Cuerpo de la carta en español
// ↑ Versión en español: usa el perfil y el resumen para armar el texto
function bodyEs(job, sum) {
  return `Me dirijo a ustedes para postularme a la posición de "${job.title}" en ${job.company}.

Soy QA Engineer con ${PROFILE.yearsExperience}+ años de experiencia en garantía de calidad de software, especializado en banca digital y fintech. Mi trayectoria incluye pruebas funcionales, testing web y mobile (Android/iOS), API testing (REST/GraphQL), y automatización de pruebas con Maestro Studio y JavaScript.

Entre mis fortalezas se encuentran: ${sum.requiredSkills.join(', ')}. Trabajo bajo metodologías ágiles (Scrum) con Jira, Xray y Azure DevOps, y desde 2026 integro IA generativa y agentes inteligentes (Claude Code) para potenciar la productividad del QA.

Adjunto mi CV y quedo a disposición para una entrevista donde pueda aportar mis conocimientos y pasión por la calidad. Pueden contactarme por LinkedIn: ${PROFILE.linkedin}.

Saludos cordiales,
${PROFILE.fullName}
${PROFILE.title}
${PROFILE.location}`;
}

// Cuerpo de la carta en inglés
// ↑ Misma carta pero traducida al inglés (para ofertas de otros países)
function bodyEn(job, sum) {
  return `I am writing to apply for the position of "${job.title}" at ${job.company}.

I am a QA Engineer with ${PROFILE.yearsExperience}+ years of experience in software quality assurance, specialized in digital banking and fintech. My background covers functional testing, web and mobile testing (Android/iOS), API testing (REST/GraphQL), and test automation with Maestro Studio and JavaScript.

Among my strengths are: ${sum.requiredSkills.join(', ')}. I work under agile methodologies (Scrum) using Jira, Xray and Azure DevOps, and since 2026 I have been integrating generative AI and intelligent agents (Claude Code) to boost QA productivity.

I am attaching my CV and I am available for an interview where I can contribute my knowledge and passion for quality. You can reach me via LinkedIn: ${PROFILE.linkedin}.

Best regards,
${PROFILE.fullName}
${PROFILE.title}
${PROFILE.location}`;
}

// Genera la carta completa según la región
// ↑ Función principal: arma idioma, resumen, cuerpo y asunto de la carta
export function generateCoverLetter(job, regionKey) {
  // ↑ 1) Elige el idioma según la región de la oferta
  const lang = langForRegion(regionKey);
  // ↑ 2) Arma el resumen de la empresa y los skills
  const sum = summarize(job);
  // ↑ 3) Elige el cuerpo: inglés si la región lo pide, español en caso contrario
  const body = lang === 'en' ? bodyEn(job, sum) : bodyEs(job, sum);
  // ↑ 4) Devuelve la carta completa; el asunto también cambia según el idioma
  return {
    lang,
    region: regionKey,
    subject:
      lang === 'en'
        ? `Application for ${job.title} - ${PROFILE.fullName}`
        : `Postulación a ${job.title} - ${PROFILE.fullName}`,
    body,
  };
}
