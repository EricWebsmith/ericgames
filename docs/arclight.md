# Arclight

**Designer:** Junghee Choi, Wanjin Gill  
**Art:** Wanjin Gill  
**Publisher:** Gameology  
**3D Modelling, Adaptation & Translation:** Eric Chow

---

## Overview

Arclight is a deduction puzzle game played on a hexagonal grid of 37 tiles.  
One player secretly places coloured gem pieces on the board; the other probes
the hidden layout by firing light beams from the border.  
Light bends through each gem according to the arcs engraved on its surface.
By reasoning about where beams exit and what colours they carry, the prober
reconstructs the secret arrangement.

---

## Components

| Item | Quantity |
|------|----------|
| Hexagonal game board (37 cells) | 1 |
| Gem tiles (Red, Blue, Yellow, Green) | 4 pairs |
| Optional gems (Transparent, Black) | 1 each |
| Border nodes A–U / 1–21 | 42 total |
| Answer sheets | as needed |

---

## Board Layout

The board is a regular hexagon of side-length 4, giving **37 internal cells**
arranged in axial coordinates (q, r) with |q|, |r|, |q+r| ≤ 3.

**42 border nodes** ring the board:
- Letters **A–U** (21 nodes)
- Numbers **1–21** (21 nodes)

Each border node has exactly one edge pointing into the nearest internal cell.

---

## Gem Tiles

Each gem is a double-hex piece (two hexagonal cells).  
All arcs are printed with **6 directions** (0–5, clockwise from West):

| Direction | Meaning |
|-----------|---------|
| 0 | West |
| 1 | North-West |
| 2 | North-East |
| 3 | East |
| 4 | South-East |
| 5 | South-West |

Each tile carries a list of **arc pairs** `[in_dir, out_dir]`.  
Light entering from direction `in_dir` exits in direction `out_dir`
(the mapping is bidirectional).

### Gem colours

| Gem | Colours | Notes |
|-----|---------|-------|
| Red | Red | — |
| Blue | Blue | — |
| Yellow | Yellow | — |
| Green | Blue + Yellow | Blends both colours |
| Transparent | *(none)* | Light passes through unchanged |
| Black | *(none)* | Absorbs light; beam disappears |

---

## How to Play

### Setup

One player (the **setter**) secretly places gem tiles on the board.
The other player (the **prober**) must deduce the position and orientation of
every gem.

### Light Action (导光 / 導光)

The prober calls out a border node.  
The setter fires a light beam inward from that node and reports:

1. **Exit node** – which border node the beam exits from.
2. **Colour(s)** – the set of gem colours the beam passed through.

If the beam hits a **black gem** it is absorbed; the setter says *"absorbed"*
and gives neither exit node nor colour.

### Sight Action (验光 / 驗光)

The prober names an internal cell.  
The setter reports the colour of the gem (if any) at that cell, or *"empty"*.

### Winning

The first player to correctly identify the position, orientation, and colour
of every gem tile wins.

If both players are acting simultaneously (2-player mode), the first to
submit a correct full solution wins.  
In the event that the second player corrects their final guess at the same
time, the game ends in a draw.

---

## Light Traversal Rules

1. The beam starts at the called border node and travels inward.
2. At each internal cell:
   - If **no gem**: beam continues straight.
   - If a **gem with matching arc**: beam is redirected along the arc.
   - If a **gem with no matching arc**: *impossible in Arclight* — each gem has
     arcs covering all entry directions.
   - If a **black gem** (`arcs: []`): beam is absorbed, no exit is reported.
3. When the beam reaches a border node it exits, ending traversal.
4. The colours of every gem visited are combined and reported.

---

## Strategy Tips

- Start with beams along the major axes to rule out large areas.
- Correlate beams that share the same exit: they likely bent at the same gem.
- Sight Actions are powerful but limited — use them to confirm final candidates.
- Transparent gems redirect light the same as coloured gems but contribute no
  colour; their presence is revealed only by unexpected bends.

---

*Arclight — logic, light, and hidden gems.*
