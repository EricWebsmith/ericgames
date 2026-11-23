import { useTranslation } from "react-i18next";

type BoardControlsProps = {
  isMaximized: boolean;
  isRotated: boolean;
  onMaximizeChange: () => void;
  onRotateChange: () => void;
};

export default function BoardControls({
  isMaximized,
  isRotated,
  onMaximizeChange,
  onRotateChange,
}: BoardControlsProps) {
  const { t } = useTranslation();

  return (
    <div className="shared-board-controls">
      <button
        className="shared-board-rotate-button"
        type="button"
        aria-pressed={isRotated}
        aria-label={t("shared.rotateBoard")}
        title={t("shared.rotateBoard")}
        onClick={onRotateChange}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 8a8 8 0 1 1-1 5" />
          <path d="M5 3v5h5" />
        </svg>
      </button>
      <button
        className="shared-board-size-button"
        type="button"
        aria-pressed={isMaximized}
        aria-label={t(
          isMaximized ? "shared.restoreBoard" : "shared.maximizeBoard",
        )}
        title={t(
          isMaximized ? "shared.restoreBoard" : "shared.maximizeBoard",
        )}
        onClick={onMaximizeChange}
      >
        {isMaximized ? (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 9H4V7h7v7H9V9Zm6 6h5v2h-7v-7h2v5Z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 5h14v14H5V5Zm2 2v10h10V7H7Z" />
          </svg>
        )}
      </button>
    </div>
  );
}
