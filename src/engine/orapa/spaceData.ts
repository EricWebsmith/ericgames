import { type ParentTile, Color, Tile } from './models';

// There are four directions for the square grid:
// 0: West
// 1: North
// 2: East
// 3: South
//
// arcs: [[in_face, out_face], ...]
// e.g. [[0, 1]] means: light entering through the West face exits through the North face.
// If no arc matches the entry face, light is reflected straight back (reverses direction).
// A tile with arcs: [] absorbs light entirely (black gem behaviour).

export function getTiles(): ParentTile[] {


    return [
        {
            name: 'White Big', optional: false, subTiles: [
                new Tile({ colors: [Color.White], coordinate: { 0: 0, 1: 0 }, reflect: [[0, 1], [1, 0]], parentName: 'White Big' }),
                new Tile({ colors: [Color.White], coordinate: { 0: 1, 1: 0 }, reflect: [], parentName: 'White Big' }),
                new Tile({ colors: [Color.White], coordinate: { 0: 2, 1: 0 }, reflect: [], parentName: 'White Big' }),
                new Tile({ colors: [Color.White], coordinate: { 0: 3, 1: 0 }, reflect: [[1, 2], [2, 1]], parentName: 'White Big' }),
                new Tile({ colors: [Color.White], coordinate: { 0: 0, 1: 1 }, reflect: [], connectBorder: true, parentName: 'White Big' }),
                new Tile({ colors: [Color.White], coordinate: { 0: 1, 1: 1 }, reflect: [], parentName: 'White Big' }),
                new Tile({ colors: [Color.White], coordinate: { 0: 2, 1: 1 }, reflect: [], parentName: 'White Big' }),
                new Tile({ colors: [Color.White], coordinate: { 0: 3, 1: 1 }, reflect: [], connectBorder: true, parentName: 'White Big' }),
            ]
        },
        {
            name: 'Red Small', optional: false, subTiles: [
                new Tile({ colors: [Color.Red], coordinate: { 0: 0, 1: 0 }, reflect: [], parentName: 'Red Small' }),
            ]
        },
        {
            name: 'Red Big', optional: false, subTiles: [
                new Tile({ colors: [Color.Red], coordinate: { 0: 0, 1: 0 }, reflect: [[0, 1], [1, 0]], parentName: 'Red Big' }),
                new Tile({ colors: [Color.Red], coordinate: { 0: 1, 1: 0 }, reflect: [[1, 2], [2, 1]], parentName: 'Red Big' }),
                new Tile({ colors: [Color.Red], coordinate: { 0: 1, 1: 1 }, reflect: [[2, 3], [3, 2]], parentName: 'Red Big' }),
                new Tile({ colors: [Color.Red], coordinate: { 0: 0, 1: 1 }, reflect: [[0, 3], [3, 0]], parentName: 'Red Big' }),
            ]
        },
        {
            name: 'Blue', optional: false, subTiles: [
                new Tile({ colors: [Color.Blue], coordinate: { 0: 0, 1: 0 }, reflect: [[0, 1], [1, 0]], parentName: 'Blue' }),
                new Tile({ colors: [Color.Blue], coordinate: { 0: 1, 1: 0 }, reflect: [[1, 2], [2, 1]], parentName: 'Blue' }),
                new Tile({ colors: [Color.Blue], coordinate: { 0: 1, 1: 1 }, reflect: [[2, 3], [3, 2]], parentName: 'Blue' }),
                new Tile({ colors: [Color.Blue], coordinate: { 0: 0, 1: 1 }, reflect: [[0, 3], [3, 0]], parentName: 'Blue' }),
            ]
        },
        {
            name: 'Yellow', optional: false, subTiles: [
                new Tile({ colors: [Color.Yellow], coordinate: { 0: 0, 1: 0 }, reflect: [[0, 1], [1, 0]], parentName: 'Yellow' }),
                new Tile({ colors: [Color.Yellow], coordinate: { 0: 1, 1: 0 }, reflect: [], parentName: 'Yellow' }),
                new Tile({ colors: [Color.Yellow], coordinate: { 0: 2, 1: 0 }, reflect: [[1, 2], [2, 1]], parentName: 'Yellow' }),
                new Tile({ colors: [Color.Yellow], coordinate: { 0: 0, 1: 1 }, reflect: [], parentName: 'Yellow' }),
                new Tile({ colors: [Color.Yellow], coordinate: { 0: 1, 1: 1 }, reflect: [], parentName: 'Yellow' }),
                new Tile({ colors: [Color.Yellow], coordinate: { 0: 2, 1: 1 }, reflect: [], parentName: 'Yellow' }),
                new Tile({ colors: [Color.Yellow], coordinate: { 0: 0, 1: 2 }, reflect: [[0, 3], [3, 0]], parentName: 'Yellow' }),
                new Tile({ colors: [Color.Yellow], coordinate: { 0: 1, 1: 2 }, reflect: [], parentName: 'Yellow' }),
                new Tile({ colors: [Color.Yellow], coordinate: { 0: 2, 1: 2 }, reflect: [[2, 3], [3, 2]], parentName: 'Yellow' }),
            ]
        },

        {
            name: 'White Small', optional: false, subTiles: [
                new Tile({ colors: [Color.White], coordinate: { 0: 0, 1: 0 }, reflect: [[0, 2], [1, 3], [2, 0]], belt: 3, parentName: 'White Small' }),
                new Tile({ colors: [Color.White], coordinate: { 0: 1, 1: 0 }, reflect: [[0, 1], [1, 0]], parentName: 'White Small' }),
                new Tile({ colors: [Color.White], coordinate: { 0: 2, 1: 0 }, reflect: [[1, 2], [2, 1]], parentName: 'White Small' }),
                new Tile({ colors: [Color.White], coordinate: { 0: 3, 1: 0 }, reflect: [[0, 2], [1, 3], [2, 0]], belt: 3, parentName: 'White Small' }),
                new Tile({ colors: [Color.White], coordinate: { 0: 0, 1: 1 }, reflect: [[0, 2], [3, 1], [2, 0]], belt: 1, parentName: 'White Small' }),
                new Tile({ colors: [Color.White], coordinate: { 0: 1, 1: 1 }, reflect: [[0, 3], [3, 0]], parentName: 'White Small' }),
                new Tile({ colors: [Color.White], coordinate: { 0: 2, 1: 1 }, reflect: [[3, 2], [2, 3]], parentName: 'White Small' }),
                new Tile({ colors: [Color.White], coordinate: { 0: 3, 1: 1 }, reflect: [[0, 2], [3, 1], [2, 1]], belt: 1, parentName: 'White Small' }),
            ]
        },
        {
            name: 'Black Hole', optional: true, subTiles: [
                new Tile({ colors: [], coordinate: { 0: 0, 1: 0 }, reflect: [], absorbLight: true, parentName: 'Black Hole', blackHole: true }),
            ]
        },
    ];
}