interface TriCoord {
  q: number;
  r: number;
}

// 1. Convert your orthogonal {q, r} to cubic coordinates
function orthogonalToCubic(q: number, r: number) {
  // Depending on how your orthogonal grid is laid out,
  // cubic coordinates (x, y, z) satisfy x + y + z = constant.
  // Here is the standard mapping for orthogonal-to-triangular layouts:
  const x = q;
  const z = r;
  const y = -x - z;
  return { x, y, z };
}

// 2. Convert cubic coordinates back to your orthogonal {q, r} system
function cubicToOrthogonal(x: number, y: number, z: number): TriCoord {
  return {
    q: x,
    r: z,
  };
}

// 3. Main rotation function for your orthogonal grid
function rotateOrthogonalTriangle(
  q: number,
  r: number,
  degrees: 120 | 240,
): TriCoord {
  // Step 1: Bridge to cubic space
  const { x, y, z } = orthogonalToCubic(q, r);

  let rotatedX: number, rotatedY: number, rotatedZ: number;

  if (degrees === 120) {
    // 120-degree cubic rotation permutation
    rotatedX = -z;
    rotatedY = -x;
    rotatedZ = -y;
  } else {
    // 240-degree cubic rotation permutation
    rotatedX = -y;
    rotatedY = -z;
    rotatedZ = -x;
  }

  // Step 2 & 3: Bridge back to your orthogonal {q, r} system
  return cubicToOrthogonal(rotatedX, rotatedY, rotatedZ);
}

describe("getRhombicCoordinatesByTileNo", () => {
  it("returns tile coordinates in row-major order for valid sizes", () => {
    const coord = rotateScaledTriangle(0, -3, 120);
    console.log(coord);
  });
});

function rotateOrthogonal2D(
  q: number,
  r: number,
  degrees: 120 | 240,
): TriCoord {
  // Convert degrees to radians
  const radians = (degrees * Math.PI) / 180;
  const cos = Math.cos(radians); // -0.5 for both 120° and 240°
  const sin = Math.sin(radians); // +0.866... for 120°, -0.866... for 240°

  // Standard 2D rotation formulas around origin {0, 0}
  // q' = q * cos(θ) - r * sin(θ)
  // r' = q * sin(θ) + r * cos(θ)
  const rawQ = q * cos - r * sin;
  const rawR = q * sin + r * cos;

  console.log(rawQ, rawR);

  // Round to the nearest integer grid coordinate
  return {
    q: Math.round(rawQ),
    r: Math.round(rawR),
  };
}

function rotateScaledTriangle(
  q: number,
  r: number,
  degrees: 120 | 240,
): TriCoord {
  // 1. Scale factor for orthogonal triangle grids (typically sqrt(3) / 2)
  const scale = Math.sqrt(3) / 2;

  // Convert orthogonal {q, r} into scaled continuous space
  // q stays as is (horizontal), r is scaled vertically
  const scaledQ = q;
  const scaledR = r * scale;

  // 2. Apply standard rotation matrix for 120° or 240°
  const radians = (degrees * Math.PI) / 180;
  const cos = Math.cos(radians); // -0.5
  const sin = Math.sin(radians); // +0.866 (for 120°) or -0.866 (for 240°)

  const rotatedQ = scaledQ * cos - scaledR * sin;
  const rotatedR = scaledQ * sin + scaledR * cos;

  // 3. Unscale back and round to the nearest integer grid coordinate
  const finalQ = Math.round(rotatedQ);
  const finalR = Math.round(rotatedR / scale);

  return { q: finalQ, r: finalR };
}
