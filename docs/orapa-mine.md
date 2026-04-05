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

---

## Chinese Rulebook (中文规则书)

### 世界最大的钻石矿山

Orapa Mine 发来了寻找宝石位置的委托。向地底深处发射超音波，通过其反射出的位置，便可得知宝石的位置与状态。作为多次成功定位宝石的专门家的我们，这次也必然能成功。

### 组件

矿山板6张，宝石套装6套，解题纸  
每套宝石含8枚，分别为2枚白色，1枚红色，1枚蓝色，1枚黄色，1枚天蓝色，1枚黑色，1枚透明。

### 游戏准备（2人）

玩家将同时担任出题者与探查者。作为探查者，玩家必须找出对方出题者所配置的宝石位置与形态，并记录在解题纸上。

准备：取走矿山板 2张、宝石套装 2套。一套版图和宝石用于出题，一套用于答题。设法遮挡矿山板。在基本版本中，宝石套装的 8块中仅使用 5块（红色 1、黄色 1、蓝色 1、白色 2块）。

配置：将碎片按意愿配置在矿山板上。规则如下：
1. 所有碎片，除了黑色的，正反两面均可嵌入凹槽。
2. 碎片边缘的线之间不可相互接触。碎片的顶点与线、顶点与顶点可以接触。
3. 从底板边缘观察时，不可让某一碎片被其他碎片围住而导致完全不可见。

宝石探查准备：准备解题纸 1张与笔等。所有准备完毕。定好起始玩家，轮流进行提问与回答，进行游戏。最先猜对对方矿山板上所有宝石位置与配置状态的玩家获得胜利。

### 进行游戏

在自己回合中，作为探查者发射一次超音波（进行提问）。对方查看自身的矿山板，告知超音波的结果值。

解题纸上有 10 x 8 的格子。选择格子边缘的数字 (1~18) 或字母 (A~R) 之一发射超音波。超音波从发射位置直线飞出后，在各矿物上呈直角、水平或垂直反弹，最后弹出矿山之外。

受到提问的对方必须回答：  
**(A)** 从边缘的哪个位置弹出。  
**(B)** 以什么颜色弹出。  

提问玩家听取回答后，以自身的解题纸为准，用自己的方式进行记录在纸上，并用另一条宝石碎片比划，辅助推理。

**另一种方式的提问：** 探查者在探查进行中，可以使用自身的回合询问"哪里有什么"。例如，可以询问"E4 格里有什么？"，对此的回答可以是"无物（什么都没有）"、"有白色宝石"等。

### 宝石的颜色

我们把探测仪器升级到了2.0版，仪器会解析是否包含红，黄，蓝，白这4种颜色。由于天蓝色宝石本质上由蓝色与白色构成，当超音波路径包含天蓝色宝石时，仪器会解析并同时显示白色与蓝色。

### 游戏终止

最先猜对所有宝石位置与配置状态的玩家获得胜利。

玩家在游戏中可以使用自身的回合，向出题者提出包含正答（正确答案）的解题纸。对方检讨（检查）该纸，若与现在自身矿山板碎片的配置完全同一，则该玩家胜利。若错误，则该玩家败北，游戏即时终止。后手开始的玩家提出答案且为正确时，游戏即时终止并由其获胜。先手玩家提出答案且正确时，需给予后手玩家最后一次提出答案的机会。此时，若后手为误答，则先手胜利；若为正答，则为平局。

### 3人以上时的游戏

定一名出题者。出题者在矿山配置宝石后，不参与宝石发现的竞争。仅承担向探查者告知超音波结果值的角色。除出题者外的玩家全部仅承担探查者角色。定好顺序进行提问与回答，并进行探查。所有人共享出题者的回答。最先猜对出题者矿山板上所有宝石位置与配置状态的玩家胜利。探查者有两次用自身回合提出答案的机会。若2次推测全部错误，则败北并从游戏中排除。若所有人2回推测全部错误，则所有人探查失败。  
提出答案的回数可根据玩家们的熟练度进行调整。

### 天蓝宝石扩展

天蓝宝石会反射出白色和蓝色的光，如果光线同时和其他宝石的光线混合，也会带上其他颜色的光。

### 钻石扩展

若对宝石探查达到一定程度熟练，可以进行稍微更难的"钻石扩展"。除基本 5个碎片外，在矿山中追加配置透明色宝石碎片。透明色宝石与其他寻常宝石一样反射超音波。但是，反射的超音波颜色不发生变化。若碰撞到透明色以外的其他宝石，则遵循原来的规则，依照那些其他宝石的颜色。

### 黑体扩展

若对宝石探查达到一定程度熟练，可以进行非常困难的"黑体扩展"。除 5个或 6个碎片外，可以向矿山追加配置黑色宝石碎片。将黑色宝石尖锐的部分立起来像山一样配置会很便利。黑色宝石不反射超音波。超音波被消灭，不会从任何地方弹出。出题者不回答超音波出口的编号与颜色，而是回答："消失了。"对于指定坐标进行提问的"另一种方式的提问"，其回答同样为："消失了。"黑色宝石只需将宝石存在位置的格记录在探查纸上即可。

---

*设计：Junghee Choi, Wanjin Gill*  
*美术：Wanjin Gill*  
*发行：Gameology*  
*3D建模，改编，翻译：Eric Chow / AI翻译自韩文，以此保证所用汉字一致，以英文校对。*
