import { type ParentTile, type Tile, Color } from './models';


export const borderNodeCoordinates: string[] = [
    ...'ABCDEFGHIJKLMNOPQRS'.split(''),
    ...Array.from({ length: 18 }, (_, i) => String(i + 1)),
];


// // There are four directions
// // 0: West
// // 1: North
// // 2: East
// // 3: South


export function getParentTiles(): ParentTile[] {
    const parentTiles: ParentTile[] = [
        { id: 0, name: 'Red', optional: false },
        { id: 1, name: 'Flipped Red', optional: false },
        { id: 2, name: 'Blue', optional: false },
        { id: 3, name: 'Yellow', optional: false },
        { id: 4, name: 'White Big', optional: false },
        { id: 5, name: 'White Small', optional: false },
        { id: 6, name: 'Transparent', optional: true },
        { id: 7, name: 'Black', optional: true },
        { id: 8, name: 'Light Blue', optional: false },
    ];
    return parentTiles;
}


export function getBasicTiles(): Tile[] {
    const tiles: Tile[] = [
        // Red tile, render as a red tile with 100% opacity
        {
            id: 0,
            colors: [Color.Red],
            opacity: 100,
            parent_id: 0,
            coordinate: { 0: 0, 1: 0 },
            arcs: [[0, 1]],

        },
        {
            id: 1,
            colors: [Color.Red],
            opacity: 100,
            parent_id: 0,
            coordinate: { 0: 0, 1: 1 },
            arcs: [],
        },
        {
            id: 2,
            colors: [Color.Red],
            opacity: 100,
            parent_id: 0,
            coordinate: { 0: 0, 1: 2 },
            arcs: [[2, 3]],
        },
        // Flipped Red tile, render as a red tile with 100% opacity
        // We use either the red tile or the flipped red tile 
        // This reduce the logic to handle tile flipping, because 
        // We randomly select one of them.
        {
            id: 3,
            colors: [Color.Red],
            opacity: 100,
            parent_id: 1,
            coordinate: { 0: 0, 1: 0 },
            arcs: [[0, 1]],

        },
        {
            id: 4,
            colors: [Color.Red],
            opacity: 100,
            parent_id: 1,
            coordinate: { 0: 0, 1: 1 },
            arcs: [],
        },
        {
            id: 5,
            colors: [Color.Red],
            opacity: 100,
            parent_id: 1,
            coordinate: { 0: 0, 1: 2 },
            arcs: [[2, 3]],
        },
        // The blue tile
        {
            id: 6,
            colors: [Color.Blue],
            opacity: 100,
            parent_id: 2,
            coordinate: { 0: 0, 1: 0 },
            arcs: [[0, 1]],
        },
        {
            id: 7,
            colors: [Color.Blue],
            opacity: 100,
            parent_id: 2,
            coordinate: { 0: 1, 1: 0 },
            arcs: [[1, 2]],
        },
        {
            id: 8,
            colors: [Color.Blue],
            opacity: 100,
            parent_id: 2,
            coordinate: { 0: -1, 1: -1 },
            arcs: [[0, 1]],
        },
        {
            id: 9,
            colors: [Color.Blue],
            opacity: 100,
            parent_id: 2,
            coordinate: { 0: 0, 1: -1 },
            arcs: [],
        },
        {
            id: 10,
            colors: [Color.Blue],
            opacity: 100,
            parent_id: 2,
            coordinate: { 0: 1, 1: -1 },
            arcs: [],
        },
        {
            id: 11,
            colors: [Color.Blue],
            opacity: 100,
            parent_id: 2,
            coordinate: { 0: 2, 1: -1 },
            arcs: [[1, 2]],
        },
        // Yellow tile
        {
            id: 12,
            colors: [Color.Yellow],
            opacity: 100,
            parent_id: 3,
            coordinate: { 0: 0, 1: 0 },
            arcs: [[1, 2]],
        },
        {
            id: 13,
            colors: [Color.Yellow],
            opacity: 100,
            parent_id: 3,
            coordinate: { 0: 1, 1: 0 },
            arcs: [],
        },
        {
            id: 14,
            colors: [Color.Yellow],
            opacity: 100,
            parent_id: 3,
            coordinate: { 0: 1, 1: -1 },
            arcs: [[1, 2]],
        },
        // The white tile, the same shape with the blue tile but the color is white.
        {
            id: 12,
            colors: [Color.White],
            opacity: 100,
            parent_id: 3,
            coordinate: { 0: 0, 1: 0 },
            arcs: [[0, 1]],
        },
        {
            id: 13,
            colors: [Color.White],
            opacity: 100,
            parent_id: 3,
            coordinate: { 0: 1, 1: 0 },
            arcs: [[1, 2]],
        },
        {
            id: 14,
            colors: [Color.White],
            opacity: 100,
            parent_id: 3,
            coordinate: { 0: -1, 1: -1 },
            arcs: [[0, 1]],
        },
        {
            id: 15,
            colors: [Color.White],
            opacity: 100,
            parent_id: 3,
            coordinate: { 0: 0, 1: -1 },
            arcs: [],
        },
        {
            id: 16,
            colors: [Color.White],
            opacity: 100,
            parent_id: 3,
            coordinate: { 0: 1, 1: -1 },
            arcs: [],
        },
        {
            id: 17,
            colors: [Color.White],
            opacity: 100,
            parent_id: 3,
            coordinate: { 0: 2, 1: -1 },
            arcs: [[1, 2]],
        },
        // Small white tile
        {
            id: 12,
            colors: [Color.White],
            opacity: 100,
            parent_id: 3,
            coordinate: { 0: 0, 1: 0 },
            arcs: [[0, 1]],
        },
        {
            id: 13,
            colors: [Color.White],
            opacity: 100,
            parent_id: 3,
            coordinate: { 0: 1, 1: 0 },
            arcs: [[1, 2]],
        },
        {
            id: 13,
            colors: [Color.White],
            opacity: 100,
            parent_id: 3,
            coordinate: { 0: 0, 1: -1 },
            arcs: [[0, 3]],
        },
        {
            id: 13,
            colors: [Color.White],
            opacity: 100,
            parent_id: 3,
            coordinate: { 0: 1, 1: -1 },
            arcs: [[2, 3]],
        },
        // The transparent tile, render as a white tile with 50% opacity
        {
            id: 18,
            colors: [],
            opacity: 50,
            parent_id: 6,
            coordinate: { 0: 0, 1: 0 },
            arcs: [[0, 1]],
        },
        {
            id: 18,
            colors: [],
            opacity: 50,
            parent_id: 6,
            coordinate: { 0: 0, 1: 1 },
            arcs: [[1, 2]],
        },
        // The black tile, render as a black tile with 100% opacity
        {
            id: 19,
            colors: [],
            opacity: 100,
            parent_id: 7,
            coordinate: { 0: 0, 1: 0 },
            arcs: [],
        },
        {
            id: 19,
            colors: [],
            opacity: 100,
            parent_id: 7,
            coordinate: { 0: 0, 1: 1 },
            arcs: [],
        },
        // The light blue tile, render as a light blue tile with 100% opacity
        {
            id: 20,
            colors: [Color.Blue, Color.White],
            opacity: 100,
            parent_id: 8,
            coordinate: { 0: 0, 1: 0 },
            arcs: [[0, 1]],
        },
    ];

    return tiles;
}