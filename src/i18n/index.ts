import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import zh from './locales/zh.json';
import zhTW from './locales/zh-TW.json';

const VALID_LANGS = ['en', 'zh', 'zh-TW'] as const;
type Lang = typeof VALID_LANGS[number];

const detectLanguage = (): Lang => {
  const stored = localStorage.getItem('lang') as Lang | null;
  if (stored && VALID_LANGS.includes(stored)) return stored;
  const browser = navigator.language || '';
  if (browser.startsWith('zh-TW') || browser.startsWith('zh-HK')) return 'zh-TW';
  if (browser.startsWith('zh')) return 'zh';
  return 'en';
};

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    zh: { translation: zh },
    'zh-TW': { translation: zhTW },
  },
  lng: detectLanguage(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('lang', lng);
});

export default i18n;
