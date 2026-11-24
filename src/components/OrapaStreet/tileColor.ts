import type { Color } from "../../engine/orapaStreet/models";
import { GEM_FILL } from "../shared/colors";

export function getTileColor(colors: Color[]): string {
  if (colors.length === 0) return "none";
  if (colors.includes("blue") && colors.includes("white")) return "#66ccee";
  return GEM_FILL[colors[0]] ?? "#999999";
}
