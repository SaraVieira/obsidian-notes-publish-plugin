import { Notice } from 'obsidian'
import { NOTE_NOT_FOUND } from 'src/txt'

type Fields = {
	password?: string
	data?: string
	title?: string
	slug?: string
}

type Record = {
	id?: string
	fields: Fields
}

type ReturnedRecord = Fields & { id: string }

type MiniRecord = Record['fields']

export const read = ({
	base,
	view,
	opts,
}: {
	base: (view: string) => any
	view: string
	opts?: any
}): Promise<Record[]> =>
	new Promise((success, reject) => {
		base(view)
			.select(opts)
			.eachPage(
				(records: Record[]) => success(records),
				(err: string) => {
					if (err) {
						reject(err)
						return
					}
				}
			)
	})

export const readBySlug = async ({
	base,
	view,
	slug,
}: {
	base: (view: string) => any
	view: string
	slug: string
}): Promise<ReturnedRecord | null> => {
	const records = await read({
		base,
		view,
		opts: {
			maxRecords: 1,
			filterByFormula: `{slug} = '${slug}'`,
		},
	})

	if (!records.length) return null

	return {
		...records[0].fields,
		id: records[0].id,
	}
}

export const create = ({
	base,
	view,
	record,
}: {
	base: (view: string) => any
	view: string
	record: MiniRecord
}): Promise<Record[]> =>
	new Promise((success, reject) => {
		base(view).create(
			[{ fields: record }],
			(err: string, records: Record[]) => {
				if (err) {
					reject(err)
					return
				}
				success(records)
			}
		)
	})

export const destroy = ({
	base,
	view,
	id,
}: {
	base: (view: string) => any
	view: string
	id: string
}): Promise<Record[]> =>
	new Promise((success, reject) => {
		base(view).destroy([id], (err: string, records: Record[]) => {
			if (err) {
				reject(err)
				return
			}
			success(records)
		})
	})

export const update = ({
	base,
	view,
	id,
	record,
}: {
	base: (view: string) => any
	id: string
	view: string
	record: MiniRecord
}): Promise<Record[]> =>
	new Promise((success, reject) => {
		base(view).update(
			[{ id, fields: record }],
			(err: string, records: Record[]) => {
				if (err) {
					reject(err)
					return
				}
				success(records)
			}
		)
	})

export const updateBySlug = async ({
	base,
	view,
	record,
	slug,
}: {
	base: (view: string) => any
	view: string
	record: MiniRecord
	slug: string
}): Promise<ReturnedRecord> => {
	const createdRecords = await read({
		base,
		view,
		opts: {
			maxRecords: 1,
			filterByFormula: `{slug} = '${slug}'`,
		},
	})
	if (!createdRecords.length) {
		new Notice(NOTE_NOT_FOUND)
		return
	}
	const records = await update({
		base,
		view,
		id: createdRecords[0].id,
		record,
	})

	return {
		...records[0].fields,
		id: records[0].id,
	}
}
