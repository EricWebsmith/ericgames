import { type ParentTile, Color } from './models';

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
                { colors: [Color.White], opacity: 100, coordinate: { 0: 0, 1: 0 }, reflect: [[0, 1]], absorbLight: false, parentName: 'White Big', belt: -1, connectBorder: false },
                { colors: [Color.White], opacity: 100, coordinate: { 0: 1, 1: 0 }, reflect: [], absorbLight: false, parentName: 'White Big', belt: -1, connectBorder: false },
                { colors: [Color.White], opacity: 100, coordinate: { 0: 2, 1: 0 }, reflect: [], absorbLight: false, parentName: 'White Big', belt: -1, connectBorder: false },
                { colors: [Color.White], opacity: 100, coordinate: { 0: 3, 1: 0 }, reflect: [[1, 2]], absorbLight: false, parentName: 'White Big', belt: -1, connectBorder: false },
                { colors: [Color.White], opacity: 100, coordinate: { 0: 0, 1: 1 }, reflect: [], absorbLight: false, parentName: 'White Big', belt: -1, connectBorder: true },
                { colors: [Color.White], opacity: 100, coordinate: { 0: 1, 1: 1 }, reflect: [], absorbLight: false, parentName: 'White Big', belt: -1, connectBorder: false },
                { colors: [Color.White], opacity: 100, coordinate: { 0: 2, 1: 1 }, reflect: [], absorbLight: false, parentName: 'White Big', belt: -1, connectBorder: false },
                { colors: [Color.White], opacity: 100, coordinate: { 0: 3, 1: 1 }, reflect: [], absorbLight: false, parentName: 'White Big', belt: -1, connectBorder: true },
            ]
        },
        {
            name: 'Red Small', optional: false, subTiles: [
                { colors: [Color.Red], opacity: 100, coordinate: { 0: 0, 1: 0 }, reflect: [], absorbLight: false, parentName: 'Red Small', belt: -1, connectBorder: false },
            ]
        },
        {
            name: 'Red Big', optional: false, subTiles: [
                { colors: [Color.Red], opacity: 100, coordinate: { 0: 0, 1: 0 }, reflect: [[0, 1]], absorbLight: false, parentName: 'Red Big', belt: -1, connectBorder: false },
                { colors: [Color.Red], opacity: 100, coordinate: { 0: 1, 1: 0 }, reflect: [[1, 2]], absorbLight: false, parentName: 'Red Big', belt: -1, connectBorder: false },
                { colors: [Color.Red], opacity: 100, coordinate: { 0: 1, 1: 1 }, reflect: [[2, 3]], absorbLight: false, parentName: 'Red Big', belt: -1, connectBorder: false },
                { colors: [Color.Red], opacity: 100, coordinate: { 0: 0, 1: 1 }, reflect: [[0, 3]], absorbLight: false, parentName: 'Red Big', belt: -1, connectBorder: false },
            ]
        },
        {
            name: 'Blue', optional: false, subTiles: [
                { colors: [Color.Blue], opacity: 100, coordinate: { 0: 0, 1: 0 }, reflect: [[0, 1]], absorbLight: false, parentName: 'Blue', belt: -1, connectBorder: false },
                { colors: [Color.Blue], opacity: 100, coordinate: { 0: 1, 1: 0 }, reflect: [[1, 2]], absorbLight: false, parentName: 'Blue', belt: -1, connectBorder: false },
                { colors: [Color.Blue], opacity: 100, coordinate: { 0: 1, 1: 1 }, reflect: [[2, 3]], absorbLight: false, parentName: 'Blue', belt: -1, connectBorder: false },
                { colors: [Color.Blue], opacity: 100, coordinate: { 0: 0, 1: 1 }, reflect: [[0, 3]], absorbLight: false, parentName: 'Blue', belt: -1, connectBorder: false },
            ]
        },
        {
            name: 'Yellow', optional: false, subTiles: [
                { colors: [Color.Yellow], opacity: 100, coordinate: { 0: 0, 1: 0 }, reflect: [[0, 1]], absorbLight: false, parentName: 'Yellow', belt: -1, connectBorder: false },
                { colors: [Color.Yellow], opacity: 100, coordinate: { 0: 1, 1: 0 }, reflect: [], absorbLight: false, parentName: 'Yellow', belt: -1, connectBorder: false },
                { colors: [Color.Yellow], opacity: 100, coordinate: { 0: 2, 1: 0 }, reflect: [[1, 2]], absorbLight: false, parentName: 'Yellow', belt: -1, connectBorder: false },
                { colors: [Color.Yellow], opacity: 100, coordinate: { 0: 0, 1: 1 }, reflect: [], absorbLight: false, parentName: 'Yellow', belt: -1, connectBorder: false },
                { colors: [Color.Yellow], opacity: 100, coordinate: { 0: 1, 1: 1 }, reflect: [], absorbLight: false, parentName: 'Yellow', belt: -1, connectBorder: false },
                { colors: [Color.Yellow], opacity: 100, coordinate: { 0: 2, 1: 1 }, reflect: [], absorbLight: false, parentName: 'Yellow', belt: -1, connectBorder: false },
                { colors: [Color.Yellow], opacity: 100, coordinate: { 0: 0, 1: 2 }, reflect: [[0, 3]], absorbLight: false, parentName: 'Yellow', belt: -1, connectBorder: false },
                { colors: [Color.Yellow], opacity: 100, coordinate: { 0: 1, 1: 2 }, reflect: [], absorbLight: false, parentName: 'Yellow', belt: -1, connectBorder: false },
                { colors: [Color.Yellow], opacity: 100, coordinate: { 0: 2, 1: 2 }, reflect: [[2, 3]], absorbLight: false, parentName: 'Yellow', belt: -1, connectBorder: false },
            ]
        },

        {
            name: 'White Small', optional: false, subTiles: [
                { colors: [Color.White], opacity: 100, coordinate: { 0: 0, 1: 0 }, reflect: [[0, 2]], absorbLight: false, parentName: 'White Small', belt: 3, connectBorder: false },
                { colors: [Color.White], opacity: 100, coordinate: { 0: 1, 1: 0 }, reflect: [[0, 1]], absorbLight: false, parentName: 'White Small', belt: -1, connectBorder: false },
                { colors: [Color.White], opacity: 100, coordinate: { 0: 2, 1: 0 }, reflect: [[1, 2]], absorbLight: false, parentName: 'White Small', belt: -1, connectBorder: false },
                { colors: [Color.White], opacity: 100, coordinate: { 0: 3, 1: 0 }, reflect: [[0, 2]], absorbLight: false, parentName: 'White Small', belt: 3, connectBorder: false },
                { colors: [Color.White], opacity: 100, coordinate: { 0: 0, 1: 1 }, reflect: [[0, 2]], absorbLight: false, parentName: 'White Small', belt: 1, connectBorder: false },
                { colors: [Color.White], opacity: 100, coordinate: { 0: 1, 1: 1 }, reflect: [[0, 3]], absorbLight: false, parentName: 'White Small', belt: -1, connectBorder: false },
                { colors: [Color.White], opacity: 100, coordinate: { 0: 2, 1: 1 }, reflect: [[3, 2]], absorbLight: false, parentName: 'White Small', belt: -1, connectBorder: false },
                { colors: [Color.White], opacity: 100, coordinate: { 0: 3, 1: 1 }, reflect: [[0, 2]], absorbLight: false, parentName: 'White Small', belt: 1, connectBorder: false },
            ]
        },
        {
            name: 'Black Hole', optional: true, subTiles: [
                { colors: [], opacity: 100, coordinate: { 0: 0, 1: 0 }, reflect: [], absorbLight: true, parentName: 'Black Hole', belt: -1, connectBorder: false },
            ]
        },
    ];
}