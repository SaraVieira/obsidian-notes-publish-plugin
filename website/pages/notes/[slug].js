import Airtable from 'airtable-plus'
import Head from 'next/head'

import ReactMarkdown from 'react-markdown'

import { Code } from '../../Components/Code'
export default function Home({ note }) {
	return (
		<>
			<Head>
				<title>{note.title}</title>
			</Head>
			<ReactMarkdown components={{ code: Code }}>
				{note.data}
			</ReactMarkdown>
		</>
	)
}

export async function getServerSideProps({ query }) {
	const { AIRTABLEAPIKEY, AIRTABLEBASE, AIRTABLEVIEW } = process.env
	const base = new Airtable({
		baseID: AIRTABLEBASE,
		apiKey: AIRTABLEAPIKEY,
		tableName: AIRTABLEVIEW,
	})

	const records = await base.read({
		filterByFormula: `{slug} = '${query.slug}'`,
		maxRecords: 1,
	})

	return {
		props: { note: records[0].fields },
	}
}
