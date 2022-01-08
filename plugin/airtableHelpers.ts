type Record = {
	fields: {
		id?: string
		password?: string
		data?: string
		title?: string
		slug?: string
	}
	getId: () => string
}

type MiniRecord = Record['fields']

export const read = ({
	base,
	view,
	opts,
}: {
	base: (view: string) => any
	view: string
	opts: any
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
