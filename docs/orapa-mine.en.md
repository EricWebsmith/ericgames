# Orapa Mine

**Designer:** Junghee Choi, Wanjin Gill  
**Art:** Wanjin Gill  
**Publisher:** Gameology  
**3D Modelling, Adaptation & Translation:** Eric Chow  
*(AI-translated from Korean; verified against the English edition)*

---

## Overview

The world's largest diamond mine — **Orapa Mine** — has commissioned you to
locate hidden gems deep underground.  
Ultra-sound waves are fired into the mine from the border; by studying how they
bounce back and exit, you deduce the exact position and state of every gem.

---

## Components

| Item | Quantity |
|------|----------|
| Mine boards | 6 |
| Gem sets | 6 |
| Answer sheets | as needed |

Each gem set contains **8 gems**:

| Colour | Count |
|--------|-------|
| White | 2 |
| Red | 1 |
| Blue | 1 |
| Yellow | 1 |
| Light Blue | 1 |
| Black | 1 |
| Transparent | 1 |

---

## Board Layout

The playing surface is a **10 × 8 grid** of square cells.

**36 border positions** surround the board:

| Position | Label | Edge |
|----------|-------|------|
| Numbers 1–10 | Top edge | Above columns 1–10 |
| Numbers 11–18 | Left edge | Left of rows 1–8 |
| Letters A–J | Bottom edge | Below columns 1–10 |
| Letters K–R | Right edge | Right of rows 1–8 |

Firing from a border position sends a wave straight into the adjacent cell.

---

## Gem Pieces

Gems are physical pieces that occupy **multiple cells**.  
The four directions used on a square grid are:

| Direction | Symbol |
|-----------|--------|
| 0 | West |
| 1 | North |
| 2 | East |
| 3 | South |

Each gem carries a list of **arc pairs** `[face_in, face_out]`.  
`[[0, 1]]` means: *"a wave entering through the West face exits through the
North face"* (and vice-versa — arcs are bidirectional).

### Placement rules

1. All gems except the black one may be placed face-up **or** face-down.
2. The **edges** (sides) of two different gems must not touch each other.
   Corner-to-corner contact is allowed.
3. When viewed from the board edge, no gem may be completely hidden behind
   another gem.

### Gem colours and special behaviours

| Gem | Colour(s) Reported | Special rule |
|-----|--------------------|--------------|
| Red | Red | — |
| Blue | Blue | — |
| Yellow | Yellow | — |
| White | White | — |
| Light Blue | White + Blue | Composed of blue & white |
| Transparent | *(unchanged)* | Does not change wave colour |
| Black | — | **Absorbs** the wave entirely |

---

## Wave (Ultra-Sound) Rules

### Direction convention

Directions refer to the **face** of the cell the wave enters or exits:

- `face 0` = West face  
- `face 1` = North face  
- `face 2` = East face  
- `face 3` = South face  

When a wave is travelling East it enters the next cell through its **West face**
(face 0).

### Traversal

1. The wave enters from the chosen border position and travels straight.
2. At each cell:
   - **Empty cell** → wave continues straight.
   - **Gem cell with a matching arc** → wave is redirected: exits through the
     arc's other face and continues in that new direction.
   - **Gem cell with no matching arc** → wave is **reflected straight back**
     (180° reversal).
   - **Black gem** → wave is **absorbed**; no exit is reported.
3. The wave exits when it reaches any border position.

### Example

Arc `[[0, 1]]` on a gem:

| Wave enters from | Entry face | Arc matches? | Wave exits |
|-----------------|-----------|-------------|-----------|
| East (→ West) | 0 (West) | ✓ `[0,1]` | face 1 (North) → wave travels North |
| South (→ North) | 1 (North) | ✓ `[1,0]` | face 0 (West) → wave travels West |
| West (→ East) | 2 (East) | ✗ | reflected back → travels West |
| North (→ South) | 3 (South) | ✗ | reflected back → travels North |

---

## How to Play (2 Players)

Both players simultaneously act as **setter** and **prober** for each other's
board. Conceal your mine board from your opponent.

### Basic game

Use **5 gems** from each set: 1 Red, 1 Yellow, 1 Blue, 2 White.

### Your turn — Fire a wave

Call out one border position (number or letter).  
Your opponent consults their board and reports:

**(A)** Which border position the wave exits from.  
**(B)** What colour(s) the wave carries.

Record the result on your answer sheet.

### Alternative question

Instead of firing a wave you may ask *"What is in cell E4?"*  
Your opponent answers *"Nothing"*, *"White gem"*, etc.

### Submitting a solution

On your turn you may submit a completed answer sheet.  
Your opponent checks it against their board:

- **Correct** → you win.
- **Wrong** → you lose immediately; the game ends.

If the first player to submit is correct, the second player gets one final
chance to submit. If both are correct it is a **draw**; otherwise the first
player wins.

---

## 3+ Player Rules

One player is the **setter**; the rest are **probers**.  
All probers share the setter's answers. The first prober to submit a correct
solution wins.  
Each prober has **two submission attempts**; two wrong guesses eliminate that
prober. If all probers are eliminated, everyone loses.

*(The number of allowed submissions can be adjusted to match experience level.)*

---

## Expansions

### Light Blue Expansion

The Light Blue gem emits **both white and blue** light.  
If that light later passes through another gem, the combined colours are all
reported together.

### Diamond Expansion *(harder)*

Add the **Transparent** gem to the basic 5.  
It reflects waves normally but **does not change the reported colour**.  
If the wave also passes through other gems, their colours are still reported.

### Black Body Expansion *(very hard)*

Add the **Black** gem.  
Place it point-up like a mountain.  
The Black gem **absorbs** the wave; the setter reports *"disappeared"* for both
the exit position and the colour — even for the alternative-question variant.  
Record the black gem's cell only (no other information is available).

---

## Colour Detection

The instrument analyses for four primaries: **Red, Yellow, Blue, White**.

| Gem | Reported colours |
|-----|-----------------|
| Red | Red |
| Yellow | Yellow |
| Blue | Blue |
| White | White |
| Light Blue | Blue + White |
| Transparent | *(passes through unchanged)* |
| Black | *(absorbed — no report)* |

