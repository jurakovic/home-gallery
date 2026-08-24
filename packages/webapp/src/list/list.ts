import type { IFluentCell, IFluentRow } from './fluent'

export interface IListOptions {
	/** Available width of the list */
	width: number;
	/** Space between the rows */
	padding: number;
	/** Height of a row. It is the edge length of its squared thumbnail, too */
	rowHeight: number;
}

/**
 * Height of a row of the list layout. It is shared with the list view of the
 * albums page, so that both lists have the same rows
 */
export const mobileRowHeight = 56
export const desktopRowHeight = 72

const defaultOptions: IListOptions = {
	width: 1024,
	padding: 10,
	rowHeight: 72
}

/**
 * Layouts the items as list of one media per row.
 *
 * The cell of a row is the squared thumbnail of the media. The file name and
 * the media details are rendered beside it and fill the rest of the row, so
 * the row width is no part of this layout.
 *
 * The rows have the same shape as the rows of the fluent layout, so all
 * layouts share the list rendering
 */
export const list = (items: any[], options: Partial<IListOptions>): IFluentRow[] => {
	const { padding, rowHeight } = Object.assign({}, defaultOptions, options);

	const size = +rowHeight.toFixed()

	const rows: IFluentRow[] = items.map((item, index) => {
		const cell: IFluentCell = {width: size, height: size, item, index, items}
		return {height: size, top: 0, columns: [cell]}
	})

	let lastTop = 0
	rows.forEach(row => {
		row.top = lastTop
		lastTop += row.height + padding
	})

	return rows
}
