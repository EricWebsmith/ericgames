import { Color, Orient, Tile, TriangleLine, type ParentTile, type Reflect, type TileOptions } from "./models";

const leftΔReflect: Reflect = {
  0: 10,
  10: 0,
  2: 4,
  4: 2,
  6: 8,
  8: 6,
};

const leftLineTileReflect: Reflect = {
  8: 10,
  10: 8,
};

const rightΔReflect: Reflect = {
  0: 2,
  2: 0,
  6: 4,
  4: 6,
  10: 8,
  8: 10,
};

const rightLineTileReflect: Reflect = {
  2: 4,
  4: 2,
};

function leftTile(
  parentName: string,
  colors: Color[],
  q: number,
  r: number,
): Tile {
  return new Tile({
    orient: Orient.PointyLeft,
    colors: colors,
    q,
    r,
    reflect: leftΔReflect,
    parentName,
  });
}

function leftLineTile(
  parentName: string,
  colors: Color[],
  q: number,
  r: number,
  lineTileLine?: TriangleLine,
  reflect?: Reflect,
): Tile {
  return new Tile({
    orient: Orient.PointyLeft,
    colors: colors,
    q,
    r,
    lineTileLine: lineTileLine ?? TriangleLine.Vertical,
    reflect: reflect ?? leftLineTileReflect,
    parentName,
    lineTile: true,
  });
}

function rightTile(
  parentName: string,
  colors: Color[],
  q: number,
  r: number,
): Tile {
  return new Tile({
    orient: Orient.PointyRight,
    colors: colors,
    q,
    r,
    reflect: rightΔReflect,
    parentName,
  });
}

function rightLineTile(
  parentName: string,
  colors: Color[],
  q: number,
  r: number,
  lineTileLine?: TriangleLine,
  reflect?: Reflect,
): Tile {
  return new Tile({
    orient: Orient.PointyRight,
    colors: colors,
    q,
    r,
    lineTileLine: lineTileLine ?? TriangleLine.Vertical,
    reflect: reflect ?? rightLineTileReflect,
    parentName,
    lineTile: true,
  });
}


function flipReflect(reflect: Reflect): Reflect {
  const flipped: Reflect = {};
  for (const [incoming, outgoing] of Object.entries(reflect)) {
    flipped[(12 - Number(incoming)) % 12] = (12 - outgoing) % 12;
  }
  return flipped;
}

function flipParentTile(parentTile: ParentTile): ParentTile {
  return {
    ...parentTile,
    subTiles: parentTile.subTiles.map(
      (subTile) =>
        new Tile({
          colors: subTile.colors,
          parentName: subTile.parentName,
          q: -subTile.q,
          r: subTile.r,
          reflect: flipReflect(subTile.reflect),
          orient:
            subTile.orient === Orient.PointyLeft
              ? Orient.PointyRight
              : Orient.PointyLeft,
          lineTileLine: subTile.lineTileLine,
          lineTile: subTile.lineTile,
        }),
    ),
  };
}

function changeNameColor(pTile: ParentTile, name: string, colors: Color[]): ParentTile {
  const newPT = structuredClone(pTile);
  newPT.name = name;
  for (const subTile of newPT.subTiles) {
    subTile.parentName = name;
    subTile.colors = colors;
  }
  return newPT;
}

const white3_0: ParentTile = {
  name: "white3",
  subTiles: [
    leftTile("white3", [Color.White], 0, 0),
    rightTile("white3", [Color.White], 0, 1),
    leftTile("white3", [Color.White], 0, 2),
    rightTile("white3", [Color.White], 1, 0),
    leftTile("white3", [Color.White], 1, 1),
    rightTile("white3", [Color.White], 1, 2),
  ],
};



const blue1_0: ParentTile = {
  name: "blue1",
  subTiles: [
    rightTile("blue1", [Color.Blue], 0, 0),
    leftTile("blue1", [Color.Blue], 0, 1),
    rightTile("blue1", [Color.Blue], 0, 2),

    rightTile("blue1", [Color.Blue], 1, 1),
  ],
};

const blue1_1 = flipParentTile(blue1_0);
const blue1Variants = [blue1_0, blue1_1];


// #region blue 3

const blue3_0: ParentTile = {
  name: "blue3",
  subTiles: [
    rightTile("blue3", [Color.Blue], 0, 0),
    leftTile("blue3", [Color.Blue], 0, 1),

    leftTile("blue3", [Color.Blue], 1, 0),
    rightTile("blue3", [Color.Blue], 1, 1),
    leftTile("blue3", [Color.Blue], 1, 2),
    rightTile("blue3", [Color.Blue], 1, 3),
  ],
};

const blue3_1: ParentTile = {
  name: "blue3",
  subTiles: [
    leftTile("blue3", [Color.Blue], 0, 0),
    rightTile("blue3", [Color.Blue], 0, 1),
    leftTile("blue3", [Color.Blue], 0, 2),
    rightTile("blue3", [Color.Blue], 0, 3),

    leftTile("blue3", [Color.Blue], -1, 3),

    rightTile("blue3", [Color.Blue], 1, 2),
  ],
};

const blue3_2: ParentTile = {
  name: "blue3",
  subTiles: [
    rightTile("blue3", [Color.Blue], 0, 0),
    leftTile("blue3", [Color.Blue], 0, 1),

    leftTile("blue3", [Color.Blue], 1, 0),
    rightTile("blue3", [Color.Blue], 1, 1),
    leftTile("blue3", [Color.Blue], 1, 2),

    rightTile("blue3", [Color.Blue], 2, 0),
  ],
};

const blue3_3: ParentTile = {
  name: "blue3",
  subTiles: [
    leftTile("blue3", [Color.Blue], 0, 0),
    rightTile("blue3", [Color.Blue], 0, 1),
    leftTile("blue3", [Color.Blue], 0, 2),
    rightTile("blue3", [Color.Blue], 0, 3),

    rightTile("blue3", [Color.Blue], 1, 2),
    leftTile("blue3", [Color.Blue], 1, 3),
  ],
};

const blue3_4: ParentTile = {
  name: "blue3",
  subTiles: [
    leftTile("blue3", [Color.Blue], 0, 0),

    leftTile("blue3", [Color.Blue], 1, -1),
    rightTile("blue3", [Color.Blue], 1, 0),
    leftTile("blue3", [Color.Blue], 1, 1),
    rightTile("blue3", [Color.Blue], 1, 2),

    rightTile("blue3", [Color.Blue], 2, -1),
  ],
};

const blue3_5: ParentTile = {
  name: "blue3",
  subTiles: [
    leftTile("blue3", [Color.Blue], 0, 0),

    rightTile("blue3", [Color.Blue], 1, -2),
    leftTile("blue3", [Color.Blue], 1, -1),
    rightTile("blue3", [Color.Blue], 1, 0),

    rightTile("blue3", [Color.Blue], 2, -1),
    leftTile("blue3", [Color.Blue], 2, 0),
  ],
};

const blue3_6: ParentTile = {
  name: "blue3",
  subTiles: [
    rightTile("blue3", [Color.Blue], 0, 0),
    leftTile("blue3", [Color.Blue], 0, 1),
    rightTile("blue3", [Color.Blue], 0, 2),
    leftTile("blue3", [Color.Blue], 0, 3),

    leftTile("blue3", [Color.Blue], 1, 0),
    rightTile("blue3", [Color.Blue], 1, 1),
  ],
};

const blue3_7: ParentTile = {
  name: "blue3",
  subTiles: [
    leftTile("blue3", [Color.Blue], 0, 0),
    rightTile("blue3", [Color.Blue], 0, 1),

    leftTile("blue3", [Color.Blue], 1, -1),
    rightTile("blue3", [Color.Blue], 1, 0),
    leftTile("blue3", [Color.Blue], 1, 1),

    rightTile("blue3", [Color.Blue], 2, 1),
  ],
};

const blue3_8: ParentTile = {
  name: "blue3",
  subTiles: [
    leftTile("blue3", [Color.Blue], 0, 0),

    rightTile("blue3", [Color.Blue], 1, 0),
    leftTile("blue3", [Color.Blue], 1, 1),
    rightTile("blue3", [Color.Blue], 1, 2),
    leftTile("blue3", [Color.Blue], 1, 3),

    rightTile("blue3", [Color.Blue], 2, 1),
  ],
};

const blue3_9: ParentTile = {
  name: "blue3",
  subTiles: [
    leftTile("blue3", [Color.Blue], 0, 0),
    rightTile("blue3", [Color.Blue], 0, 1),

    rightTile("blue3", [Color.Blue], 1, -2),
    leftTile("blue3", [Color.Blue], 1, -1),
    rightTile("blue3", [Color.Blue], 1, 0),
    leftTile("blue3", [Color.Blue], 1, 1),
  ],
};

const blue3_10: ParentTile = {
  name: "blue3",
  subTiles: [
    leftTile("blue3", [Color.Blue], 0, 0),

    rightTile("blue3", [Color.Blue], 1, 0),
    leftTile("blue3", [Color.Blue], 1, 1),
    rightTile("blue3", [Color.Blue], 1, 2),

    leftTile("blue3", [Color.Blue], 2, 0),
    rightTile("blue3", [Color.Blue], 2, 1),
  ],
};

const blue3_11: ParentTile = {
  name: "blue3",
  subTiles: [
    leftTile("blue3", [Color.Blue], 0, 0),

    rightTile("blue3", [Color.Blue], 1, -2),
    leftTile("blue3", [Color.Blue], 1, -1),
    rightTile("blue3", [Color.Blue], 1, 0),
    leftTile("blue3", [Color.Blue], 1, 1),

    rightTile("blue3", [Color.Blue], 2, 1),
  ],
};

const blue3Variants = [
  blue3_0,
  blue3_1,
  blue3_2,
  blue3_3,
  blue3_4,
  blue3_5,
  blue3_6,
  blue3_7,
  blue3_8,
  blue3_9,
  blue3_10,
  blue3_11,
];

// #endregion

// #region red 1

const red1_0: ParentTile = {
  name: "red1",
  subTiles: [
    leftTile("red1", [Color.Red], 0, 0),
    rightTile("red1", [Color.Red], 0, 1),
    leftTile("red1", [Color.Red], 0, 2),
    leftLineTile("red1", [Color.Red], 0, 4),
    rightLineTile("red1", [Color.Red], 1, 4),
  ],
};

const red1_1: ParentTile = {
  name: "red1",
  subTiles: [
    rightTile("red1", [Color.Red], 0, 0),
    leftTile("red1", [Color.Red], -1, 0),
    rightTile("red1", [Color.Red], -1, 1),

    rightLineTile("red1", [Color.Red], -2, 2, TriangleLine.Bottom, { 0: 10, 10: 0 }),
    leftLineTile("red1", [Color.Red], -2, 3, TriangleLine.Top, { 6: 4, 4: 6 }),
  ],
};


const red1_2: ParentTile = {
  name: "red1",
  subTiles: [

    leftTile("red1", [Color.Red], 0, 0),
    rightTile("red1", [Color.Red], 0, -1),
    leftTile("red1", [Color.Red], -1, -1),

    leftLineTile("red1", [Color.Red], -2, -2, TriangleLine.Bottom, { 0: 2, 2: 0 }),
    rightLineTile("red1", [Color.Red], -2, -1, TriangleLine.Top, { 6: 8, 8: 6 }),
  ],
};


const red1_3: ParentTile = {
  name: "red1",
  subTiles: [

    rightTile("red1", [Color.Red], 0, 0),
    leftTile("red1", [Color.Red], 0, -1),
    rightTile("red1", [Color.Red], 0, -2),

    leftLineTile("red1", [Color.Red], -1, -4),
    rightLineTile("red1", [Color.Red], 0, -4),
  ],
};


const red1_4: ParentTile = {
  name: "red1",
  subTiles: [
    leftTile("red1", [Color.Red], 0, 0),
    rightTile("red1", [Color.Red], 1, 0),
    leftTile("red1", [Color.Red], 1, -1),

    rightLineTile("red1", [Color.Red], 2, -3, TriangleLine.Bottom, { 10: 0, 0: 10 }),
    leftLineTile("red1", [Color.Red], 2, -2, TriangleLine.Top, { 6: 4, 4: 6 }),
  ],
};


const red1_5: ParentTile = {
  name: "red1",
  subTiles: [
    rightTile("red1", [Color.Red], 0, 0),
    leftTile("red1", [Color.Red], 0, 1),
    rightTile("red1", [Color.Red], 1, 1),

    leftLineTile("red1", [Color.Red], 2, 1, TriangleLine.Bottom, { 2: 0, 0: 2 }),
    rightLineTile("red1", [Color.Red], 2, 2, TriangleLine.Top, { 8: 6, 6: 8 }),
  ],
};


const red1_6 = flipParentTile(red1_0);
const red1_7 = flipParentTile(red1_1);
const red1_8 = flipParentTile(red1_2);
const red1_9 = flipParentTile(red1_3);
const red1_10 = flipParentTile(red1_4);
const red1_11 = flipParentTile(red1_5);

const red1Variants = [
  red1_0,
  red1_1,
  red1_2,
  red1_3,
  red1_4,
  red1_5,
  red1_6,
  red1_7,
  red1_8,
  red1_9,
  red1_10,
  red1_11,
];

// #endregion

// #region red2

const red2_0: ParentTile = {
  name: "red2",
  subTiles: [
    leftTile("red2", [Color.Red], 0, 0),
    rightTile("red2", [Color.Red], 0, 1),
    leftTile("red2", [Color.Red], 0, 2),
    leftLineTile("red2", [Color.Red], 0, 4),
    rightTile("red2", [Color.Red], 1, 0),
    leftTile("red2", [Color.Red], 1, 1),
    rightTile("red2", [Color.Red], 1, 2),
    rightLineTile("red2", [Color.Red], 1, 4),
  ],
};


const red2_1: ParentTile = {
  name: "red2",
  subTiles: [
    leftTile("red2", [Color.Red], 0, 0),
    rightTile("red2", [Color.Red], 0, 1),
    leftTile("red2", [Color.Red], 0, 2),
    rightTile("red2", [Color.Red], 1, 0),
    leftTile("red2", [Color.Red], 1, 1),
    rightTile("red2", [Color.Red], 1, 2),

    leftLineTile("red2", [Color.Red], 2, 2, TriangleLine.Bottom, { 0: 2, 2: 0 }),
    rightLineTile("red2", [Color.Red], 2, 3, TriangleLine.Top, { 6: 8, 8: 6 }),
  ],
};



const red2_2: ParentTile = {
  name: "red2",
  subTiles: [
    leftTile("red2", [Color.Red], 0, 0),
    rightTile("red2", [Color.Red], 0, 1),
    leftTile("red2", [Color.Red], 0, 2),
    rightTile("red2", [Color.Red], 1, 0),
    leftTile("red2", [Color.Red], 1, 1),
    rightTile("red2", [Color.Red], 1, 2),

    rightLineTile("red2", [Color.Red], 2, -1, TriangleLine.Bottom, { 0: 10, 10: 0 }),
    leftLineTile("red2", [Color.Red], 2, 0, TriangleLine.Top, { 6: 4, 4: 6 }),
  ],
};


const red2_3: ParentTile = {
  name: "red2",
  subTiles: [
    leftTile("red2", [Color.Red], 0, 0),
    rightTile("red2", [Color.Red], 0, 1),
    leftTile("red2", [Color.Red], 0, 2),
    rightTile("red2", [Color.Red], 1, 0),
    leftTile("red2", [Color.Red], 1, 1),
    rightTile("red2", [Color.Red], 1, 2),

    leftLineTile("red2", [Color.Red], 0, -2),
    rightLineTile("red2", [Color.Red], 1, -2),

  ],
};



const red2_4: ParentTile = {
  name: "red2",
  subTiles: [
    leftTile("red2", [Color.Red], 0, 0),
    rightTile("red2", [Color.Red], 0, 1),
    leftTile("red2", [Color.Red], 0, 2),
    rightTile("red2", [Color.Red], 1, 0),
    leftTile("red2", [Color.Red], 1, 1),
    rightTile("red2", [Color.Red], 1, 2),

    leftLineTile("red2", [Color.Red], -1, -1, TriangleLine.Bottom, { 0: 2, 2: 0 }),
    rightLineTile("red2", [Color.Red], -1, 0, TriangleLine.Top, { 6: 8, 8: 6 }),
  ],
};


const red2_5: ParentTile = {
  name: "red2",
  subTiles: [
    leftTile("red2", [Color.Red], 0, 0),
    rightTile("red2", [Color.Red], 0, 1),
    leftTile("red2", [Color.Red], 0, 2),
    rightTile("red2", [Color.Red], 1, 0),
    leftTile("red2", [Color.Red], 1, 1),
    rightTile("red2", [Color.Red], 1, 2),

    rightLineTile("red2", [Color.Red], -1, 2, TriangleLine.Bottom, { 0: 10, 10: 0 }),
    leftLineTile("red2", [Color.Red], -1, 3, TriangleLine.Top, { 6: 4, 4: 6 }),
  ],
};

const red2Variants = [red2_0, red2_1, red2_2, red2_3, red2_4, red2_5];

// #endregion red 2

// #region red3

const red3_0: ParentTile = {
  name: "red3",
  subTiles: [
    rightTile("red3", [Color.Red], 0, 0),
    leftTile("red3", [Color.Red], 0, 1),
    rightTile("red3", [Color.Red], 0, 2),
    leftTile("red3", [Color.Red], 0, 3),
  ],
};


const red3_1: ParentTile = {
  name: "red3",
  subTiles: [
    rightTile("red3", [Color.Red], 0, 0),
    leftTile("red3", [Color.Red], 0, -1),
    rightTile("red3", [Color.Red], 1, -1),
    leftTile("red3", [Color.Red], 1, -2),
  ],
};



const red3_2: ParentTile = {
  name: "red3",
  subTiles: [
    leftTile("red3", [Color.Red], 0, 0),
    rightTile("red3", [Color.Red], 1, 0),
    leftTile("red3", [Color.Red], 1, 1),
    rightTile("red3", [Color.Red], 2, 1),

  ],
};

const red3_3 = flipParentTile(red3_0);
const red3_4 = flipParentTile(red3_1);
const red3_5 = flipParentTile(red3_2);

const red3Variants = [red3_0, red3_1, red3_2, red3_3, red3_4, red3_5];

// #endregion

// #region white 1

const white1_0: ParentTile = {
  name: "white1",
  subTiles: [
    leftTile("white1", [Color.White], 0, 0),
    rightTile("white1", [Color.White], 0, 1),
    leftTile("white1", [Color.White], 0, 2),
    rightTile("white1", [Color.White], 1, 2),
    leftTile("white1", [Color.White], 1, 3),
    rightTile("white1", [Color.White], 1, 4),
  ],
};


const white1_1: ParentTile = {
  name: "white1",
  subTiles: [
    leftTile("white1", [Color.White], 0, 0),

    leftTile("white1", [Color.White], 1, -3),
    rightTile("white1", [Color.White], 1, -2),
    leftTile("white1", [Color.White], 1, -1),
    rightTile("white1", [Color.White], 1, 0),

    rightTile("white1", [Color.White], 2, -3),
  ],
};



const white1_2: ParentTile = {
  name: "white1",
  subTiles: [
    rightTile("white1", [Color.White], 0, 0),
    leftTile("white1", [Color.White], 0, 1),

    leftTile("white1", [Color.White], 1, 0),
    rightTile("white1", [Color.White], 1, 1),

    rightTile("white1", [Color.White], 2, 0),
    leftTile("white1", [Color.White], 2, 1),
  ],
};

const white1_3 = flipParentTile(white1_0);
const white1_4 = flipParentTile(white1_1);
const white1_5 = flipParentTile(white1_2);

const white1Variants = [white1_0, white1_1, white1_2, white1_3, white1_4, white1_5];

// #endregion

// #region white 2

const white2_0: ParentTile = {
  name: "white2",
  subTiles: [
    rightTile("white2", [Color.White], 0, 0),
    leftTile("white2", [Color.White], 0, 1),
    rightTile("white2", [Color.White], 0, 2),
    leftTile("white2", [Color.White], 0, 3),
    rightTile("white2", [Color.White], 0, 4),
  ],
};

const white2_1: ParentTile = {
  name: "white2",
  subTiles: [
    leftTile("white2", [Color.White], 0, 0),

    leftTile("white2", [Color.White], 1, -1),
    rightTile("white2", [Color.White], 1, 0),

    leftTile("white2", [Color.White], 2, -2),
    rightTile("white2", [Color.White], 2, -1),
  ],
};


const white2_2: ParentTile = {
  name: "white2",
  subTiles: [
    rightTile("white2", [Color.White], 0, 0),
    leftTile("white2", [Color.White], 0, 1),

    rightTile("white2", [Color.White], 1, 1),
    leftTile("white2", [Color.White], 1, 2),

    rightTile("white2", [Color.White], 2, 2),
  ],
};

const white2_3 = flipParentTile(white2_0);
const white2_4 = flipParentTile(white2_1);
const white2_5 = flipParentTile(white2_2);

const white2Variants = [white2_0, white2_1, white2_2, white2_3, white2_4, white2_5];

// #endregion

// #region white 4

const white4_0: ParentTile = {
  name: "white4",
  subTiles: [
    leftTile("white4", [Color.White], 0, 0),
    rightTile("white4", [Color.White], 0, 1),
    leftLineTile("white4", [Color.White], 0, -2),
    rightLineTile("white4", [Color.White], 1, -2),
  ],
};


const white4_1: ParentTile = {
  name: "white4",
  subTiles: [
    leftTile("white4", [Color.White], 0, 0),
    rightTile("white4", [Color.White], 1, 0),

    rightLineTile("white4", [Color.White], 2, -1, TriangleLine.Bottom, { 0: 10, 10: 0 }),
    leftLineTile("white4", [Color.White], 2, -0, TriangleLine.Top, { 6: 4, 4: 6 }),
  ],
};

const white4_2: ParentTile = {
  name: "white4",
  subTiles: [
    rightTile("white4", [Color.White], 0, 0),
    leftTile("white4", [Color.White], 0, 1),
    leftLineTile("white4", [Color.White], 1, 2, TriangleLine.Bottom, { 0: 2, 2: 0 }),
    rightLineTile("white4", [Color.White], 1, 3, TriangleLine.Top, { 6: 8, 8: 6 }),
  ],
};


const white4_3: ParentTile = {
  name: "white4",
  subTiles: [
    leftTile("white4", [Color.White], 0, 0),
    rightTile("white4", [Color.White], 0, 1),

    leftLineTile("white4", [Color.White], -1, 3),
    rightLineTile("white4", [Color.White], 0, 3),
  ],
};



const white4_4: ParentTile = {
  name: "white4",
  subTiles: [
    leftTile("white4", [Color.White], 0, 0),
    rightTile("white4", [Color.White], 1, 0),

    rightLineTile("white4", [Color.White], -1, 0, TriangleLine.Bottom, { 0: 10, 10: 0 }),
    leftLineTile("white4", [Color.White], -1, 1, TriangleLine.Top, { 4: 6, 6: 4 }),
  ],
};


const white4_5: ParentTile = {
  name: "white4",
  subTiles: [
    rightTile("white4", [Color.White], 0, 0),
    leftTile("white4", [Color.White], 0, 1),

    leftLineTile("white4", [Color.White], -1, -2, TriangleLine.Bottom, { 0: 2, 2: 0 }),
    rightLineTile("white4", [Color.White], -1, -1, TriangleLine.Top, { 8: 6, 6: 8 }),
  ],
};

const white4_6 = flipParentTile(white4_0);
const white4_7 = flipParentTile(white4_1);
const white4_8 = flipParentTile(white4_2);
const white4_9 = flipParentTile(white4_3);
const white4_10 = flipParentTile(white4_4);
const white4_11 = flipParentTile(white4_5);

const white4Variants = [white4_0, white4_1, white4_2, white4_3, white4_4, white4_5, white4_6, white4_7, white4_8, white4_9, white4_10, white4_11];


// #endregion



const blue2_0 = changeNameColor(red3_0, "blue2", [Color.Blue]);
const blue2_1 = changeNameColor(red3_1, "blue2", [Color.Blue]);
const blue2_2 = changeNameColor(red3_2, "blue2", [Color.Blue]);
const blue2_3 = changeNameColor(red3_3, "blue2", [Color.Blue]);
const blue2_4 = changeNameColor(red3_4, "blue2", [Color.Blue]);
const blue2_5 = changeNameColor(red3_5, "blue2", [Color.Blue]);

const blue2Variants = [blue2_0, blue2_1, blue2_2, blue2_3, blue2_4, blue2_5];

const yellow1_0 = changeNameColor(red1_0, "yellow1", [Color.Yellow]);
const yellow1_1 = changeNameColor(red1_1, "yellow1", [Color.Yellow]);
const yellow1_2 = changeNameColor(red1_2, "yellow1", [Color.Yellow]);
const yellow1_3 = changeNameColor(red1_3, "yellow1", [Color.Yellow]);
const yellow1_4 = changeNameColor(red1_4, "yellow1", [Color.Yellow]);
const yellow1_5 = changeNameColor(red1_5, "yellow1", [Color.Yellow]);
const yellow1_6 = changeNameColor(red1_6, "yellow1", [Color.Yellow]);
const yellow1_7 = changeNameColor(red1_7, "yellow1", [Color.Yellow]);
const yellow1_8 = changeNameColor(red1_8, "yellow1", [Color.Yellow]);
const yellow1_9 = changeNameColor(red1_9, "yellow1", [Color.Yellow]);
const yellow1_10 = changeNameColor(red1_10, "yellow1", [Color.Yellow]);
const yellow1_11 = changeNameColor(red1_11, "yellow1", [Color.Yellow]);

const yellow1Variants = [yellow1_0, yellow1_1, yellow1_2, yellow1_3, yellow1_4, yellow1_5, yellow1_6, yellow1_7, yellow1_8, yellow1_9, yellow1_10, yellow1_11];

const yellow2_0: ParentTile = {
  name: "yellow2",
  subTiles: [
    leftLineTile("yellow2", [Color.Yellow], 0, 0),
    leftTile("yellow2", [Color.Yellow], 0, 2),

    rightLineTile("yellow2", [Color.Yellow], 1, 0),
    rightTile("yellow2", [Color.Yellow], 1, 2),
  ],
};

const yellow2_1: ParentTile = {
  name: "yellow2",
  subTiles: [
    rightTile("yellow2", [Color.Yellow], 0, 0),
    leftTile("yellow2", [Color.Yellow], 0, 1),

    rightLineTile("yellow2", [Color.Yellow], 1, -1, TriangleLine.Bottom, { 0: 10, 10: 0 }),
    leftLineTile("yellow2", [Color.Yellow], 1, 0, TriangleLine.Top, { 6: 4, 4: 6 }),
  ],
};


const yellow2_2: ParentTile = {
  name: "yellow2",
  subTiles: [
    leftTile("yellow2", [Color.Yellow], 0, 0),
    rightTile("yellow2", [Color.Yellow], 0, 1),

    leftLineTile("yellow2", [Color.Yellow], 1, 1, TriangleLine.Bottom, { 0: 2, 2: 0 }),
    rightLineTile("yellow2", [Color.Yellow], 1, 2, TriangleLine.Top, { 6: 8, 8: 6 }),
  ],
};


const yellow2_3: ParentTile = {
  name: "yellow2",
  subTiles: [
    leftTile("yellow2", [Color.Yellow], 0, 0),
    rightTile("yellow2", [Color.Yellow], 1, 0),

    leftLineTile("yellow2", [Color.Yellow], 0, 2),
    rightLineTile("yellow2", [Color.Yellow], 1, 2),
  ],
};



const yellow2_4: ParentTile = {
  name: "yellow2",
  subTiles: [
    rightTile("yellow2", [Color.Yellow], 0, 0),
    leftTile("yellow2", [Color.Yellow], 0, 1),


    rightLineTile("yellow2", [Color.Yellow], -1, 1, TriangleLine.Bottom, { 0: 10, 10: 0 }),
    leftLineTile("yellow2", [Color.Yellow], -1, 2, TriangleLine.Top, { 6: 4, 4: 6 }),

  ],
};



const yellow2_5: ParentTile = {
  name: "yellow2",
  subTiles: [
    leftTile("yellow2", [Color.Yellow], 0, 0),
    rightTile("yellow2", [Color.Yellow], 0, 1),

    leftLineTile("yellow2", [Color.Yellow], -1, -1, TriangleLine.Bottom, { 0: 2, 2: 0 }),
    rightLineTile("yellow2", [Color.Yellow], -1, 0, TriangleLine.Top, { 6: 8, 8: 6 }),
  ],
};

const yellow2Variants = [yellow2_0, yellow2_1, yellow2_2, yellow2_3, yellow2_4, yellow2_5];


// #region white 2

const yellow3_0: ParentTile = {
  name: "yellow3",
  subTiles: [
    rightTile("yellow3", [Color.Yellow], 0, 0),
    leftTile("yellow3", [Color.Yellow], 0, 1),
    rightTile("yellow3", [Color.Yellow], 0, 2),
  ],
};

const yellow3_1: ParentTile = {
  name: "yellow3",
  subTiles: [
    leftTile("yellow3", [Color.Yellow], 0, 0),

    leftTile("yellow3", [Color.Yellow], 1, -1),
    rightTile("yellow3", [Color.Yellow], 1, 0),
  ],
};


const yellow3_2: ParentTile = {
  name: "yellow3",
  subTiles: [
    rightTile("yellow3", [Color.Yellow], 0, 0),
    leftTile("yellow3", [Color.Yellow], 0, 1),

    rightTile("yellow3", [Color.Yellow], 1, 1),
  ],
};

const yellow3_3 = flipParentTile(yellow3_0);
const yellow3_4 = flipParentTile(yellow3_1);
const yellow3_5 = flipParentTile(yellow3_2);

const yellow3Variants = [yellow3_0, yellow3_1, yellow3_2, yellow3_3, yellow3_4, yellow3_5];

// #endregion

const transparent1_0 = {
  name: "transparent1",
  subTiles: [
    leftTile("transparent1", [], 0, 0),
    rightTile("transparent1", [], 0, 1),
  ],
};

const transparent1_1 = {
  name: "transparent1",
  subTiles: [
    rightTile("transparent1", [], 0, 0),
    leftTile("transparent1", [], 0, 1),
  ],
};


const transparent1_2 = {
  name: "transparent1",
  subTiles: [
    leftTile("transparent1", [], 0, 0),
    rightTile("transparent1", [], 1, 0),
  ],
};

const transparent1Variants = [transparent1_0, transparent1_1, transparent1_2];


const lightblue1_0 = {
  name: "lightblue1",
  subTiles: [
    leftTile("lightblue1", [Color.Blue, Color.White], 0, 0),
  ],
};


const lightblue1_1 = {
  name: "lightblue1",
  subTiles: [
    rightTile("lightblue1", [Color.Blue, Color.White], 0, 0),
  ],
};

const lightblue1Variants = [lightblue1_0, lightblue1_1];

const firstVariantsByName: Record<string, ParentTile> = {
  [red3_0.name]: red3_0,
  [white1_0.name]: white1_0,
  [white2_0.name]: white2_0,
  [white3_0.name]: white3_0,
  [white4_0.name]: white4_0,
  [blue1_0.name]: blue1_0,
  [blue2_0.name]: blue2_0,
  [blue3_0.name]: blue3_0,
  [yellow1_0.name]: yellow1_0,
  [yellow2_0.name]: yellow2_0,
  [yellow3_0.name]: yellow3_0,
  [red1_0.name]: red1_0,
  [red2_0.name]: red2_0,
  [lightblue1_0.name]: lightblue1_0,
  [transparent1_0.name]: transparent1_0,
};

export function getFirstTileVariant(tile: ParentTile): ParentTile {
  return firstVariantsByName[tile.name] ?? tile;
}

export function getAllTileTypes(): ParentTile[] {
  return Object.values(firstVariantsByName);
}

const tileVariantsByName: Record<string, ParentTile[]> = {
  red1: red1Variants,
  red2: red2Variants,
  red3: red3Variants,
  white1: white1Variants,
  white2: white2Variants,
  white3: [white3_0],
  white4: white4Variants,
  blue1: blue1Variants,
  blue2: blue2Variants,
  blue3: blue3Variants,
  yellow1: yellow1Variants,
  yellow2: yellow2Variants,
  yellow3: yellow3Variants,
  lightblue1: lightblue1Variants,
  transparant1: transparent1Variants,
};

export function getTileVariants(name: string): ParentTile[] {
  return tileVariantsByName[name] ?? [];
}

export function getRandomTile(tileList: ParentTile[]
): ParentTile {
  const value = Math.random();
  if (!Number.isFinite(value) || value < 0 || value >= 1) {
    throw new Error("Random source must return a value in [0, 1)");
  }
  return tileList[Math.floor(value * tileList.length)];
}

export function getTiles(
  tileCount: number,
  tileOptions: TileOptions,
  random: () => number = Math.random,
): ParentTile[] {
  const allTiles = [
    getRandomTile(red1Variants),
    getRandomTile(red2Variants),
    getRandomTile(red3Variants),
    getRandomTile(white1Variants),
    getRandomTile(white2Variants),
    white3_0,
    getRandomTile(white4Variants),
    getRandomTile(blue1Variants),
    getRandomTile(blue2Variants),
    getRandomTile(blue3Variants),
    getRandomTile(yellow1Variants),
    getRandomTile(yellow2Variants),
    getRandomTile(yellow3Variants),
  ];

  if (tileCount < 4) {
    throw new Error("tileCount must be at least 4");
  }
  if (tileCount > allTiles.length) {
    throw new Error(
      `tileCount cannot exceed the available tile count (${allTiles.length})`,
    );
  }

  const tilesByColor = new Map<Color, ParentTile[]>();
  for (const tile of allTiles) {
    const color = tile.subTiles[0].colors[0];
    const tiles = tilesByColor.get(color) ?? [];
    tiles.push(tile);
    tilesByColor.set(color, tiles);
  }

  const selected: ParentTile[] = [];
  for (const tiles of tilesByColor.values()) {
    selected.push(tiles[Math.floor(random() * tiles.length)]);
  }

  const remaining = allTiles.filter((tile) => !selected.includes(tile));
  for (let index = remaining.length - 1; index > 0; index--) {
    const randomIndex = Math.floor(random() * (index + 1));
    [remaining[index], remaining[randomIndex]] = [
      remaining[randomIndex],
      remaining[index],
    ];
  }

  selected.push(...remaining.slice(0, tileCount - selected.length));

  if (tileOptions.includeTransparent) {
    selected.push(getRandomTile(transparent1Variants));
  }

  if (tileOptions.includeLightBlue) {
    selected.push(getRandomTile(lightblue1Variants));
  }

  return selected;
}
