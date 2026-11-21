import es from './es.json';
import en from './en.json';
const catalogs: Record<'es' | 'en', Record<string, string>> = { es, en };
export function translate(language: 'es' | 'en', key: string, params: Record<string, string | number> = {}) {
    const template = catalogs[language][key] ?? key;
    return template.replace(/\{(\w+)\}/g, (original, name: string) => Object.hasOwn(params, name) ? String(params[name]) : original);
}
