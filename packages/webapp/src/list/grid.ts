import type { IFluentCell, IFluentRow } from './fluent'

export interface IGridOptions {
	/** Available width of the list */
	width: number;
	/** Space between the cells and around the row */
	padding: number;
	/** Minimum edge length of a cell. The cells are grown to fill the width */
	minSize: number;
}

const defaultOptions: IGridOptions = {
	width: 1024,
	padding: 10,
	minSize: 180
}

/**
 * Layouts the items in a grid of squared cells.
 *
 * The amount of columns is derived from the available width. The cells are
 * grown to fill the row, so the cell size is equal or larger than `minSize`.
 *
 * The rows have the same shape as the rows of the fluent layout, so both
 * layouts share the list rendering. The media are cropped to the cell by the
 * `object-cover` style of the thumbnail.
 */
export const grid = (items: any[], options: Partial<IGridOptions>): IFluentRow[] => {
	const { width, padding, minSize } = Object.assign({}, defaultOptions, options);

	const columns = Math.max(1, Math.floor((width - padding) / (minSize + padding)))
	const size = +((width - (columns + 1) * padding) / columns).toFixed()

	const rows: IFluentRow[] = []
	for (let i = 0; i < items.length; i += columns) {
		const cells: IFluentCell[] = items.slice(i, i + columns)
			.map((item, column) => ({width: size, height: size, item, index: i + column, items}))
		rows.push({height: size, top: 0, columns: cells})
	}

	let lastTop = 0
	rows.forEach(row => {
		row.top = lastTop
		lastTop += row.height + padding
	})

	return rows
}
