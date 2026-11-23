import { useEffect, useState } from "react";

export function useBoardViewControls() {
  const [isBoardMaximized, setBoardMaximized] = useState(false);
  const [isBoardRotated, setBoardRotated] = useState(false);

  useEffect(() => {
    if (!isBoardMaximized) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setBoardMaximized(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isBoardMaximized]);

  return {
    isBoardMaximized,
    setBoardMaximized,
    isBoardRotated,
    setBoardRotated,
  };
}
