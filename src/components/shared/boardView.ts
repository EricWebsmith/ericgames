export type BoardViewBounds = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

export function getBoardView(
  source: BoardViewBounds,
  isRotated: boolean,
): { viewBox: string; transform?: string } {
  const width = source.right - source.left;
  const height = source.bottom - source.top;

  if (!isRotated) {
    return {
      viewBox: `${source.left} ${source.top} ${width} ${height}`,
    };
  }

  return {
    viewBox: `0 0 ${height} ${width}`,
    transform: `translate(${height + source.top} ${-source.left}) rotate(90)`,
  };
}
