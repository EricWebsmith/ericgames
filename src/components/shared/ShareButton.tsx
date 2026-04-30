import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function ShareButton() {
  const { t } = useTranslation();
  const [linkCopied, setLinkCopied] = useState(false);

  const handleShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // Clipboard API not available – silently ignore
    }
  }, []);

  return (
    <button className="btn-reset" onClick={handleShare}>
      {linkCopied ? t('shared.linkCopied') : t('shared.shareGame')}
    </button>
  );
}
