import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { defaultTileOptions, getBasicTiles, type TileOptions } from '../engine/arclight/data';
import { setup, setupWithPlacement } from '../engine/arclight/gameManager';
import { TileInBoard, type Color, type Puzzle } from '../engine/arclight/models';
import BorderCircle from './shared/BorderCircle';
import { GEM_FILL } from './shared/colors';

// ─── Layout constants ──────────────────────────────────────────────
// HEX_SIZE=42 gives center-to-center distance of 42*√3≈72.7px (pointy-top hex).
// HEX_R=38 leaves ~6px visual gap between adjacent tiles (inradius≈33px, gap=(72.7-66)/2≈3px each side).
// BD_DIST=54 places border circles ~20px beyond each tile edge (tile inradius≈33px, 54-33=21px gap).
// BD_R=13 is large enough to fit two-digit labels (10–21) while keeping adjacent circles non-overlapping.
const HEX_SIZE = 42;
const HEX_R = 38;
const BD_DIST = 40;
const BD_R = 13;
const SVG_W = 700;
const SVG_H = 600;
const OX = 350;  // SVG origin X (center of hex grid)
const OY = 300;  // SVG origin Y

// Arc radii derived from hex geometry:
// ARC_SMALL_R = R/2  (tight 120° corner arc, center at a hex vertex)
// ARC_MED_R   = dist from neighbour-centre to edge-midpoint (60° arc through adjacent hex centre)
const ARC_SMALL_R = HEX_R / 2;
const ARC_MED_R = Math.sqrt(
  (3 / 4) * HEX_R * HEX_R - (3 / 2) * HEX_R * HEX_SIZE + 3 * HEX_SIZE * HEX_SIZE,
);

// ─── Axial coordinate helpers ──────────────────────────────────────
// Tile label → (q, r):  letterIndex = 3+q+r,  numberIndex = r+3
// letters: A=0 C=1 E=2 G=3 I=4 K=5 M=6   numbers: 2=0 4=1 6=2 8=3 10=4 12=5 14=6
const LETTERS = ['A', 'C', 'E', 'G', 'I', 'K', 'M'] as const;
const NUMBERS = ['2', '4', '6', '8', '10', '12', '14'] as const;

type TileInfo = { label: string; q: number; r: number; };

// All 37 core hex tiles
const ALL_TILES: TileInfo[] = (() => {
  const tiles: TileInfo[] = [];
  for (let q = -3; q <= 3; q++) {
    for (let r = -3; r <= 3; r++) {
      const s = -q - r;
      if (Math.abs(s) > 3) continue;
      tiles.push({
        label: `${LETTERS[3 + q + r]}${NUMBERS[r + 3]}`,
        q,
        r,
      });
    }
  }
  return tiles;
})();

// Axial (q, r) → SVG pixel, centered at (OX, OY)
const toPx = (q: number, r: number) => ({
  x: OX + HEX_SIZE * Math.sqrt(3) * (q + r / 2),
  y: OY + HEX_SIZE * 1.5 * r,
});

// Direction index 0–5 → angle in degrees (SVG y-down coordinate system)
// 0=left 1=upper-left 2=upper-right 3=right 4=lower-right 5=lower-left
const DIR_DEG: Record<number, number> = {
  0: 180, 1: 240, 2: 300, 3: 0, 4: 60, 5: 120,
};

// ─── Arc-path helpers ─────────────────────────────────────────────
// Midpoint of the hex edge that faces direction d.
// In a pointy-top hex the inradius = R*cos(30°) = R*√3/2; the edge midpoint
// sits exactly at that distance from the centre, in the direction DIR_DEG[d].
const edgeMidForDir = (cx: number, cy: number, d: number): { x: number; y: number; } => {
  const angle = (Math.PI / 180) * DIR_DEG[d];
  const inradius = HEX_R * Math.sqrt(3) / 2;
  return { x: cx + inradius * Math.cos(angle), y: cy + inradius * Math.sin(angle) };
};

// Build an SVG path string for one arc inside a tile, following the same
// geometry as the Python draw_tile() function.
//   distance 1 / 5 → tight 120° corner arc (radius = HEX_R/2), CCW
//   distance 2 / 4 → medium  60° arc (radius = ARC_MED_R),     CCW
//   distance 3     → straight line through the tile centre
// Returns null when inDir > outDir (each arc is drawn only once).
const makeArcPath = (inDir: number, outDir: number, cx: number, cy: number): string | null => {
  if (inDir > outDir) return null;
  const distance = (outDir - inDir) % 6;

  if (distance === 1 || distance === 5) {
    const dir = distance === 1 ? inDir : outDir;
    const s = edgeMidForDir(cx, cy, dir);
    const e = edgeMidForDir(cx, cy, (dir + 1) % 6);
    const r = ARC_SMALL_R;
    return `M${s.x.toFixed(1)},${s.y.toFixed(1)} A${r},${r} 0 0,0 ${e.x.toFixed(1)},${e.y.toFixed(1)}`;
  }

  if (distance === 2 || distance === 4) {
    const dir = distance === 2 ? inDir : outDir;
    const s = edgeMidForDir(cx, cy, dir);
    const e = edgeMidForDir(cx, cy, (dir + 2) % 6);
    const r = ARC_MED_R;
    return `M${s.x.toFixed(1)},${s.y.toFixed(1)} A${r.toFixed(1)},${r.toFixed(1)} 0 0,0 ${e.x.toFixed(1)},${e.y.toFixed(1)}`;
  }

  if (distance === 3) {
    const s = edgeMidForDir(cx, cy, inDir);
    const e = edgeMidForDir(cx, cy, outDir);
    return `M${s.x.toFixed(1)},${s.y.toFixed(1)} L${e.x.toFixed(1)},${e.y.toFixed(1)}`;
  }

  return null;
};

// Pointy-top hexagon polygon points string (vertex at top, SVG y-down)
const hexPoints = (cx: number, cy: number, R: number): string =>
  Array.from({ length: 6 }, (_, k) => {
    const a = (Math.PI / 180) * (-90 + 60 * k);
    return `${(cx + R * Math.cos(a)).toFixed(1)},${(cy + R * Math.sin(a)).toFixed(1)}`;
  }).join(' ');

// ─── Border node data ──────────────────────────────────────────────
// `dir` is the direction FROM the tile TO the border (i.e. tile.edges[dir] = borderLabel)
type BorderInfo = { label: string; tileLabel: string; dir: number; };

const ALL_BORDERS: BorderInfo[] = [
  // Letter borders A–U  (derived from addBorderEdge(label, borderDir, tile) → tileDir=(borderDir+3)%6)
  { label: 'A', tileLabel: 'A2', dir: 2 },
  { label: 'B', tileLabel: 'C2', dir: 1 },
  { label: 'C', tileLabel: 'C2', dir: 2 },
  { label: 'D', tileLabel: 'E2', dir: 1 },
  { label: 'E', tileLabel: 'E2', dir: 2 },
  { label: 'F', tileLabel: 'G2', dir: 1 },
  { label: 'G', tileLabel: 'G2', dir: 2 },
  { label: 'H', tileLabel: 'G2', dir: 3 },
  { label: 'I', tileLabel: 'I4', dir: 2 },
  { label: 'J', tileLabel: 'I4', dir: 3 },
  { label: 'K', tileLabel: 'K6', dir: 2 },
  { label: 'L', tileLabel: 'K6', dir: 3 },
  { label: 'M', tileLabel: 'M8', dir: 2 },
  { label: 'N', tileLabel: 'M8', dir: 3 },
  { label: 'O', tileLabel: 'M8', dir: 4 },
  { label: 'P', tileLabel: 'M10', dir: 3 },
  { label: 'Q', tileLabel: 'M10', dir: 4 },
  { label: 'R', tileLabel: 'M12', dir: 3 },
  { label: 'S', tileLabel: 'M12', dir: 4 },
  { label: 'T', tileLabel: 'M14', dir: 3 },
  { label: 'U', tileLabel: 'M14', dir: 4 },
  // Number borders 1–21
  { label: '1', tileLabel: 'A2', dir: 1 },
  { label: '2', tileLabel: 'A2', dir: 0 },
  { label: '3', tileLabel: 'A4', dir: 1 },
  { label: '4', tileLabel: 'A4', dir: 0 },
  { label: '5', tileLabel: 'A6', dir: 1 },
  { label: '6', tileLabel: 'A6', dir: 0 },
  { label: '7', tileLabel: 'A8', dir: 1 },
  { label: '8', tileLabel: 'A8', dir: 0 },
  { label: '9', tileLabel: 'A8', dir: 5 },
  { label: '10', tileLabel: 'C10', dir: 0 },
  { label: '11', tileLabel: 'C10', dir: 5 },
  { label: '12', tileLabel: 'E12', dir: 0 },
  { label: '13', tileLabel: 'E12', dir: 5 },
  { label: '14', tileLabel: 'G14', dir: 0 },
  { label: '15', tileLabel: 'G14', dir: 5 },
  { label: '16', tileLabel: 'G14', dir: 4 },
  { label: '17', tileLabel: 'I14', dir: 5 },
  { label: '18', tileLabel: 'I14', dir: 4 },
  { label: '19', tileLabel: 'K14', dir: 5 },
  { label: '20', tileLabel: 'K14', dir: 4 },
  { label: '21', tileLabel: 'M14', dir: 5 },
];

// ─── Color helpers ─────────────────────────────────────────────────
const DEFAULT_GEM_COLOR = '#aaaaaa';

const getGemColor = (colors: string[]): string => {
  if (colors.length === 0) return '';
  if (colors.length === 1) return GEM_FILL[colors[0]] ?? DEFAULT_GEM_COLOR;
  const s = new Set(colors);
  if (s.has('blue') && s.has('yellow')) return '#33cc66';  // green
  if (s.has('red') && s.has('blue')) return '#cc55cc';  // purple
  if (s.has('red') && s.has('yellow')) return '#ff8833';  // orange
  return GEM_FILL[colors[0]] ?? DEFAULT_GEM_COLOR;
};

// ─── URL sharing ──────────────────────────────────────────────────
const QUERY_PARAM_TILES = 't';
const QUERY_PARAM_ROTATES = 'r';
const QUERY_PARAM_OPTIONS = 'o';

const getSearchParams = (): URLSearchParams => {
  if (typeof window === 'undefined') return new URLSearchParams();
  const params = new URLSearchParams(window.location.search);
  const hashQuery = window.location.hash.split('?')[1];
  if (hashQuery) {
    const hashParams = new URLSearchParams(hashQuery);
    hashParams.forEach((value, key) => {
      if (!params.has(key)) params.set(key, value);
    });
  }
  return params;
};

const parseTileOptions = (value: string | null): TileOptions | null => {
  if (value === null || value.length !== 2 || !/^[01]{2}$/.test(value)) return null;
  return { includeTransparent: value[0] === '1', includeBlackHole: value[1] === '1' };
};

const getInitialStateFromQuery = (): { puzzle: Puzzle; tileOptions: TileOptions; } => {
  const params = getSearchParams();
  const tileOptions = parseTileOptions(params.get(QUERY_PARAM_OPTIONS)) ?? defaultTileOptions;
  const tilesStr = params.get(QUERY_PARAM_TILES);
  const rotatesStr = params.get(QUERY_PARAM_ROTATES);

  if (
    tilesStr && tilesStr.length === ALL_TILES.length &&
    rotatesStr && rotatesStr.length === ALL_TILES.length
  ) {
    const tileById = Object.fromEntries(
      getBasicTiles({ includeTransparent: true, includeBlackHole: true }).map(t => [String(t.id), t]),
    );
    const tilesInBoard: Record<string, TileInBoard> = {};
    for (let i = 0; i < ALL_TILES.length; i++) {
      const tileChar = tilesStr[i];
      if (tileChar === '-') continue;
      const tile = tileById[tileChar];
      if (!tile) continue;
      const rotation = Number(rotatesStr[i]);
      if (!Number.isInteger(rotation) || rotation < 0 || rotation > 5) continue;
      const label = ALL_TILES[i].label;
      const tib = new TileInBoard({ tile, coordinate: label, rotate_angle: rotation });
      tib.resolve_rotate();
      tilesInBoard[label] = tib;
    }
    return { puzzle: setupWithPlacement(tilesInBoard), tileOptions };
  }

  return { puzzle: setup(tileOptions), tileOptions };
};

// ─── Component ────────────────────────────────────────────────────
export default function Arclight() {
  const { t } = useTranslation();
  const [initialState] = useState(() => getInitialStateFromQuery());
  const [tileOptions, setTileOptions] = useState<TileOptions>(initialState.tileOptions);
  const [puzzle, setPuzzle] = useState<Puzzle>(initialState.puzzle);
  const [revealedTiles, setRevealedTiles] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);
  const [clickedBorders, setClickedBorders] = useState<Set<string>>(new Set());

  // ─── URL update ───────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = getSearchParams();
    const tileMap = Object.fromEntries(puzzle.tiles.map(tb => [tb.coordinate, tb]));
    const tilesStr = ALL_TILES.map(({ label }) => {
      const tb = tileMap[label];
      return tb ? String(tb.tile.id) : '-';
    }).join('');
    const rotatesStr = ALL_TILES.map(({ label }) => {
      const tb = tileMap[label];
      return tb ? String(tb.rotate_angle) : '0';
    }).join('');
    const optionsStr = `${tileOptions.includeTransparent ? '1' : '0'}${tileOptions.includeBlackHole ? '1' : '0'}`;
    params.set(QUERY_PARAM_TILES, tilesStr);
    params.set(QUERY_PARAM_ROTATES, rotatesStr);
    params.set(QUERY_PARAM_OPTIONS, optionsStr);
    const search = params.toString();
    const querySuffix = search ? `?${search}` : '';
    const hashPath = window.location.hash.split('?')[0];
    const hasHashPathRoute = hashPath.startsWith('#/');
    const nextUrl = hasHashPathRoute
      ? `${window.location.pathname}${hashPath}${querySuffix}`
      : `${window.location.pathname}${querySuffix}${hashPath}`;
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (currentUrl === nextUrl) return;
    window.history.replaceState(null, '', nextUrl);
  }, [puzzle, tileOptions]);

  // Tile label → pixel center
  const tilePx = useMemo(
    () => Object.fromEntries(ALL_TILES.map(t => [t.label, toPx(t.q, t.r)])),
    [],
  );

  // Border label → pixel center (offset from its adjacent tile by BD_DIST in dir angle)
  const borderPx = useMemo(() => {
    const map: Record<string, { x: number; y: number; }> = {};
    for (const b of ALL_BORDERS) {
      const tp = tilePx[b.tileLabel];
      if (!tp) continue;
      const rad = (Math.PI / 180) * DIR_DEG[b.dir];
      map[b.label] = {
        x: tp.x + BD_DIST * Math.cos(rad),
        y: tp.y + BD_DIST * Math.sin(rad),
      };
    }
    return map;
  }, [tilePx]);

  // Note position: beyond the border circle, away from the grid
  const notePx = useMemo(() => {
    const map: Record<string, { x: number; y: number; }> = {};
    for (const b of ALL_BORDERS) {
      const tp = tilePx[b.tileLabel];
      if (!tp) continue;
      const bx = borderPx[b.label]?.x;
      const by = borderPx[b.label]?.y;

      if (["1", "A", "B", "C", "D", "E", "F", "G"].includes(b.label)) {
        map[b.label] = {
          x: bx,
          y: by - 20,
        };
      } else if (["H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T"].includes(b.label)) {
        map[b.label] = {
          x: bx + 25,
          y: by,
        };
      } else if (["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14"].includes(b.label)) {
        map[b.label] = {
          x: bx - 25,
          y: by,
        };
      } else {
        map[b.label] = {
          x: bx,
          y: by + 22,
        };
      }
    }
    return map;
  }, [tilePx]);

  const handleTileClick = useCallback((label: string) => {
    setRevealedTiles(prev => {
      if (prev.has(label)) return prev;
      const next = new Set(prev);
      next.add(label);
      return next;
    });
  }, []);

  const handleBorderClick = useCallback((label: string) => {
    setClickedBorders(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }, []);

  const handleClickAllBorders = useCallback(() => {
    setClickedBorders(new Set(ALL_BORDERS.map(b => b.label)));
  }, []);

  const handleNewGame = useCallback(() => {
    setPuzzle(setup(tileOptions));
    setRevealedTiles(new Set());
    setClickedBorders(new Set());
    setShowAll(false);
  }, [tileOptions]);

  const { sight_results: sightResults, light_results: lightResults } = puzzle;

  // Coordinate → TileInBoard lookup (for opacity and arc_dict)
  const tileByCoord = useMemo(
    () => Object.fromEntries(puzzle.tiles.map(t => [t.coordinate, t])),
    [puzzle.tiles],
  );

  const exitHighlights = useMemo(() => {
    const set = new Set<string>();
    for (const bl of clickedBorders) {
      const exit = lightResults[bl]?.end_label;
      if (exit) set.add(exit);
    }
    return set;
  }, [clickedBorders, lightResults]);

  return (
    <div className="game-container">
      <h2 className="game-title">{t('arclight.title')}</h2>
      <p className="status-message">
        {t('arclight.instructions')}
      </p>

      <svg
        width={SVG_W}
        height={SVG_H}
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className="game-svg arclight-svg"
        aria-label={t('arclight.boardAriaLabel')}
      >
        <defs>
          <filter id="al-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Brown background */}
        <rect width={SVG_W} height={SVG_H} fill="#2b1a0e" rx={10} />

        {/* ── Hex tiles ── */}
        {ALL_TILES.map(({ label }) => {
          const { x, y } = tilePx[label];
          const colors = sightResults[label] ?? [];
          const revealed = showAll || revealedTiles.has(label);
          const hasGem = colors.length > 0;
          const gemColor = hasGem ? getGemColor(colors) : '';
          const tileData = tileByCoord[label];

          // Fill colour: gem colour when revealed, else dark; black-hole → black,
          // transparent tile (arcs but no gem) → light grey.
          let fillColor = revealed && hasGem ? gemColor : '#3d2410';
          if (revealed && tileData && !hasGem) {
            fillColor = tileData.tile.arcs.length === 0 ? '#000000' : '#EEEEEE';
          }

          // Opacity from tile data (0-100 → 0-1); only applied when revealed.
          const fillOpacity = revealed && tileData ? tileData.tile.opacity / 100 : 1;

          const strokeColor = '#6a4420';

          // Arc stroke: use gem colour for gem tiles, otherwise white.
          const arcColor = 'rgba(255,255,255,0.85)';

          return (
            <g
              key={label}
              onClick={() => handleTileClick(label)}
              style={{ cursor: 'pointer' }}
              aria-label={t('arclight.tileAriaLabel', { label })}
            >
              <polygon
                points={hexPoints(x, y, HEX_R)}
                fill={fillColor}
                fillOpacity={fillOpacity}
                stroke={strokeColor}
                strokeWidth={1.5}
                filter={revealed && hasGem ? 'url(#al-glow)' : undefined}
              />

              {/* X cross only for revealed empty cells (no tile placed there) */}
              {revealed && !hasGem && !tileData && (
                <g stroke="#7a4a20" strokeWidth={2} strokeLinecap="round">
                  <line x1={x - 13} y1={y - 13} x2={x + 13} y2={y + 13} />
                  <line x1={x + 13} y1={y - 13} x2={x - 13} y2={y + 13} />
                </g>
              )}

              {/* Arc / line paths drawn on top of the polygon when revealed */}
              {showAll && tileData && Object.entries(tileData.arc_dict).map(([inDirStr, outDir]) => {
                const inDir = Number(inDirStr);
                const path = makeArcPath(inDir, outDir, x, y);
                if (!path) return null;
                return (
                  <path
                    key={`arc-${inDir}-${outDir}`}
                    d={path}
                    stroke={arcColor}
                    strokeWidth={3}
                    fill="none"
                    strokeLinecap="round"
                  />
                );
              })}

              {/* Tile coordinate label */}
              <text
                x={x}
                y={y + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={revealed && hasGem ? 'rgba(255,255,255,0.9)' : '#7a4a20'}
                fontSize={9}
                fontWeight="bold"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {label}
              </text>
            </g>
          );
        })}

        {/* ── Border circles ── */}
        {ALL_BORDERS.map(({ label }) => {
          const bp = borderPx[label];
          if (!bp) return null;
          const np = notePx[label];

          const isEntry = clickedBorders.has(label);
          const isExit = exitHighlights.has(label);
          const result = lightResults[label];
          const exitLbl = result?.end_label ?? '';

          const circleColors: Color[] = isEntry ? (result?.colors ?? []) : [];

          const noteColor = circleColors.length > 0 ? getGemColor(circleColors) : '#aaaacc';

          return (
            <g key={`b-${label}`}>
              <BorderCircle
                cx={bp.x}
                cy={bp.y}
                r={BD_R}
                colors={circleColors}
                isEntry={isEntry}
                isExit={isExit}
                label={label}
                onClick={() => handleBorderClick(label)}
                glowFilter="url(#al-glow)"
              />

              {/* Light result note (visible when this border was clicked as entry) */}
              {isEntry && np && (
                <text
                  x={np.x}
                  y={np.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={noteColor}
                  fontSize={9}
                  fontWeight="bold"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {exitLbl ? exitLbl : '⊘'}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'center' }}>
        <button
          className="btn-reset"
          onClick={() => setShowAll(!showAll)}
        >
          {t('arclight.showAnswer')}
        </button>
        <button className="btn-reset" onClick={handleClickAllBorders}>
          {t('arclight.clickAllBorders')}
        </button>
        <button className="btn-reset" onClick={handleNewGame}>
          {t('arclight.newGame')}
        </button>
      </div>

      <div style={{ marginTop: 8, display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'center' }}>
        <label htmlFor="al-option-transparent" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <input
            id="al-option-transparent"
            type="checkbox"
            checked={tileOptions.includeTransparent}
            onChange={e => setTileOptions(prev => ({ ...prev, includeTransparent: e.target.checked }))}
          />
          {t('arclight.includeTransparent')}
        </label>
        <label htmlFor="al-option-blackhole" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <input
            id="al-option-blackhole"
            type="checkbox"
            checked={tileOptions.includeBlackHole}
            onChange={e => setTileOptions(prev => ({ ...prev, includeBlackHole: e.target.checked }))}
          />
          {t('arclight.includeBlackHole')}
        </label>
      </div>
    </div>
  );
}
