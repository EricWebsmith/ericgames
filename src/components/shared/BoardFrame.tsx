import type { ReactNode } from "react";
import BoardControls from "./BoardControls";

type BoardFrameProps = {
  children: ReactNode;
  isMaximized: boolean;
  isRotated: boolean;
  onMaximizeChange: () => void;
  onRotateChange: () => void;
  className?: string;
};

export default function BoardFrame({
  children,
  isMaximized,
  isRotated,
  onMaximizeChange,
  onRotateChange,
  className = "",
}: BoardFrameProps) {
  const frameClassName = [
    "shared-board-frame",
    isMaximized ? "shared-board-frame-fullscreen" : "",
    isRotated ? "shared-board-frame-rotated" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={frameClassName}>
      <BoardControls
        isMaximized={isMaximized}
        isRotated={isRotated}
        onMaximizeChange={onMaximizeChange}
        onRotateChange={onRotateChange}
      />
      {children}
    </div>
  );
}
