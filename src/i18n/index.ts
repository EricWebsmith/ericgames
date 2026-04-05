import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import zh from './locales/zh.json';

const detectLanguage = (): string => {
  const stored = localStorage.getItem('lang');
  if (stored === 'en' || stored === 'zh') return stored;
  const browser = navigator.language || '';
  return browser.startsWith('zh') ? 'zh' : 'en';
};

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    zh: { translation: zh },
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
