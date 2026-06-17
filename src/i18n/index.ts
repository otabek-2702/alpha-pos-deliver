/* ============================================================
   makeT(label) — mirrors app/i18n.js: dict[key] → EN[key] → key,
   with {var} interpolation. useT() binds to the store's language.
   ============================================================ */
import { useAppStore } from '@/store/appStore';
import { DICTS, type Lang, type StringKey } from './strings';

export type Translator = (key: StringKey, vars?: Record<string, string | number>) => string;

export function makeT(label: Lang): Translator {
  const dict = DICTS[label] ?? DICTS.EN;
  return (key, vars) => {
    let s = dict[key] ?? DICTS.EN[key] ?? key;
    if (vars) {
      for (const k of Object.keys(vars)) {
        s = s.replace('{' + k + '}', String(vars[k]));
      }
    }
    return s;
  };
}

export function useT(): Translator {
  const lang = useAppStore((s) => s.lang);
  return makeT(lang);
}

export type { Lang, StringKey };
