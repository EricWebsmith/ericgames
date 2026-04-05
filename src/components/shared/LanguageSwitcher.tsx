import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const isZh = i18n.language === 'zh';

  return (
    <button
      className="lang-switcher"
      onClick={() => i18n.changeLanguage(isZh ? 'en' : 'zh')}
      aria-label={isZh ? 'Switch to English' : '切换为中文'}
    >
      {isZh ? 'EN' : '中文'}
    </button>
  );
}
