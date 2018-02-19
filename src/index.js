import utils from './utils';
import plugins from './plugins';

const { flatten, validateGridArray } = utils;

/**
 * @class
 * @private
 */
function gridl(fn, data) {

    // validate incoming data
    validateGridArray(data);

    const _state = {};

    const _stateProvider = {
        getState: () => _state,
        setState: (newState) => {
            // set state
            Object.entries(newState).forEach(([key, value]) => _state[key] = value);

            // update plugins
            Object.entries(fn).forEach(([key, pluginFactory]) => {
                const plugin = pluginFactory(this, _stateProvider);
                const type = typeof plugin;

                // plugin is just a function
                if (type === 'function') {
                    this[key] = plugin;
                }

                // plugin returns multiple functions bundled together in an object
                else if (type === 'object') {
                    Object.entries(plugin).forEach(([k, func]) => {
                        this[k] = func;
                    });
                }
            });
        },
    };

    // set initial state
    _stateProvider.setState({
        rows: data.length,
        columns: data[0].length,
        data: flatten(data),
        position: [0,0],
    });

    return this;
}

/**
 * Predefined directions you can walk in.<br>
 * Use it in combination with [walk(direction)]{@link gridl#walk}.
 *
 * @namespace
 *
 * @type {Object}
 * @property {Array.<number>} UP - one step up
 * @property {Array.<number>} UP_LEFT - one step left, one step up
 * @property {Array.<number>} UP_RIGHT - one step right, one step up
 * @property {Array.<number>} RIGHT - one step right
 * @property {Array.<number>} LEFT - one step left
 * @property {Array.<number>} DOWN - one step down
 * @property {Array.<number>} DOWN_LEFT - one step left, one step down
 * @property {Array.<number>} DOWN_RIGHT - one step right, one step down
 */
export const directions = Object.freeze({
    UP:         Object.freeze([ 0, -1]),
    UP_RIGHT:   Object.freeze([ 1, -1]),
    RIGHT:      Object.freeze([ 1,  0]),
    DOWN_RIGHT: Object.freeze([ 1,  1]),
    DOWN:       Object.freeze([ 0,  1]),
    DOWN_LEFT:  Object.freeze([-1,  1]),
    LEFT:       Object.freeze([-1,  0]),
    UP_LEFT:    Object.freeze([-1, -1]),
});

/**
 * Predefined lists of adjacent positions relative to a certain position.
 *
 * @namespace
 *
 * @type {Object}
 * @property {number[][]} ALL - all direct adjacent positions (orthogonal + diagonal) in the order: left to right, top to bottom
 * @property {number[][]} ALL_CW - all direct adjacent positions (orthogonal + diagonal) in clockwise order
 * @property {number[][]} ALL_CCW - all direct adjacent positions (orthogonal + diagonal) in counterclockwise order
 * @property {number[][]} ORTHOGONAL - all orthogonal adjacent positions in the order: left to right, top to bottom
 * @property {number[][]} ORTHOGONAL_CW - all orthogonal adjacent positions in clockwise order
 * @property {number[][]} ORTHOGONAL_CCW - all orthogonal adjacent positions in counterclockwise order
 * @property {number[][]} DIAGONAL - all diagonal adjacent positions in the order: left to right, top to bottom
 * @property {number[][]} DIAGONAL_CW - all diagonal adjacent positions in clockwise order
 * @property {number[][]} DIAGONAL_CCW - all diagonal adjacent positions in counterclockwise order
 */
export const adjacences = Object.freeze({
    ALL: Object.freeze([
        directions.UP_LEFT,
        directions.UP,
        directions.UP_RIGHT,
        directions.LEFT,
        directions.RIGHT,
        directions.DOWN_LEFT,
        directions.DOWN,
        directions.DOWN_RIGHT,
    ]),
    ALL_CW: Object.freeze([
        directions.UP,
        directions.UP_RIGHT,
        directions.RIGHT,
        directions.DOWN_RIGHT,
        directions.DOWN,
        directions.DOWN_LEFT,
        directions.LEFT,
        directions.UP_LEFT,
    ]),
    ALL_CCW: Object.freeze([
        directions.UP,
        directions.UP_LEFT,
        directions.LEFT,
        directions.DOWN_LEFT,
        directions.DOWN,
        directions.DOWN_RIGHT,
        directions.RIGHT,
        directions.UP_RIGHT,
    ]),
    ORTHOGONAL: Object.freeze([
        directions.UP,
        directions.LEFT,
        directions.RIGHT,
        directions.DOWN,
    ]),
    ORTHOGONAL_CW: Object.freeze([
        directions.UP,
        directions.RIGHT,
        directions.DOWN,
        directions.LEFT,
    ]),
    ORTHOGONAL_CCW: Object.freeze([
        directions.UP,
        directions.LEFT,
        directions.DOWN,
        directions.RIGHT,
    ]),
    DIAGONAL: Object.freeze([
        directions.UP_LEFT,
        directions.UP_RIGHT,
        directions.DOWN_LEFT,
        directions.DOWN_RIGHT,
    ]),
    DIAGONAL_CW: Object.freeze([
        directions.UP_RIGHT,
        directions.DOWN_RIGHT,
        directions.DOWN_LEFT,
        directions.UP_LEFT,
    ]),
    DIAGONAL_CCW: Object.freeze([
        directions.UP_LEFT,
        directions.DOWN_LEFT,
        directions.DOWN_RIGHT,
        directions.UP_RIGHT,
    ]),
});

/**
 * Create a two dimensional grid array.
 *
 * @param {number} columns - The number of columns.
 * @param {number} rows - The number of rows.
 * @param {Function} callback - The generator function that is called on each cell.
 * @returns {Array.<Array.<*>>} The new grid array.
 */
export function makeGrid(columns, rows, callback = () => null) {
    const parsedColumns = parseInt(columns);
    const parsedRows = parseInt(rows);
    if (parsedColumns < 1 || isNaN(parsedColumns)) {
        throw new Error(`You need to specify at least one column. Given: ${columns}`);
    }
    if (parsedRows < 1 || isNaN(parsedRows)) {
        throw new Error(`You need to specify at least one row. Given: ${rows}`);
    }
    return Array.from({ length: parsedRows }, (vr, row) => (
        Array.from({ length: parsedColumns }, (vc, column) => (
            callback({ column, row })
        ))
    ));
}

/**
 * Generate a one-dimensional array that can be a single row or column.
 *
 * @param {number} length - The length of the array.
 * @param {Function} callback - The generator callback function that is called on each element.
 * @returns {Array.<*>}
 */
export function makeList(length, callback = () => null) {
    const parsedLength = parseInt(length);
    if (parsedLength < 1 || isNaN(parsedLength)) {
        throw new Error(`Trying to make a list with an invalid length. Given: ${length}`);
    }
    return Array.from({ length: parsedLength }, (v, i) => callback(i));
}

/**
 * Generate a gridl instance from scratch by specifying the number of rows and columns and fill it with values.
 *
 * @param {number} numColumns - The number of columns.
 * @param {number} numRows - The number of rows.
 * @param {Function} callback - The generator function that is called for each cell. The returned value is going to be the value of the cell.
 * @returns {gridl} A new gridl instance
 */
export function make(numColumns, numRows, callback) {
    return new gridl(gridlFactory.fn, makeGrid(numColumns, numRows, callback));
}

/**
 * Creates a new gridl instance.
 *
 * @constructs gridl
 * @param {Array.<Array.<*>>} data - A two dimensional grid array. Every row needs to have the same length.
 */
const gridlFactory = data => new gridl(gridlFactory.fn, data);
gridlFactory.adjacences = adjacences;
gridlFactory.directions = directions;
gridlFactory.make = make;
gridlFactory.makeGrid = makeGrid;
gridlFactory.makeList = makeList;
gridlFactory.fn = plugins;

export { utils };

export default gridlFactory;
