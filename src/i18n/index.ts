import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import zh from './locales/zh.json';
import zhTW from './locales/zh-TW.json';

const VALID_LANGS = ['en', 'zh', 'zh-TW', 'ja', 'ko'] as const;
type Lang = typeof VALID_LANGS[number];

const detectLanguage = (): Lang => {
  const stored = localStorage.getItem('lang') as Lang | null;
  if (stored && VALID_LANGS.includes(stored)) return stored;
  const browser = navigator.language || '';
  if (browser.startsWith('zh-TW') || browser.startsWith('zh-HK')) return 'zh-TW';
  if (browser.startsWith('zh')) return 'zh';
  if (browser.startsWith('ja')) return 'ja';
  if (browser.startsWith('ko')) return 'ko';
  return 'en';
};

i18n.use(initReactI18next).init({
  resources: {
    en:      { translation: en },
    zh:      { translation: zh },
    'zh-TW': { translation: zhTW },
    ja:      { translation: ja },
    ko:      { translation: ko },
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
