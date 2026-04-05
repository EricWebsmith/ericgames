import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'en',    label: 'English'  },
  { code: 'zh',    label: '简体中文' },
  { code: 'zh-TW', label: '繁體中文' },
] as const;

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <select
      className="lang-switcher"
      value={i18n.language}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
      aria-label="Select language"
    >
      {LANGUAGES.map(({ code, label }) => (
        <option key={code} value={code}>{label}</option>
      ))}
    </select>
  );
}
