import type { IFluentCell, IFluentRow } from './fluent'

export interface IGridOptions {
	/** Available width of the list */
	width: number;
	/** Space between the cells and around the row */
	padding: number;
	/** Minimum edge length of a cell. The cells are grown to fill the width */
	minSize: number;
	/** Height of the file name label below a cell. It is 0 without a label */
	labelHeight: number;
}

const defaultOptions: IGridOptions = {
	width: 1024,
	padding: 10,
	minSize: 180,
	labelHeight: 0
}

/**
 * Minimum edge length of a cell at the default thumbnail size. It is scaled by
 * the size factor of the thumbnail size and is shared with the grid view of
 * the folders page, so that both grids have the same amount of columns
 */
export const mobileGridSize = 110
export const desktopGridSize = 180

/**
 * Layouts the items in a grid of squared cells.
 *
 * The amount of columns is derived from the available width. The cells are
 * grown to fill the row, so the cell size is equal or larger than `minSize`.
 *
 * The rows have the same shape as the rows of the fluent layout, so both
 * layouts share the list rendering. The media are cropped to the cell by the
 * `object-cover` style of the thumbnail.
 *
 * The file name label is no part of the cell and is added to the row height
 * only, so that the cells keep their squared shape
 */
export const grid = (items: any[], options: Partial<IGridOptions>): IFluentRow[] => {
	const { width, padding, minSize, labelHeight } = Object.assign({}, defaultOptions, options);

	// the row is padded by half the padding on each side, so the space around
	// the cells is one gap and the columns are counted like the css grid of the
	// folders page: repeat(auto-fill, minmax(minSize, 1fr))
	const columns = Math.max(1, Math.floor(width / (minSize + padding)))
	const size = Math.floor(width / columns - padding)

	const rows: IFluentRow[] = []
	for (let i = 0; i < items.length; i += columns) {
		const cells: IFluentCell[] = items.slice(i, i + columns)
			.map((item, column) => ({width: size, height: size, item, index: i + column, items}))
		rows.push({height: size + labelHeight, top: 0, columns: cells})
	}

	let lastTop = 0
	rows.forEach(row => {
		row.top = lastTop
		lastTop += row.height + padding
	})

	return rows
}
